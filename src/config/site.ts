export const siteUrl = "https://www.sabandurali.com";

export function getAbsoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export const homeUrls = {
  "tr-TR": getAbsoluteUrl("/"),
  en: getAbsoluteUrl("/en"),
  "x-default": getAbsoluteUrl("/"),
} as const;
