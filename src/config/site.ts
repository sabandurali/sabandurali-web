const DEFAULT_SITE_URL = "https://sabandurali-web.vercel.app";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const siteUrl = new URL(configuredSiteUrl || DEFAULT_SITE_URL);

export function getAbsoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

export const homeUrls = {
  tr: getAbsoluteUrl("/"),
  en: getAbsoluteUrl("/en"),
  "x-default": getAbsoluteUrl("/"),
} as const;
