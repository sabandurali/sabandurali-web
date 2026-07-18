export const siteUrl = "https://sabandurali.com";

export function getAbsoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export const homeUrls = {
  "tr-TR": getAbsoluteUrl("/"),
  en: getAbsoluteUrl("/en"),
  "x-default": getAbsoluteUrl("/"),
} as const;

export const feedbackUrls = {
  tr: getAbsoluteUrl("/geri-bildirim"),
  en: getAbsoluteUrl("/en/feedback"),
} as const;
