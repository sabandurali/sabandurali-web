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
              label: "Başlık",
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
              label: "Kısa açıklama",
              localized: true,
            },
            {
              name: "altText",
              type: "text",
              label: "Alternatif metin",
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
              label: "Medya dosyası",
              admin: {
                description:
                  "Aynı fiziksel görseli yeniden yüklemeyin; mevcut Media kaydını seçin.",
              },
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
              label: "Kategori / koleksiyon",
              admin: {
                description:
                  "Fotoğraf birden fazla koleksiyonda referanslanabilir.",
              },
            },
            {
              type: "collapsible",
              label: "İlçe rehberi ilişkisi",
              admin: { initCollapsed: true },
              fields: [
                { name: "district", type: "select", options: districtOptions, index: true, label: "İlçe" },
                { name: "neighborhood", type: "text", localized: true, label: "Mahalle / konum" },
                { name: "districtPhotoCategory", type: "select", label: "İlçe fotoğraf kategorisi", options: ["mimari", "sokak", "tarih", "yasam", "ulasim", "doga", "gece"] },
                { name: "dayPeriod", type: "select", label: "Gündüz / gece", options: ["gunduz", "gece"] },
              ],
            },
            {
              name: "tags",
              type: "relationship",
              relationTo: "tags",
              hasMany: true,
              label: "Etiketler",
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
            { name: "featured", type: "checkbox", defaultValue: false, label: "Öne çıkar" },
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
              label: "Yayın tarihi",
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
