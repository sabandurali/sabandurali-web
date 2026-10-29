import type { SiteLocale } from "@/content/locales";

export type VerifiedDistrictImage = {
  src: string;
  /** Turkish alt text. */
  alt: string;
  /** English alt text for English pages (WCAG 3.1.2). */
  altEn: string;
  /** Turkish credit line: author · date · licence · edit note. */
  credit: string;
  creditEn: string;
  recordUrl: string;
  licenseUrl: string;
  /** Pixel size of the file in `public/` (checked by the test). */
  width: number;
  height: number;
};

export const verifiedDistrictImages: Record<string, VerifiedDistrictImage> = {
  esenler: {
    src: "/workspaces/districts/esenler.jpg",
    alt: "Esenler Dörtyol Meydanı, Atışalanı Caddesi’nden görünüm, 23 Eylül 2021",
    altEn:
      "Dörtyol Square in Esenler, seen from Atışalanı Street, 23 September 2021",
    credit: "Mereyü · 23.09.2021 · CC BY-SA 4.0 · Görüntü kadraja sığdırıldı",
    creditEn: "Mereyü · 23.09.2021 · CC BY-SA 4.0 · Image cropped to fit",
    recordUrl:
      "https://commons.wikimedia.org/wiki/File:At%C4%B1%C5%9Falan%C4%B1_Caddesi%27nden_D%C3%B6rtyol_Meydan%C4%B1_1.jpg",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    width: 4000,
    height: 3000,
  },
  kadikoy: {
    src: "/workspaces/districts/kadikoy.jpg",
    alt: "Kadıköy Kurbağalıdere, 1904 tarihli arşiv kartpostalı",
    altEn: "Kurbağalıdere in Kadıköy, archival postcard dated 1904",
    credit: "Seyhun Binzet Koleksiyonu · 1904 · Kamu malı / Public domain",
    creditEn: "Seyhun Binzet Collection · 1904 · Public domain",
    recordUrl:
      "https://commons.wikimedia.org/wiki/File:1904_Seyhun_Binzet_Koleksiyonu_Kurba%C4%9Fal%C4%B1dere.jpg",
    licenseUrl: "https://commons.wikimedia.org/wiki/Template:PD-Ottoman",
    width: 1600,
    height: 860,
  },
};

export type LocalizedDistrictImage = {
  src: string;
  alt: string;
  credit: string;
  recordUrl: string;
  licenseUrl: string;
  width?: number;
  height?: number;
};

/** The verified image of a district with alt text and credit in `locale`. */
export function getVerifiedDistrictImage(
  district: string,
  locale: SiteLocale,
): LocalizedDistrictImage | null {
  const image = Object.hasOwn(verifiedDistrictImages, district)
    ? verifiedDistrictImages[district]
    : undefined;

  if (image === undefined) return null;

  return {
    src: image.src,
    alt: locale === "en" ? image.altEn : image.alt,
    credit: locale === "en" ? image.creditEn : image.credit,
    recordUrl: image.recordUrl,
    licenseUrl: image.licenseUrl,
    width: image.width,
    height: image.height,
  };
}
