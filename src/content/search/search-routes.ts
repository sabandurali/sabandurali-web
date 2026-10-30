import type { SiteLocale } from "@/content/locales";

/** The site search page of each language. */
export const searchPaths = {
  tr: "/ara",
  en: "/en/search",
} as const satisfies Record<SiteLocale, string>;

/** The query string parameter that carries the search terms. */
export const searchQueryParam = "q";

/** The search page of `locale` for `query` (no query: the empty form). */
export function getSearchPath(locale: SiteLocale, query?: string): string {
  const value = query?.trim() ?? "";
  return value === ""
    ? searchPaths[locale]
    : `${searchPaths[locale]}?${new URLSearchParams({ [searchQueryParam]: value }).toString()}`;
}
