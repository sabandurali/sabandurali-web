/**
 * Turns the public content of the data sources into search documents. Pure:
 * every field comes from a public type (articles, book reviews, photos), the
 * district registry, the public district guide summaries or the workspace
 * definitions. Nothing private can reach the index because nothing private
 * reaches these inputs.
 */
import { getArticlePath } from "@/content/articles/article-routes";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { getBookReviewPath } from "@/content/books/book-routes";
import type { PublicBookReviewSummary } from "@/content/books/public-types";
import { districts } from "@/content/districts/district-registry";
import { getDistrictPath } from "@/content/districts/district-routes";
import type { SiteLocale } from "@/content/locales";
import { getPhotoPath } from "@/content/photos/photo-routes";
import type { PublicPhoto } from "@/content/photos/types";
import { workspaces } from "@/content/workspaces";
import type { SearchDocument } from "./site-search";

export type SearchContent = {
  articles: readonly PublicArticleSummary[];
  bookReviews: readonly PublicBookReviewSummary[];
  photos: readonly PublicPhoto[];
  /** Public guide summary per district slug (published guides only). */
  districtSummaries: ReadonlyMap<string, string>;
};

const sideNames = {
  avrupa: "Avrupa Yakası",
  anadolu: "Anadolu Yakası",
} as const;

/**
 * The search documents of `locale`. Articles, book reviews and photos are
 * those of the language. The 39 district guides are Turkish pages and are
 * found in both languages; workspaces exist in Turkish only.
 */
export function createSearchDocuments(
  locale: SiteLocale,
  content: SearchContent,
): SearchDocument[] {
  return [
    ...districts.map((district): SearchDocument => ({
      kind: "district",
      title: district.name,
      path: getDistrictPath(district.slug),
      summary: content.districtSummaries.get(district.slug) ?? null,
      language: "tr",
      keywords: ["İstanbul", "ilçe", sideNames[district.side]],
    })),
    ...content.articles
      .filter((article) => article.language === locale)
      .map((article): SearchDocument => ({
        kind: "article",
        title: article.title,
        path: getArticlePath(article.slug, article.language),
        summary: article.summary,
        language: article.language,
        keywords: article.categories.map((category) => category.name),
      })),
    ...content.bookReviews
      .filter((bookReview) => bookReview.language === locale)
      .map((bookReview): SearchDocument => ({
        kind: "book-review",
        title: bookReview.title,
        path: getBookReviewPath(bookReview.slug, bookReview.language),
        summary: bookReview.summary,
        language: bookReview.language,
        keywords: [
          ...bookReview.authors.map((author) => author.name),
          ...(bookReview.originalTitle === null
            ? []
            : [bookReview.originalTitle]),
        ],
      })),
    ...content.photos
      .filter((photo) => photo.language === locale)
      .map((photo): SearchDocument => ({
        kind: "photo",
        title: photo.title,
        path: getPhotoPath(photo.slug, photo.language),
        summary: photo.description ?? null,
        language: photo.language,
        keywords: [
          ...photo.collections.map((collection) => collection.title),
          ...photo.tags.map((tag) => tag.title),
          ...(photo.locationName === null ? [] : [photo.locationName]),
        ],
      })),
    ...(locale === "tr"
      ? workspaces.map((workspace): SearchDocument => ({
          kind: "workspace",
          title: workspace.title,
          path: `/${workspace.key}`,
          summary: workspace.description,
          language: "tr",
        }))
      : []),
  ];
}
