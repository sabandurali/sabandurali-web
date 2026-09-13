import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import { mapDistrictGuide } from "@/content/districts/district-guide-projection";
import { APIError } from "payload";
import {
  districtSectionOptions,
  isPublicSourceUrl,
  sectionIsPublic,
  type DistrictSource,
} from "@/content/districts/district-content-policy";
import { districtOptions } from "@/content/districts/district-registry";
import {
  adminOnly,
  adminOrEditor,
  isAdminOrEditor,
  publishedOrAdminOrEditor,
} from "@/lib/payloadAccess";

const setPublishedAtOnFirstPublish: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
}) => {
  if (
    originalDoc?._status !== "published" &&
    data._status === "published" &&
    !data.publishedAt
  ) {
    return { ...data, publishedAt: new Date().toISOString() };
  }
  return data;
};

const protectDistrictPublication: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
}) => {
  if (
    originalDoc?.district &&
    data.district !== undefined &&
    data.district !== originalDoc.district
  ) {
    throw new APIError(
      "İlçe slug değeri oluşturulduktan sonra değiştirilemez.",
      400,
    );
  }
  const merged = { ...originalDoc, ...data };
  if (!districtOptions.some((option) => option.value === merged.district)) {
    throw new APIError("Merkezi registry içinden geçerli bir ilçe seçin.", 400);
  }
  if (merged._status === "published") {
    const sources = (merged.sources ?? []) as DistrictSource[];
    const reviewed = merged.reviewedSections ?? [];
    for (const section of ["summary", "history", "geography"] as const) {
      if (
        !merged[section]?.trim() ||
        !sectionIsPublic(section, reviewed, sources)
      ) {
        throw new APIError(
          `Yayın için ${section} metni, bölüm onayı ve kontrol edilmiş kaynak gereklidir.`,
          400,
        );
      }
    }
  }
  return data;
};

const textArea = (name: string, label: string) => ({
  name,
  label,
  type: "textarea" as const,
  localized: true,
});

