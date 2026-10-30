import { getAbsoluteUrl } from "@/config/site";
import { articlePageContent } from "@/content/articles/article-page-content";
import {
  articleListPaths,
  getArticlePath,
} from "@/content/articles/article-routes";
import { isArticleHreflangEligible } from "@/content/articles/article-seo";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { bookPageContent } from "@/content/books/book-page-content";
import { bookListPaths, getBookReviewPath } from "@/content/books/book-routes";
import { isBookReviewHreflangEligible } from "@/content/books/book-seo";
import type { PublicBookReviewSummary } from "@/content/books/public-types";
import {
  createBreadcrumbJsonLd,
  createHomeTrail,
} from "@/content/breadcrumb-seo";
import { createWebsiteReference } from "@/content/entity-seo";
import type { SiteLocale } from "@/content/locales";

type CollectionInput = {
  locale: SiteLocale;
  /** The list's title and lead as the page shows them. */
  name: string;
  description: string;
  path: string;
  /** The listed items in page order, by title and site path. */
  items: ReadonlyArray<{ name: string; path: string }>;
};

/**
 * The JSON-LD of a list page: a CollectionPage whose main entity is the
 * ItemList of the items the page shows, and the page's BreadcrumbList. An
 * empty list is noindex and gets none (null).
 */
export function createCollectionPageJsonLd(input: CollectionInput) {
  if (input.items.length === 0) return null;
  const url = getAbsoluteUrl(input.path);
  const breadcrumb = createBreadcrumbJsonLd(
    createHomeTrail(input.locale, { name: input.name, path: input.path }),
  );

  const page = {
    "@type": "CollectionPage",
    "@id": url,
    url,
    name: input.name,
    description: input.description,
    inLanguage: input.locale === "tr" ? "tr-TR" : "en",
    isPartOf: createWebsiteReference(),
    breadcrumb: { "@id": breadcrumb["@id"] },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: getAbsoluteUrl(item.path),
      })),
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [page, breadcrumb] as const,
  };
}

/**
 * The article list's JSON-LD. Only indexable, self-canonical articles are
 * named, like the sitemap lists them.
 */
export function createArticleListJsonLd(
  locale: SiteLocale,
  articles: readonly PublicArticleSummary[],
) {
  const content = articlePageContent[locale];
  return createCollectionPageJsonLd({
    locale,
    name: content.listTitle,
    description: content.listDescription,
    path: articleListPaths[locale],
    items: articles
      .filter(
        (article) =>
          article.language === locale && isArticleHreflangEligible(article),
      )
      .map((article) => ({
        name: article.title,
        path: getArticlePath(article.slug, article.language),
      })),
  });
}

/** The book review list's JSON-LD, with the same rule as the articles. */
export function createBookReviewListJsonLd(
  locale: SiteLocale,
  bookReviews: readonly PublicBookReviewSummary[],
) {
  const content = bookPageContent[locale];
  return createCollectionPageJsonLd({
    locale,
    name: content.listTitle,
    description: content.listDescription,
    path: bookListPaths[locale],
    items: bookReviews
      .filter(
        (bookReview) =>
          bookReview.language === locale &&
          isBookReviewHreflangEligible(bookReview),
      )
      .map((bookReview) => ({
        name: bookReview.title,
        path: getBookReviewPath(bookReview.slug, bookReview.language),
      })),
  });
}
