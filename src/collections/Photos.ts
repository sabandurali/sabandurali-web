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
    return { ...data, publishedAt: new Date().toISOString() };
  }

  return data;
};

export const Photos: CollectionConfig = {
  slug: "photos",
  access: {
    create: adminOrEditor,
    delete: adminOnly,
    read: publishedOrAdminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: [
      "title",
      "collections",
      "_status",
      "publishedAt",
      "updatedAt",
    ],
    group: "Fotoğrafçılık",
    useAsTitle: "title",
  },
  labels: {
    plural: "Fotoğraflar",
    singular: "Fotoğraf",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Fotoğraf",
          fields: [
            {
              name: "title",
              type: "text",
              localized: true,
              required: true,
            },
            createLocalizedSlugField({
              collection: "photos",
              sourceField: "title",
            }),
            {
              name: "description",
              type: "textarea",
              localized: true,
            },
            {
              name: "altText",
              type: "text",
              localized: true,
              required: true,
              admin: {
                description:
                  "Public görselde önce bu alternatif metin kullanılır.",
              },
            },
            {
              name: "image",
              type: "relationship",
              relationTo: "media",
              required: true,
            },
            {
              name: "collections",
              type: "relationship",
              relationTo: "photo-collections",
              hasMany: true,
              required: true,
              minRows: 1,
            },
            {
              name: "tags",
              type: "relationship",
              relationTo: "tags",
              hasMany: true,
            },
            {
              type: "row",
              fields: [
                { name: "takenAt", type: "date", label: "Çekim tarihi" },
                {
                  name: "locationName",
                  type: "text",
                  localized: true,
                  label: "Konum adı",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "photographer",
                  type: "text",
                  defaultValue: "Şaban Durali",
                  required: true,
                },
                { name: "creditLicense", type: "text", label: "Kredi / lisans" },
              ],
            },
            { name: "featured", type: "checkbox", defaultValue: false },
          ],
        },
        {
          label: "EXIF",
          fields: [
            {
              name: "exif",
              type: "group",
              fields: [
                { name: "camera", type: "text" },
                { name: "lens", type: "text" },
                { name: "focalLength", type: "text", label: "Odak uzaklığı" },
                { name: "aperture", type: "text", label: "Diyafram" },
                { name: "shutterSpeed", type: "text", label: "Enstantane" },
                { name: "iso", type: "text", label: "ISO" },
              ],
            },
          ],
        },
        {
          label: "Yayın ve SEO",
          fields: [
            {
              name: "publishedAt",
              type: "date",
              admin: {
                description: "İlk yayında otomatik atanır; gelecek tarih planlı yayın anlamına gelir.",
              },
            },
            {
              name: "seo",
              type: "group",
              fields: [
                { name: "metaTitle", type: "text", localized: true, maxLength: 60 },
                {
                  name: "metaDescription",
                  type: "textarea",
                  localized: true,
                  maxLength: 160,
                },
                {
                  name: "openGraphImage",
                  type: "relationship",
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
    beforeValidate: [
      createLocalizedSlugHook({ collection: "photos", sourceField: "title" }),
    ],
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
};
