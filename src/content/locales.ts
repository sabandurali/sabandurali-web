/**
 * The site's languages, in hreflang order: Turkish (the default, served
 * without a URL prefix) first, then English. Every per-module language type
 * (`ArticleLanguage`, `PhotoLanguage`, …) is this type; new code imports
 * `SiteLocale` from here directly.
 *
 * Kept free of imports so any layer, the Payload config included, can use it.
 */
export const siteLocales = ["tr", "en"] as const;

export type SiteLocale = (typeof siteLocales)[number];

export function isSiteLocale(value: unknown): value is SiteLocale {
  return siteLocales.some((locale) => locale === value);
}
