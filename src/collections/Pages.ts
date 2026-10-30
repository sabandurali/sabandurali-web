import {
  APIError,
  ValidationError,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type Where,
} from "payload";
import { publicLinksField, seoPreviewField } from "@/collections/admin-fields";
import { pageBlocks } from "@/blocks/pageBlocks";
import {
  SEO_DESCRIPTION_MAX_LENGTH,
  SEO_TITLE_MAX_LENGTH,
  imageMediaFilter,
} from "@/collections/validation";
import { getText, isRecord } from "@/content/guards";
import type { SiteLocale } from "@/content/locales";
import { isRenderableHomeBlock } from "@/content/pages/payload-page-mapper";
import {
  adminOnly,
  adminOrEditor,
  isAdminOrEditor,
  publishedPageOrAdminOrEditor,
} from "@/lib/payloadAccess";
import { SLUG_RULE_MESSAGE } from "@/content/shared/slug";
import { normalizeSlug } from "@/lib/localizedSlug";
import { preventDeletingHomePage } from "@/lib/payloadDeleteGuards";
import { ensurePublishedAt } from "@/lib/publishedAt";
import { createRevalidationHooks } from "@/lib/revalidation";

const revalidation = createRevalidationHooks("pages");

/**
 * Turkish standard pages are served at `/<slug>`, below every other top-level
 * Turkish route. A slug in this list would be shadowed by that route (or by
 * the admin, the API or the English tree). `collections.test.ts` compares the
 * list with the route folders in `src/app`, so a new top-level route cannot
 * be forgotten. `geri-bildirim` stays reserved for the retired feedback page.
 */
export const RESERVED_TURKISH_SLUGS: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "ara",
  "arastirma-ve-analiz",
  "calisma-alanlari",
  "en",
  "feed.xml",
  "fotograf",
  "fotograflar",
  "gayrimenkul-ve-istanbul",
  "geri-bildirim",
  "hakkimda",
  "iletisim",
  "istanbul",
  "kitaplar",
  "kitaplar-ve-ogrenme",
  "kvkk-aydinlatma-metni",
  "makaleler",
  "satis-ve-muzakere",
  "yapay-zeka-ve-teknoloji",
  "yonetim",
]);

/**
 * Slug of the legacy Turkish home: a standard page that `/` falls back to
 * when no "Ana sayfa" record exists. `/ana-sayfa` redirects to `/` (see
 * `next.config.ts`), so no other page may take this slug.
 */
export const LEGACY_TURKISH_HOME_SLUG = "ana-sayfa";

/** The only blocks the home page renders. */
export const HOME_BLOCK_TYPES: ReadonlySet<string> = new Set([
  "hero",
  "homeAbout",
  "homeFocusAreas",
]);

function countVisibleHomeBlocks(
  layout: unknown,
  blockType: "hero" | "homeAbout" | "homeFocusAreas",
): number {
  if (!Array.isArray(layout)) return 0;

  return layout.filter(
    (block) =>
      isRecord(block) &&
      block.blockType === blockType &&
      block.visible !== false,
  ).length;
}

/** Visible home blocks the public mapper would skip, as "hero#1" labels. */
export function getUnrenderableHomeBlocks(
  layout: unknown,
  language: SiteLocale,
): string[] {
  if (!Array.isArray(layout)) return [];

  return layout.flatMap((block, index) =>
    isRecord(block) &&
    block.visible !== false &&
    typeof block.blockType === "string" &&
    HOME_BLOCK_TYPES.has(block.blockType) &&
    !isRenderableHomeBlock(block, language)
      ? [`${block.blockType}#${index + 1}`]
      : [],
  );
}

function getVisibleUnsupportedHomeBlocks(layout: unknown): string[] {
  if (!Array.isArray(layout)) return [];

  return layout.flatMap((block) =>
    isRecord(block) &&
    block.visible !== false &&
    typeof block.blockType === "string" &&
    !HOME_BLOCK_TYPES.has(block.blockType)
      ? [block.blockType]
      : [],
  );
}

