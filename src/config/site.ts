export const siteUrl = "https://sabandurali.com";
export const contactEmail = "sabandurali@gmail.com";

export function getAbsoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export const homeUrls = {
  "tr-TR": getAbsoluteUrl("/"),
  en: getAbsoluteUrl("/en"),
  "x-default": getAbsoluteUrl("/"),
} as const;

export const contactPaths = {
  tr: "/iletisim",
  en: "/en/contact",
} as const;

export const contactUrls = {
  tr: getAbsoluteUrl(contactPaths.tr),
  en: getAbsoluteUrl(contactPaths.en),
} as const;

export const privacyPaths = {
  tr: "/kvkk-aydinlatma-metni",
  en: "/en/privacy-notice",
} as const;

export const privacyUrls = {
  tr: getAbsoluteUrl(privacyPaths.tr),
  en: getAbsoluteUrl(privacyPaths.en),
} as const;

export const feedbackPaths = {
  tr: "/geri-bildirim",
  en: "/en/feedback",
} as const;

export const feedbackUrls = {
  tr: getAbsoluteUrl(feedbackPaths.tr),
  en: getAbsoluteUrl(feedbackPaths.en),
} as const;
