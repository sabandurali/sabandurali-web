import type {
  CollectionConfig,
  RichTextField,
  TextFieldSingleValidation,
} from "payload";
import { richText as validateRichText } from "payload/shared";
import {
  adminOnly,
  adminOrEditor,
  publishedOrAdminOrEditor,
  hideNonPublicRichTextLinks,
} from "@/lib/payloadAccess";
import {
  createLocalizedSlugField,
  createLocalizedSlugHook,
} from "@/lib/localizedSlug";
import { ensurePublishedAt } from "@/lib/publishedAt";
import { createRevalidationHooks } from "@/lib/revalidation";
import { districtOptions } from "@/content/districts/district-registry";
import {
  hasMeaningfulRichText,
  imageMediaFilter,
  isHttpsUrl,
  validateOptionalSiteCanonical,
  SEO_DESCRIPTION_MAX_LENGTH,
  SEO_TITLE_MAX_LENGTH,
} from "@/collections/validation";
import { getText, isRecord } from "@/content/guards";

/** The author every article has unless an editor names someone else. */
export const DEFAULT_ARTICLE_AUTHOR = "Şaban Durali";

const revalidation = createRevalidationHooks("articles");

function isDistrictNews(data: unknown): boolean {
  return isRecord(data) && data.articleType === "district-news";
}

/**
 * The public site hides an article without visible body text, so publishing
 * one is refused here instead. District news carry only a short summary and
 * a source link by design. Runs after Payload's own rich text validation.
 * Drafts are saved without field validation.
 */
export const validateArticleContent: NonNullable<
  RichTextField["validate"]
> = async (value, options) => {
  const result = await validateRichText(value, options);

  if (result !== true) return result;

  return isDistrictNews(options.data) || hasMeaningfulRichText(value)
    ? true
    : "Yayımlanan makalenin bu dilde görünür bir içeriği olmalıdır.";
};

export const validateNewsSourceName: TextFieldSingleValidation = (
  value,
  { data },
) =>
  isDistrictNews(data) && getText(value) === null
    ? "İlçe haberi için orijinal kaynağın adı zorunludur."
    : true;

export const validateNewsSourceUrl: TextFieldSingleValidation = (
  value,
  { data },
) => {
  if (value === null || value === undefined || value === "") {
    return isDistrictNews(data)
      ? "İlçe haberi için orijinal haberin https:// adresi zorunludur."
      : true;
  }

  return (
    isHttpsUrl(value) || "Geçerli ve https:// ile başlayan bir adres girin."
  );
};

