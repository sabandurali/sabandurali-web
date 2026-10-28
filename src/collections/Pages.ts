import {
  ValidationError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type Where,
} from "payload";
import { pageBlocks } from "@/blocks/pageBlocks";
import { getText, imageMediaFilter, isRecord } from "@/collections/validation";
import {
  adminOnly,
  adminOrEditor,
  publishedPageOrAdminOrEditor,
} from "@/lib/payloadAccess";
import { normalizeSlug } from "@/lib/localizedSlug";
import { preventDeletingHomePage } from "@/lib/payloadDeleteGuards";
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
  "arastirma-ve-analiz",
  "calisma-alanlari",
  "en",
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
        "ana-sayfa adresi eski Ana Sayfa kaydına ayrılmıştır ve / adresine yönlenir. Ana sayfa için Sayfa türünü 'Ana sayfa' seçin.",
      path: "slug",
    });
  }

  // There is no English standard-page route yet (/en/<slug> returns 404), so
  // such a page can be drafted but not published.
  if (pageType === "standard" && language === "en" && status === "published") {
    errors.push({
      message:
        "İngilizce standart sayfaların henüz bir site adresi yok. Yalnız İngilizce Ana sayfa yayınlanabilir; bu sayfayı taslak olarak saklayın.",
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
          "Yayındaki Ana Sayfa tam olarak bir görünür Hero, Hakkımda ve Çalışma Alanları bloğu içermelidir.",
        path: "layout",
      });
    }

    const unsupportedBlocks = getVisibleUnsupportedHomeBlocks(layout);

    if (status === "published" && unsupportedBlocks.length > 0) {
      errors.push({
        message: `Ana Sayfa yalnız Hero, Hakkımda ve Çalışma Alanları bloklarını gösterir. Şu blokları silin veya gizleyin: ${[...new Set(unsupportedBlocks)].join(", ")}.`,
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

const setPublishedAtOnFirstPublish: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
}) => {
  const wasPublished = originalDoc?._status === "published";
  const willBePublished = data._status === "published";

  if (!wasPublished && willBePublished && !data.publishedAt) {
    return {
      ...data,
      publishedAt: new Date().toISOString(),
    };
  }

  return data;
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
                  : "Slug küçük harf, sayı ve tek tirelerden oluşmalıdır.",
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
                  "İlk yayında otomatik atanır. Gelecek tarih planlı yayın anlamına gelir.",
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
                {
                  name: "title",
                  type: "text",
                  label: "SEO başlığı",
                  maxLength: 60,
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "SEO açıklaması",
                  maxLength: 160,
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
    beforeChange: [setPublishedAtOnFirstPublish],
    beforeDelete: [preventDeletingHomePage],
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