export const DistrictGuides: CollectionConfig = {
  slug: "district-guides",
  labels: { singular: "İlçe Rehberi", plural: "İlçe Rehberleri" },
  access: {
    create: adminOrEditor,
    update: adminOrEditor,
    delete: adminOnly,
    read: publishedOrAdminOrEditor,
  },
  admin: {
    group: "İçerik",
    useAsTitle: "district",
    defaultColumns: ["district", "_status", "publishedAt", "updatedAt"],
  },
  fields: [
    {
      name: "district",
      type: "select",
      required: true,
      unique: true,
      index: true,
      options: districtOptions,
      label: "İlçe",
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "01 — İlçeyi Tanı",
          fields: [
            textArea("summary", "İlçeye genel bakış / kart özeti"),
            textArea(
              "geography",
              "Coğrafya, demografi ve İstanbul içindeki rolü",
            ),
            textArea("history", "Tarihçe"),
            textArea("life", "Yaşam"),
            textArea("transportation", "Ulaşım"),
            {
              name: "facts",
              label: "Temel veriler",
              type: "group",
              fields: [
                { name: "population", type: "text", label: "Nüfus" },
                {
                  name: "populationYear",
                  type: "number",
                  label: "Nüfus veri yılı",
                },
                { name: "areaKm2", type: "number", label: "Yüzölçümü (km²)" },
                {
                  name: "neighborhoodCount",
                  type: "number",
                  label: "Mahalle sayısı",
                },
                {
                  name: "neighboringDistricts",
                  type: "text",
                  label: "Komşu ilçeler",
                },
                {
                  name: "locationSummary",
                  type: "textarea",
                  localized: true,
                  label: "Konum / kısa tanım",
                },
              ],
            },
          ],
        },
        {
          label: "02 — Mahalleler",
          fields: [
            {
              name: "neighborhoods",
              type: "array",
              label: "Mahalleler",
              fields: [
                { name: "name", type: "text", required: true },
                {
                  name: "featured",
                  type: "checkbox",
                  defaultValue: false,
                  label: "Öne çıkan",
                },
                textArea("description", "Kısa açıklama"),
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  label: "Fotoğraf",
                },
              ],
            },
          ],
        },
        {
          label: "03 — Gayrimenkul",
          fields: [
            textArea("housingTexture", "Konut & yapı dokusu"),
            textArea("regionalAssessment", "Bölgesel değerlendirme"),
            {
              name: "marketData",
              type: "group",
              label: "Fiyat & kira verileri",
              fields: [
                {
                  name: "salePricePerM2",
                  type: "number",
                  label: "Ortalama m² satış fiyatı",
                },
                { name: "averageRent", type: "number", label: "Ortalama kira" },
                { name: "dataDate", type: "date", label: "Veri tarihi" },
                { name: "source", type: "text", label: "Veri kaynağı" },
                { name: "sourceUrl", type: "text", label: "Kaynak URL" },
                { name: "checkedAt", type: "date", label: "Son doğrulama" },
                {
                  name: "needsVerification",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Doğrulama gerekli",
                },
                textArea("description", "Kısa açıklama"),
              ],
            },
          ],
        },
        {
          label: "05 — Şehir & İmar",
          fields: [
            {
              name: "planningDevelopments",
              type: "array",
              label: "Gelişmeler",
              fields: [
                {
                  name: "title",
                  type: "text",
                  localized: true,
                  required: true,
                },
                textArea("summary", "Kısa açıklama"),
                { name: "neighborhood", type: "text", label: "Mahalle" },
                { name: "date", type: "date", label: "Tarih" },
                {
                  name: "status",
                  type: "select",
                  options: [
                    "teklif",
                    "planlama",
                    "belediye-meclisi-karari",
                    "onay",
                    "aski",
                    "ihale",
                    "insaat",
                    "uygulama",
                    "tamamlandi",
                    "belirsiz",
                  ],
                  label: "Durum",
                },
                {
                  name: "officialSource",
                  type: "text",
                  label: "Resmî kaynak URL",
                },
                {
                  name: "checkedAt",
                  type: "date",
                  label: "Son kontrol tarihi",
                },
                {
                  name: "needsVerification",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Doğrulama gerekli",
                },
              ],
            },
          ],
        },
        {
          label: "Saha ve araştırma",
          fields: [
            textArea(
              "placesGuide",
              "Görülecek ve fotoğraflanacak yerler — bölge, gündüz/gece, fotoğraf değeri",
            ),
            textArea("distinctiveFeatures", "İlçeyi özel kılan şeyler"),
            textArea("researchTopics", "İleri araştırma konuları"),
          ],
        },
        {
          label: "Kaynaklar ve doğrulama",
          fields: [
            {
              name: "reviewedSections",
              type: "select",
              hasMany: true,
              options: [...districtSectionOptions],
              label: "Editoryal incelemesi tamamlanan bölümler",
              admin: {
                description:
                  "Ham PDF metnini onaylamak yerine bölüm metnini düzenleyin ve destekleyen kaynakları kontrol edin. Kaynaksız veya eski dinamik veri public görünmez.",
              },
            },
            {
              name: "sources",
              type: "array",
              label: "Kaynaklar",
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                  label: "Başlık",
                },
                {
                  name: "publisher",
                  type: "text",
                  required: true,
                  label: "Gerçek yayıncı / kurum",
                },
                {
                  name: "url",
                  type: "text",
                  required: true,
                  label: "Kaynak URL",
                  validate: (value: unknown) =>
                    isPublicSourceUrl(value) || "HTTP(S) kaynak adresi girin.",
                },
                {
                  name: "sourceType",
                  type: "select",
                  required: true,
                  defaultValue: "unclassified",
                  options: [
                    { label: "Resmî", value: "official" },
                    { label: "Akademik / kurumsal", value: "academic" },
                    { label: "İkincil", value: "secondary" },
                    { label: "Piyasa platformu", value: "market" },
                    { label: "Sınıflandırılmadı", value: "unclassified" },
                  ],
                },
                {
                  name: "primary",
                  type: "checkbox",
                  defaultValue: false,
                  label: "İddia için birincil kaynak",
                },
                {
                  name: "dataDate",
                  type: "date",
                  label: "Veri / yayın tarihi",
                },
                {
                  name: "checkedAt",
                  type: "date",
                  label: "Son doğrulama tarihi",
                },
                {
                  name: "needsVerification",
                  type: "checkbox",
                  defaultValue: true,
                  label: "Doğrulama gerekli",
                },
                {
                  name: "sections",
                  type: "select",
                  hasMany: true,
                  options: [...districtSectionOptions],
                  label: "Desteklediği bölümler",
                },
              ],
            },
            {
              name: "researchNotes",
              type: "textarea",
              label: "Public dışı araştırma notları",
              access: { read: ({ req }) => isAdminOrEditor(req.user) },
              admin: {
                description:
                  "Ham mahalle listeleri, dinamik iddialar ve PDF kaynak notları. Bu alan public sayfaya gönderilmez.",
              },
            },
            {
              name: "importProvenance",
              type: "json",
              label: "Aktarım kaydı",
              access: { read: ({ req }) => isAdminOrEditor(req.user) },
              admin: {
                readOnly: true,
                description:
                  "PDF adı/hash, dönüşüm sürümü ve aktarılan alanların fingerprint kaydı.",
              },
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
                  "04 İlçeden Kareler Photos; 06 Araştırmalar ve 07 İlçeden Haberler Articles koleksiyonundaki ilçe ilişkilerinden gelir.",
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [protectDistrictPublication, setPublishedAtOnFirstPublish],
    afterRead: [
      ({ doc, req, overrideAccess }) => {
        if (overrideAccess || isAdminOrEditor(req.user)) return doc;
        // Apply the same gate to anonymous REST/GraphQL reads, not only page rendering.
        return {
          ...doc,
          ...mapDistrictGuide(doc),
          researchNotes: undefined,
          importProvenance: undefined,
        };
      },
    ],
  },
  versions: { drafts: true, maxPerDoc: 25 },
};
