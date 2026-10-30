/**
 * Şaban Durali identity v1 (brand/saban-durali-kimlik-v1/). The logo is never
 * redrawn with text or CSS: the site shows the package's SVG files, copied
 * unchanged into public/brand/.
 */

export type BrandImage = {
  src: string;
  /** viewBox width of the SVG (every logo file is 256 units high). */
  width: number;
  height: number;
};

/** Horizontal logo for light grounds (paper header). Minimum 200 px wide. */
export const brandLogo = {
  src: "/brand/saban-durali-logo-color.svg",
  width: 2027,
  height: 256,
} as const satisfies BrandImage;

/** Horizontal logo for the sea ground (footer). Minimum 200 px wide. */
export const brandLogoOnDark = {
  src: "/brand/saban-durali-logo-color-ondark.svg",
  width: 2027,
  height: 256,
} as const satisfies BrandImage;

/** Name-only wordmark for narrow headers. Minimum 110 px wide. */
export const brandNameMark = {
  src: "/brand/saban-durali-wordmark-name-color.svg",
  width: 2470,
  height: 256,
} as const satisfies BrandImage;

/** The logo's accessible name (the tagline in the files is Turkish). */
export const brandLogoAlt = {
  tr: "Şaban Durali, Araştırma ve Bilgi Platformu",
  en: "Şaban Durali, Research and Knowledge Platform",
} as const;

/**
 * The public brand kit: every logo, wordmark, symbol and atlas pattern of the
 * package at a stable URL (press, e-mail and documents link to them), plus the
 * e-mail signature logo the package's signature HTML loads.
 */
export const publishedBrandFiles = [
  "/brand/saban-durali-logo-black.svg",
  "/brand/saban-durali-logo-color-ondark.svg",
  "/brand/saban-durali-logo-color.svg",
  "/brand/saban-durali-logo-navy.svg",
  "/brand/saban-durali-logo-white.svg",
  "/brand/saban-durali-logo-vertical-black.svg",
  "/brand/saban-durali-logo-vertical-color-ondark.svg",
  "/brand/saban-durali-logo-vertical-color.svg",
  "/brand/saban-durali-logo-vertical-navy.svg",
  "/brand/saban-durali-logo-vertical-white.svg",
  "/brand/saban-durali-wordmark-black.svg",
  "/brand/saban-durali-wordmark-color-ondark.svg",
  "/brand/saban-durali-wordmark-color.svg",
  "/brand/saban-durali-wordmark-navy.svg",
  "/brand/saban-durali-wordmark-white.svg",
  "/brand/saban-durali-wordmark-name-black.svg",
  "/brand/saban-durali-wordmark-name-color-ondark.svg",
  "/brand/saban-durali-wordmark-name-color.svg",
  "/brand/saban-durali-wordmark-name-navy.svg",
  "/brand/saban-durali-wordmark-name-white.svg",
  "/brand/saban-durali-symbol-black.svg",
  "/brand/saban-durali-symbol-color-ondark.svg",
  "/brand/saban-durali-symbol-color.svg",
  "/brand/saban-durali-symbol-navy.svg",
  "/brand/saban-durali-symbol-white.svg",
  "/brand/saban-durali-symbol-small-black.svg",
  "/brand/saban-durali-symbol-small-color-ondark.svg",
  "/brand/saban-durali-symbol-small-color.svg",
  "/brand/saban-durali-symbol-small-navy.svg",
  "/brand/saban-durali-symbol-small-white.svg",
  "/brand/saban-durali-atlas-dark.svg",
  "/brand/saban-durali-atlas-light.svg",
  "/eposta/saban-durali-eposta-logo@2x.png",
] as const;

/** The web app manifest and the icons it lists (public/site.webmanifest). */
export const webManifestPath = "/site.webmanifest";

export const webManifestIcons = [
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
] as const;
