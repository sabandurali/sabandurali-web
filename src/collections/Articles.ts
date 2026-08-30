import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import {
  adminOnly,
  adminOrEditor,
  publishedOrAdminOrEditor,
} from "@/lib/payloadAccess";
import {
  createLocalizedSlugField,
  createLocalizedSlugHook,
} from "@/lib/localizedSlug";
import { districtOptions } from "@/content/districts/district-registry";

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
      admin: {
        description:
          "İlçe haberi türünde tam metin saklanmaz; kısa özgün özet ve kaynak bağlantısı kullanılır.",
      },
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
          options: ["ulasim", "sehircilik", "belediye", "kultur", "yasam", "gayrimenkul", "egitim", "cevre", "onemli-yerel-gelismeler"],
          admin: { condition: (_, siblingData) => siblingData?.articleType === "district-news" },
        },
        {
          name: "externalSource",
          type: "group",
          label: "Orijinal kaynak",
          admin: { condition: (_, siblingData) => siblingData?.articleType === "district-news" },
          fields: [
            { name: "name", type: "text", label: "Kaynak adı" },
            { name: "url", type: "text", label: "Orijinal haber URL'si" },
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
          "İlk yayında otomatik atanır; gerekirse elle düzenlenebilir.",
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
          maxLength: 60,
        },
        {
          name: "metaDescription",
          type: "textarea",
          localized: true,
          maxLength: 160,
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [setPublishedAtOnFirstPublish],
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
