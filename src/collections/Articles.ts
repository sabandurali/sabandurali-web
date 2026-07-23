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
  fields: [
    {
      name: "title",
      type: "text",
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
      localized: true,
      maxLength: 320,
      required: true,
    },
    {
      name: "content",
      type: "richText",
      localized: true,
      required: true,
    },
    {
      name: "categories",
      type: "relationship",
      hasMany: true,
      index: true,
      relationTo: "categories",
      required: true,
    },
    {
      name: "featuredImage",
      type: "upload",
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
      name: "publishedAt",
      type: "date",
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
