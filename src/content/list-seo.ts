/**
 * Indexing rules of the content list pages (articles, book reviews,
 * photographs) in both languages. A list without published items is thin
 * content: it stays reachable but is noindex, is left out of the sitemap and
 * is never named as a hreflang alternate. The page metadata and the sitemap
 * use these same helpers, so they always agree.
 */
import type { Metadata } from "next";
import { siteLocales, type SiteLocale } from "@/content/locales";
import { createPageMetadata, type LocalizedPaths } from "@/lib/metadata";

/** Whether each language's list has at least one published item. */
export type ListContent = Record<SiteLocale, boolean>;

/** Reads `hasItems` for every language in parallel. */
export async function loadListContent(
  hasItems: (locale: SiteLocale) => Promise<boolean>,
): Promise<ListContent> {
  const values = await Promise.all(siteLocales.map(hasItems));
  return {
    tr: values[siteLocales.indexOf("tr")] === true,
    en: values[siteLocales.indexOf("en")] === true,
  };
}

/** List content derived from items that carry their language. */
export function listContentOf(
  items: ReadonlyArray<{ language: SiteLocale }>,
): ListContent {
  return {
    tr: items.some((item) => item.language === "tr"),
    en: items.some((item) => item.language === "en"),
  };
}

/** The list paths of the languages that have items: the hreflang cluster. */
export function getFilledListPaths(
  paths: Readonly<Record<SiteLocale, string>>,
  content: ListContent,
): LocalizedPaths {
  return Object.fromEntries(
    siteLocales.flatMap((locale) =>
      content[locale] ? [[locale, paths[locale]]] : [],
    ),
  );
}

export type ListPageMetadataInput = {
  title: string;
  description: string;
  locale: SiteLocale;
  /** The page-1 path of the list in every language. */
  paths: Readonly<Record<SiteLocale, string>>;
  content: ListContent;
};

/**
 * Metadata of page 1 of an unfiltered list: indexable only with items, and
 * paired only with the other language's list when that one has items too.
 */
export function createListPageMetadata(input: ListPageMetadataInput): Metadata {
  return createPageMetadata({
    title: input.title,
    description: input.description,
    locale: input.locale,
    path: input.paths[input.locale],
    translations: getFilledListPaths(input.paths, input.content),
    index: input.content[input.locale],
    follow: true,
    feed: true,
  });
}