export const validatePageIdentity: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data;

  const title = getText(data.title) ?? getText(originalDoc?.title);
  const previousSlug = getText(originalDoc?.slug);
  const requestedSlug = getText(data.slug);
  const slug = normalizeSlug(
    requestedSlug ??
      (operation === "update" ? previousSlug : null) ??
      title ??
      "",
  );
  const language =
    getText(data.language) ?? getText(originalDoc?.language) ?? "tr";
  const pageType =
    getText(data.pageType) ?? getText(originalDoc?.pageType) ?? "standard";
  const currentID = getText(data.id) ?? getText(originalDoc?.id);
  const status =
    getText(data._status) ?? getText(originalDoc?._status) ?? "draft";

  data.slug = slug;
  data.language = language;
  data.pageType = pageType;

  const errors: Array<{ message: string; path: string }> = [];

  if (slug === "") {
    errors.push({
      message: "Slug boş olamaz ve en az bir harf veya sayı içermelidir.",
      path: "slug",
    });
  }

  if (
    pageType === "standard" &&
    language === "tr" &&
    RESERVED_TURKISH_SLUGS.has(slug)
  ) {
    errors.push({
      message: "Bu slug mevcut özel bir Türkçe rota için ayrılmıştır.",
      path: "slug",
    });
  }

  if (
    pageType === "standard" &&
    language === "tr" &&
    slug === LEGACY_TURKISH_HOME_SLUG &&
    previousSlug !== LEGACY_TURKISH_HOME_SLUG
  ) {
    errors.push({
      message:
        "ana-sayfa adresi eski ana sayfa kaydına ayrılmıştır ve / adresine yönlenir. Ana sayfa için Sayfa türünü 'Ana sayfa' seçin.",
      path: "slug",
    });
  }

  // There is no English standard-page route yet (/en/<slug> returns 404), so
  // such a page can be drafted but not published.
  if (pageType === "standard" && language === "en" && status === "published") {
    errors.push({
      message:
        "İngilizce standart sayfaların henüz bir site adresi yok. Yalnız İngilizce Ana sayfa yayımlanabilir; bu sayfayı taslak olarak saklayın.",
      path: "language",
    });
  }

  if (slug !== "") {
    const slugWhere: Where = {
      and: [
        { slug: { equals: slug } },
        { language: { equals: language } },
        ...(currentID === null ? [] : [{ id: { not_equals: currentID } }]),
      ],
    };
    const duplicateSlug = await req.payload.find({
      collection: "pages",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: slugWhere,
    });

    if (duplicateSlug.docs.length > 0) {
      errors.push({
        message: "Bu dilde aynı slug değerine sahip başka bir sayfa var.",
        path: "slug",
      });
    }
  }

  if (pageType === "home") {
    const homeWhere: Where = {
      and: [
        { pageType: { equals: "home" } },
        { language: { equals: language } },
        ...(currentID === null ? [] : [{ id: { not_equals: currentID } }]),
      ],
    };
    const duplicateHome = await req.payload.find({
      collection: "pages",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: homeWhere,
    });

    if (duplicateHome.docs.length > 0) {
      errors.push({
        message: "Bu dil için yalnız bir ana sayfa kaydı oluşturulabilir.",
        path: "pageType",
      });
    }

    const layout = Array.isArray(data.layout)
      ? data.layout
      : originalDoc?.layout;

    if (
      status === "published" &&
      (countVisibleHomeBlocks(layout, "hero") !== 1 ||
        countVisibleHomeBlocks(layout, "homeAbout") !== 1 ||
        countVisibleHomeBlocks(layout, "homeFocusAreas") !== 1)
    ) {
      errors.push({
        message:
          "Yayındaki ana sayfa tam olarak bir görünür Hero, Hakkımda ve Çalışma Alanları bloğu içermelidir.",
        path: "layout",
      });
    }

    const unrenderableBlocks = getUnrenderableHomeBlocks(
      layout,
      language === "en" ? "en" : "tr",
    );

    if (status === "published" && unrenderableBlocks.length > 0) {
      errors.push({
        message: `Ana sayfa bloklarında zorunlu alanlar eksik veya bağlantılar geçersiz; yayındaki sitede gösterilemezler: ${unrenderableBlocks.join(", ")}. Başlık satırlarını, metinleri ve bağlantıları (etiket ve / ile başlayan ya da https adres) tamamlayın.`,
        path: "layout",
      });
    }

    const unsupportedBlocks = getVisibleUnsupportedHomeBlocks(layout);

    if (status === "published" && unsupportedBlocks.length > 0) {
      errors.push({
        message: `Ana sayfa yalnız Hero, Hakkımda ve Çalışma Alanları bloklarını gösterir. Şu blokları silin veya gizleyin: ${[...new Set(unsupportedBlocks)].join(", ")}.`,
        path: "layout",
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      {
        collection: "pages",
        errors,
        id: currentID ?? undefined,
        req,
      },
      req.t,
    );
  }

  return data;
};

type HomeChange = "unpublish" | "schedule" | "pageType" | "language";

/**
 * The changes in an update that would take a published home record off the
 * site. Saving a draft over the published home only writes a version, so it
 * is allowed, but a draft that changes the page type or language would break
 * the home as soon as it is published and is refused as well.
 */
export function getHomeBreakingChanges(
  data: unknown,
  home: { language: unknown },
  options: { draft: boolean; unpublishAllLocales: boolean; now: Date },
): HomeChange[] {
  if (!isRecord(data)) return options.unpublishAllLocales ? ["unpublish"] : [];

  const savingDraft = options.draft && data._status !== "published";
  const changes: HomeChange[] = [];

  if (
    options.unpublishAllLocales ||
    (!savingDraft && data._status === "draft")
  ) {
    changes.push("unpublish");
  }

  if (!savingDraft && data.publishedAt !== undefined) {
    const publishedAt =
      typeof data.publishedAt === "string" ? Date.parse(data.publishedAt) : NaN;

    if (!Number.isFinite(publishedAt) || publishedAt > options.now.getTime()) {
      changes.push("schedule");
    }
  }

  if (data.pageType !== undefined && data.pageType !== "home") {
    changes.push("pageType");
  }

  if (data.language !== undefined && data.language !== home.language) {
    changes.push("language");
  }

  return changes;
}

const homeChangeMessages: Record<HomeChange, string> = {
  unpublish: "yayından kaldırılamaz",
  schedule: "ileri bir tarihe planlanamaz ve yayın tarihi silinemez",
  pageType: "standart sayfaya çevrilemez",
  language: "başka bir dile taşınamaz",
};

/**
 * Keeps the published home records on the site. `/` would otherwise fall
 * back to the static content (COR-2). Runs before the operation because only
 * the operation arguments tell a draft save from an unpublish.
 */
export const protectPublishedHomePage: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (operation !== "update") return args;
  // This hook runs before access control. A REST or GraphQL request that
  // may not update pages is refused by access control anyway, so its
  // user-supplied `where` never reaches the overrideAccess query below
  // (which would otherwise answer whether the home matches it).
  if (req.payloadAPI !== "local" && !isAdminOrEditor(req.user)) return args;

  // Operation argument types differ per operation; read them as unknowns.
  const values = new Map<string, unknown>(Object.entries(args));
  const data = values.get("data");
  const id = values.get("id");
  // A bulk update's `where`, already parsed and typed by Payload.
  const where = "where" in args ? args.where : undefined;
  const unpublishAllLocales = values.get("unpublishAllLocales");
  const options = {
    draft: values.get("draft") === true,
    unpublishAllLocales:
      unpublishAllLocales === true || unpublishAllLocales === "true",
    now: new Date(),
  };
  // Without a stored language every language in the data counts as a
  // change, so this cheap check never misses an update that needs a look.
  if (
    getHomeBreakingChanges(data, { language: undefined }, options).length === 0
  ) {
    return args;
  }

  const target: Where | null =
    typeof id === "string" || typeof id === "number"
      ? { id: { equals: id } }
      : isRecord(where)
        ? where
        : null;

  if (target === null) return args;

  const homes = await req.payload.find({
    collection: "pages",
    depth: 0,
    draft: false,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        target,
        { pageType: { equals: "home" } },
        { _status: { equals: "published" } },
      ],
    },
  });

  for (const home of homes.docs) {
    const changes = getHomeBreakingChanges(data, home, options);

    if (changes.length > 0) {
      throw new APIError(
        `Yayındaki ${home.language === "en" ? "İngilizce" : "Türkçe"} ana sayfa ${changes.map((change) => homeChangeMessages[change]).join(", ")}. İçeriği düzenleyip yeniden yayımlayın; ana sayfayı değiştirmek için bu kaydı güncelleyin.`,
        400,
      );
    }
  }

  return args;
};

