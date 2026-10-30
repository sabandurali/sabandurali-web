import type { SiteLocale } from "@/content/locales";

/**
 * Interface text of the photograph pages that the shared publication copy
 * does not carry: the archive record link, the district links and the
 * Turkish-fallback notes of the English list.
 */
export type PhotoCopy = {
  /** Link text of an archive photo's record (the credit's source link). */
  sourceRecord: string;
  /** Link to the guide of the photo's district. */
  districtGuide: (district: string) => string;
  /** Heading of the other photographs of the same district. */
  sameDistrict: (district: string) => string;
  /** Badge of a photograph listed on a page in another language. */
  inLanguage: Record<SiteLocale, string>;
  /** Heading of the Turkish photographs on the English list. */
  turkishFallbackTitle: string;
  /** Note above the Turkish photographs on the English list. */
  turkishFallbackNote: string;
};

export const photoCopy = {
  tr: {
    sourceRecord: "Kaynak kaydı",
    districtGuide: (district) => `${district} ilçe rehberi`,
    sameDistrict: (district) => `${district} ilçesinden fotoğraflar`,
    inLanguage: { tr: "Türkçe", en: "İngilizce" },
    turkishFallbackTitle: "Türkçe fotoğraflar",
    turkishFallbackNote: "Bu fotoğraflar yalnızca Türkçe yayımlandı.",
  },
  en: {
    sourceRecord: "Source record",
    districtGuide: (district) => `${district} district guide (in Turkish)`,
    sameDistrict: (district) => `More photographs from ${district}`,
    inLanguage: { tr: "In Turkish", en: "In English" },
    turkishFallbackTitle: "Photographs in Turkish",
    turkishFallbackNote:
      "No photograph has an English page yet. These photographs are published in Turkish; their pages open in Turkish.",
  },
} as const satisfies Record<SiteLocale, PhotoCopy>;
