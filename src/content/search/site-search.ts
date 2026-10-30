/**
 * The site search: a small in-memory index of the public pages the data
 * sources return, matched word by word after `normalizeForSearch`. Pure and
 * tested; `search-data-source.ts` loads the documents.
 */
import type { SiteLocale } from "@/content/locales";
import { getSearchTerms, normalizeForSearch } from "./normalize";

/** Result groups, in the order the page shows them. */
export const searchDocumentKinds = [
  "district",
  "article",
  "book-review",
  "photo",
  "workspace",
] as const;

export type SearchDocumentKind = (typeof searchDocumentKinds)[number];

/** A content source the search could not read on a request. */
export type SearchSourceName =
  "articles" | "bookReviews" | "photos" | "districts";

export type SearchDocument = {
  kind: SearchDocumentKind;
  title: string;
  /** Site path of the page. */
  path: string;
  /** The page's own public summary, or null. */
  summary: string | null;
  /** The language the page is written in (a district guide is Turkish). */
  language: SiteLocale;
  /** Further public words the page is about (district side, collections). */
  keywords?: readonly string[];
};

type IndexedDocument = {
  document: SearchDocument;
  title: string;
  text: string;
};

export type SearchIndex = readonly IndexedDocument[];

/** The longest query the page accepts; longer input is cut. */
export const searchQueryMaxLength = 100;

export function createSearchIndex(
  documents: readonly SearchDocument[],
): SearchIndex {
  const seen = new Set<string>();
  return documents.flatMap((document) => {
    if (seen.has(document.path)) return [];
    seen.add(document.path);
    return [
      {
        document,
        title: ` ${normalizeForSearch(document.title)}`,
        text: ` ${normalizeForSearch(
          [
            document.title,
            document.summary ?? "",
            ...(document.keywords ?? []),
          ].join(" "),
        )}`,
      },
    ];
  });
}

/** Whether `term` starts a word of `text` (both normalized, text space-led). */
function startsWord(text: string, term: string): boolean {
  return text.includes(` ${term}`);
}

function score(entry: IndexedDocument, terms: readonly string[]): number {
  let total = 0;
  for (const term of terms) {
    if (!startsWord(entry.text, term)) return 0;
    total += startsWord(entry.title, term) ? 3 : 1;
  }
  // An exact title match comes first ("Fatih" → the Fatih guide).
  if (entry.title.trim() === terms.join(" ")) total += 10;
  return total;
}

export type SearchGroup = {
  kind: SearchDocumentKind;
  results: SearchDocument[];
};

export type SearchResult = {
  /** The query as searched (trimmed, at most `searchQueryMaxLength`). */
  query: string;
  terms: string[];
  total: number;
  /** Only kinds with at least one result, in `searchDocumentKinds` order. */
  groups: SearchGroup[];
};

/** Reads the query from a `?q=` value (a repeated parameter uses the first). */
export function readSearchQuery(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return (first ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, searchQueryMaxLength);
}

/**
 * Every document that contains each word of `query` at the start of a word
 * of its title, summary or keywords, grouped by kind, best match first.
 */
export function searchSite(index: SearchIndex, query: string): SearchResult {
  const value = readSearchQuery(query);
  const terms = getSearchTerms(value);
  if (terms.length === 0) return { query: value, terms, total: 0, groups: [] };

  const matches = index
    .map((entry) => ({ entry, score: score(entry, terms) }))
    .filter((match) => match.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.entry.document.title.localeCompare(b.entry.document.title, "tr"),
    );

  const groups = searchDocumentKinds.flatMap((kind) => {
    const results = matches
      .filter((match) => match.entry.document.kind === kind)
      .map((match) => match.entry.document);
    return results.length === 0 ? [] : [{ kind, results }];
  });

  return { query: value, terms, total: matches.length, groups };
}
