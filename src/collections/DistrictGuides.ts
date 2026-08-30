import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import { districtOptions } from "@/content/districts/district-registry";
import { adminOnly, adminOrEditor, publishedOrAdminOrEditor } from "@/lib/payloadAccess";

const setPublishedAtOnFirstPublish: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (originalDoc?._status !== "published" && data._status === "published" && !data.publishedAt) {
    return { ...data, publishedAt: new Date().toISOString() };
  }
  return data;
};

const textArea = (name: string, label: string) => ({ name, label, type: "textarea" as const, localized: true });

export const DistrictGuides: CollectionConfig = {
  slug: "district-guides",
  labels: { singular: "İlçe Rehberi", plural: "İlçe Rehberleri" },
  access: { create: adminOrEditor, update: adminOrEditor, delete: adminOnly, read: publishedOrAdminOrEditor },
  admin: { group: "İçerik", useAsTitle: "district", defaultColumns: ["district", "_status", "publishedAt", "updatedAt"] },
  fields: [
    { name: "district", type: "select", required: true, unique: true, index: true, options: districtOptions, label: "İlçe" },
    { type: "tabs", tabs: [
      { label: "01 — İlçeyi Tanı", fields: [
        textArea("history", "Tarihçe"), textArea("life", "Yaşam"), textArea("transportation", "Ulaşım"),
        { name: "facts", label: "Temel veriler", type: "group", fields: [
          { name: "population", type: "text", label: "Nüfus" }, { name: "populationYear", type: "number", label: "Nüfus veri yılı" },
          { name: "areaKm2", type: "number", label: "Yüzölçümü (km²)" }, { name: "neighborhoodCount", type: "number", label: "Mahalle sayısı" },
          { name: "neighboringDistricts", type: "text", label: "Komşu ilçeler" }, { name: "locationSummary", type: "textarea", localized: true, label: "Konum / kısa tanım" },
        ] },
      ] },
      { label: "02 — Mahalleler", fields: [
        { name: "neighborhoods", type: "array", label: "Mahalleler", fields: [ { name: "name", type: "text", required: true }, { name: "featured", type: "checkbox", defaultValue: false, label: "Öne çıkan" }, textArea("description", "Kısa açıklama"), { name: "image", type: "upload", relationTo: "media", label: "Fotoğraf" } ] },
      ] },
      { label: "03 — Gayrimenkul", fields: [
        textArea("housingTexture", "Konut & yapı dokusu"), textArea("regionalAssessment", "Bölgesel değerlendirme"),
        { name: "marketData", type: "group", label: "Fiyat & kira verileri", fields: [ { name: "salePricePerM2", type: "number", label: "Ortalama m² satış fiyatı" }, { name: "averageRent", type: "number", label: "Ortalama kira" }, { name: "dataDate", type: "date", label: "Veri tarihi" }, { name: "source", type: "text", label: "Veri kaynağı" }, textArea("description", "Kısa açıklama") ] },
      ] },
      { label: "05 — Şehir & İmar", fields: [
        { name: "planningDevelopments", type: "array", label: "Gelişmeler", fields: [ { name: "title", type: "text", localized: true, required: true }, textArea("summary", "Kısa açıklama"), { name: "neighborhood", type: "text", label: "Mahalle" }, { name: "date", type: "date", label: "Tarih" }, { name: "status", type: "select", options: ["teklif", "planlama", "belediye-meclisi-karari", "onay", "aski", "uygulama", "tamamlandi"], label: "Durum" }, { name: "officialSource", type: "text", label: "Resmî kaynak URL" }, { name: "checkedAt", type: "date", label: "Son kontrol tarihi" } ] },
      ] },
      { label: "Yayın", fields: [ { name: "publishedAt", type: "date", label: "Yayın tarihi", admin: { description: "04 İlçeden Kareler Photos; 06 Araştırmalar ve 07 İlçeden Haberler Articles koleksiyonundaki ilçe ilişkilerinden gelir." } } ] },
    ] },
  ],
  hooks: { beforeChange: [setPublishedAtOnFirstPublish] },
  versions: { drafts: true, maxPerDoc: 25 },
};
