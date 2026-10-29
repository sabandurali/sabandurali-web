export const siteUrl = "https://www.sabandurali.com";
export const contactEmail = "saban@sabandurali.com";

export function getAbsoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export const siteSocialImage = {
  url: getAbsoluteUrl("/brand/site-og.jpg"),
  width: 1200,
  height: 630,
  alt: "Şaban Durali — Araştırma ve Bilgi Platformu / Research and Knowledge Platform",
};

export const homeUrls = {
  "tr-TR": getAbsoluteUrl("/"),
  en: getAbsoluteUrl("/en"),
  "x-default": getAbsoluteUrl("/"),
} as const;

export const contactPaths = {
  tr: "/iletisim",
  en: "/en/contact",
} as const;

export const privacyPaths = {
  tr: "/kvkk-aydinlatma-metni",
  en: "/en/privacy-notice",
} as const;