export const Pages: CollectionConfig = {
  slug: "pages",
  access: {
    create: adminOrEditor,
    // Deleting removes every version too; only an admin may do it. Editors
    // unpublish instead.
    delete: adminOnly,
    read: publishedPageOrAdminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: [
      "title",
      "language",
      "pageType",
      "_status",
      "publishedAt",
      "updatedAt",
    ],
    group: "İçerik",
    useAsTitle: "title",
  },
  labels: {
    plural: "Sayfalar",
    singular: "Sayfa",
  },
  lockDocuments: false,
  fields: [
    publicLinksField,
    {
      type: "tabs",
      tabs: [
        {
          label: "Temel bilgiler",
          fields: [
            {
              name: "title",
              type: "text",
              label: "Başlık",
              required: true,
            },
            {
              name: "slug",
              type: "text",
              label: "Slug",
              admin: {
                description:
                  "Başlıktan otomatik oluşur; gerekirse elle düzenlenebilir.",
              },
              index: true,
              required: true,
              validate: (value: unknown) =>
                typeof value === "string" &&
                value === normalizeSlug(value) &&
                value.length > 0
                  ? true
                  : SLUG_RULE_MESSAGE,
            },
            {
              name: "language",
              type: "select",
              label: "Dil",
              defaultValue: "tr",
              index: true,
              options: [
                { label: "Türkçe", value: "tr" },
                { label: "English", value: "en" },
              ],
              required: true,
            },
            {
              name: "pageType",
              type: "select",
              label: "Sayfa türü",
              defaultValue: "standard",
              index: true,
              options: [
                { label: "Ana sayfa", value: "home" },
                { label: "Standart sayfa", value: "standard" },
              ],
              required: true,
            },
            {
              name: "summary",
              type: "textarea",
              label: "Kısa açıklama",
              maxLength: 320,
              required: true,
            },
          ],
        },
        {
          label: "İçerik blokları",
          fields: [
            {
              name: "layout",
              type: "blocks",
              label: "Sayfa bölümleri",
              admin: {
                description:
                  "Bölümleri ekleyebilir, sürükleyerek sıralayabilir, gizleyebilir veya silebilirsiniz.",
              },
              blocks: pageBlocks,
            },
          ],
        },
        {
          label: "Yayın",
          fields: [
            {
              name: "publishedAt",
              type: "date",
              label: "Yayın tarihi",
              admin: {
                description:
                  "İlk yayında otomatik atanır; yayındaki bir kayıtta boşaltılırsa önceki tarih korunur. Gelecek tarih planlı yayın anlamına gelir.",
              },
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            {
              name: "seo",
              type: "group",
              label: "Arama ve paylaşım ayarları",
              fields: [
                seoPreviewField("pages"),
                {
                  name: "title",
                  type: "text",
                  label: "SEO başlığı",
                  maxLength: SEO_TITLE_MAX_LENGTH,
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "SEO açıklaması",
                  maxLength: SEO_DESCRIPTION_MAX_LENGTH,
                },
                {
                  name: "index",
                  type: "checkbox",
                  label: "Arama motorları indeksleyebilir",
                  defaultValue: true,
                },
                {
                  name: "follow",
                  type: "checkbox",
                  label: "Arama motorları bağlantıları takip edebilir",
                  defaultValue: true,
                },
                {
                  name: "socialImage",
                  type: "upload",
                  label: "Sosyal paylaşım görseli",
                  relationTo: "media",
                  filterOptions: imageMediaFilter,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
    beforeChange: [ensurePublishedAt],
    beforeDelete: [preventDeletingHomePage],
    beforeOperation: [protectPublishedHomePage],
    beforeValidate: [validatePageIdentity],
  },
  indexes: [
    {
      fields: ["language", "slug"],
      unique: true,
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
};
