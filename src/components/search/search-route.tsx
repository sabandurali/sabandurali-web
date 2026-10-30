import type { Metadata } from "next";
import SearchPage from "@/components/search/SearchPage";
import type { SiteLocale } from "@/content/locales";
import { searchCopy } from "@/content/search/search-copy";
import { loadSearchIndex } from "@/content/search/search-data-source";
import { searchPaths } from "@/content/search/search-routes";
import { readSearchQuery, searchSite } from "@/content/search/site-search";
import { createPageMetadata } from "@/lib/metadata";

export type SearchRouteProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Metadata of a search page: noindex, follow, with its own address (without
 * the query) as canonical. A result page repeats other pages, so it never
 * enters search results, the sitemap or a hreflang cluster.
 */
export function createSearchMetadata(locale: SiteLocale): Metadata {
  const copy = searchCopy[locale];
  return createPageMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    locale,
    path: searchPaths[locale],
    index: false,
    follow: true,
  });
}

/**
 * The search route of `locale`: it reads `?q=` and renders per request; the
 * route files add nothing but this.
 */
export function createSearchRoute(locale: SiteLocale) {
  async function SearchRoutePage({ searchParams }: SearchRouteProps) {
    const query = readSearchQuery((await searchParams).q);
    const { index, unavailable } =
      query === ""
        ? { index: [], unavailable: [] }
        : await loadSearchIndex(locale);
    return (
      <SearchPage
        locale={locale}
        result={searchSite(index, query)}
        unavailable={unavailable}
      />
    );
  }

  return { metadata: createSearchMetadata(locale), Page: SearchRoutePage };
}
