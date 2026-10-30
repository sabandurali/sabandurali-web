import "server-only";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { getAllPublishedBookReviews } from "@/content/books/book-data-source";
import { describeError, reportContentIssue } from "@/content/content-log";
import { getDistrictGuideSummaries } from "@/content/districts/district-guide-data-source";
import type { SiteLocale } from "@/content/locales";
import { getAllPublishedPhotos } from "@/content/photos/photo-data-source";
import { createSearchDocuments } from "./search-documents";
import {
  createSearchIndex,
  type SearchIndex,
  type SearchSourceName,
} from "./site-search";

async function settle<T>(
  source: SearchSourceName,
  locale: SiteLocale,
  load: () => Promise<T>,
  fallback: T,
  unavailable: SearchSourceName[],
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    unavailable.push(source);
    reportContentIssue(
      {
        scope: "search",
        reason: "source-unavailable",
        id: source,
        locale,
        detail: describeError(error),
      },
      "error",
    );
    return fallback;
  }
}

/**
 * The search index of `locale`, read through the public data sources
 * (anonymous, published-only Payload reads). A failing source is logged and
 * named in `unavailable`, so the page can say what it could not search
 * instead of claiming there is nothing.
 */
export async function loadSearchIndex(
  locale: SiteLocale,
): Promise<{ index: SearchIndex; unavailable: SearchSourceName[] }> {
  const unavailable: SearchSourceName[] = [];
  const [articles, bookReviews, photos, districtSummaries] = await Promise.all([
    settle(
      "articles",
      locale,
      () => getAllPublishedArticles(locale),
      [],
      unavailable,
    ),
    settle(
      "bookReviews",
      locale,
      () => getAllPublishedBookReviews(locale),
      [],
      unavailable,
    ),
    settle(
      "photos",
      locale,
      () => getAllPublishedPhotos(locale),
      [],
      unavailable,
    ),
    settle(
      "districts",
      locale,
      () => getDistrictGuideSummaries(),
      new Map<string, string>(),
      unavailable,
    ),
  ]);

  return {
    index: createSearchIndex(
      createSearchDocuments(locale, {
        articles,
        bookReviews,
        photos,
        districtSummaries,
      }),
    ),
    unavailable,
  };
}