export const Articles: CollectionConfig = {
  slug: "articles",
  access: {
    create: adminOrEditor,
    delete: adminOnly,
    read: publishedOrAdminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: [
      "title",
      "categories",
      "_status",
      "publishedAt",
      "updatedAt",
    ],
    group: "İçerik",
    useAsTitle: "title",
  },
  labels: {
    plural: "Makaleler & Araştırmalar",
    singular: "Makale / Araştırma",
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Başlık",
      localized: true,
      required: true,
    },
    createLocalizedSlugField({
      collection: "articles",
      sourceField: "title",
    }),
    {
      name: "excerpt",
      type: "textarea",
      label: "Kısa özet",
      localized: true,
      maxLength: 320,
      required: true,
    },
    {
      name: "content",
      type: "richText",
      label: "Makale içeriği",
      localized: true,
      hooks: { afterRead: [hideNonPublicRichTextLinks] },
      admin: {
        description:
          "İlçe haberi türünde tam metin saklanmaz; kısa özgün özet ve kaynak bağlantısı kullanılır. Diğer türlerde yayın için içerik zorunludur.",
      },
      validate: validateArticleContent,
    },
    {
      name: "categories",
      type: "relationship",
      hasMany: true,
      index: true,
      relationTo: "categories",
      required: true,
      label: "Çalışma alanı / kategori",
      admin: {
        description:
          "İçeriğin sitede hangi çalışma alanı ve konu altında bulunacağını seçin.",
      },
    },
    {
      name: "featuredImage",
      type: "upload",
      label: "Öne çıkan görsel",
      relationTo: "media",
      filterOptions: imageMediaFilter,
    },
    {
      name: "featuredImageAlt",
      type: "text",
      admin: {
        description:
          "Görseli, bu makaledeki bağlamına göre açıklayan alternatif metin.",
      },
      localized: true,
    },
    {
      name: "featured",
      type: "checkbox",
      admin: {
        position: "sidebar",
      },
      defaultValue: false,
    },
    {
      name: "author",
      type: "group",
      label: "Yazar",
      fields: [
        {
          name: "name",
          type: "text",
          label: "Yazar adı",
          defaultValue: DEFAULT_ARTICLE_AUTHOR,
          admin: {
            description:
              "Yapılandırılmış veride (JSON-LD) ve paylaşım etiketlerinde yazar olarak görünür. Boş bırakılırsa Şaban Durali kullanılır.",
          },
        },
      ],
    },
    {
      type: "collapsible",
      label: "İçerik türü ve ilçe ilişkisi",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "articleType",
          type: "select",
          defaultValue: "article",
          options: [
            { label: "Makale", value: "article" },
            { label: "İlçe araştırması", value: "district-research" },
            { label: "İlçeden haber", value: "district-news" },
          ],
          required: true,
          admin: {
            description:
              "Normal makale, ilçe araştırması veya kaynak bağlantılı ilçe haberi ayrımını yapın.",
          },
        },
        {
          name: "district",
          type: "select",
          options: districtOptions,
          index: true,
          label: "İlgili ilçe",
        },
        { name: "districtNeighborhood", type: "text", label: "İlgili mahalle" },
        {
          name: "newsCategory",
          type: "select",
          label: "Haber kategorisi",
          options: [
            "ulasim",
            "sehircilik",
            "belediye",
            "kultur",
            "yasam",
            "gayrimenkul",
            "egitim",
            "cevre",
            "onemli-yerel-gelismeler",
          ],
          admin: {
            condition: (_, siblingData) =>
              siblingData?.articleType === "district-news",
          },
        },
        {
          name: "externalSource",
          type: "group",
          label: "Orijinal kaynak",
          admin: {
            condition: (_, siblingData) =>
              siblingData?.articleType === "district-news",
            description:
              "İlçe haberi yayınlanırken kaynak adı ve https:// ile başlayan orijinal haber adresi zorunludur.",
          },
          fields: [
            {
              name: "name",
              type: "text",
              label: "Kaynak adı",
              validate: validateNewsSourceName,
            },
            {
              name: "url",
              type: "text",
              label: "Orijinal haber URL'si",
              validate: validateNewsSourceUrl,
            },
            { name: "checkedAt", type: "date", label: "Son kontrol tarihi" },
          ],
        },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      label: "Yayın tarihi",
      admin: {
        description:
          "İlk yayında otomatik atanır; yayındaki bir kayıtta boşaltılırsa önceki tarih korunur; gerekirse elle düzenlenebilir. Gelecek tarih planlı yayın anlamına gelir.",
        position: "sidebar",
      },
    },
    {
      name: "seo",
      type: "group",
      label: "SEO",
      fields: [
        {
          name: "metaTitle",
          type: "text",
          localized: true,
          maxLength: SEO_TITLE_MAX_LENGTH,
        },
        {
          name: "metaDescription",
          type: "textarea",
          localized: true,
          maxLength: SEO_DESCRIPTION_MAX_LENGTH,
        },
        {
          name: "canonical",
          type: "text",
          label: "Canonical adresi",
          localized: true,
          admin: {
            description:
              "Boş bırakılırsa makalenin kendi adresi kullanılır. Yalnız site içi yol (/makaleler/...) veya https://www.sabandurali.com adresi girilebilir.",
          },
          validate: validateOptionalSiteCanonical,
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
      ],
    },
  ],
  hooks: {
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
    beforeChange: [ensurePublishedAt],
    beforeValidate: [
      createLocalizedSlugHook({
        collection: "articles",
        sourceField: "title",
      }),
    ],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
};
