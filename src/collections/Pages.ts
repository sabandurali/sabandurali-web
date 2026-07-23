import {
  ValidationError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type Where,
} from "payload";
import { pageBlocks } from "@/blocks/pageBlocks";
import {
  adminOrEditor,
  publishedPageOrAdminOrEditor,
} from "@/lib/payloadAccess";
import { normalizeSlug } from "@/lib/localizedSlug";

const RESERVED_TURKISH_SLUGS = new Set([
  "admin",
  "api",
  "en",
  "geri-bildirim",
  "iletisim",
  "kitaplar",
  "kvkk-aydinlatma-metni",
  "makaleler",
  "yonetim",
]);

function getText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

const validatePageIdentity: CollectionBeforeValidateHook = async ({
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
      message:
        "Bu slug mevcut özel bir Türkçe rota için ayrılmıştır.",
      path: "slug",
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
        message:
          "Bu dilde aynı slug değerine sahip başka bir sayfa var.",
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
    delete: adminOrEditor,
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
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [setPublishedAtOnFirstPublish],
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
