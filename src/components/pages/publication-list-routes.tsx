import type { Metadata } from "next";
import ArticleListPage from "@/components/articles/ArticleListPage";
import BookReviewListPage from "@/components/books/BookReviewListPage";
import PhotoListPage from "@/components/photos/PhotoListPage";
import {
  parsePhotoListParams,
  type PhotoListSearchParams,
} from "@/components/photos/photo-list-params";
import {
  getAllPublishedArticles,
  hasPublishedArticles,
} from "@/content/articles/article-data-source";
import { articleListPaths } from "@/content/articles/article-routes";
import {
  getAllPublishedBookReviews,
  hasPublishedBookReviews,
} from "@/content/books/book-data-source";
import { bookListPaths } from "@/content/books/book-routes";
import { createListPageMetadata, loadListContent } from "@/content/list-seo";
import {
  getPublishedPhotos,
  hasPublishedPhotos,
} from "@/content/photos/photo-data-source";
import { loadPhotoListMetadata } from "@/content/photos/photo-list-seo";
import type { SiteLocale } from "@/lib/metadata";
import { publicationListSeo } from "./publication-list-seo";

/*
 * `generateMetadata` and the page of the article, book review and photo
 * list routes, one factory per type for both locales (like the detail
 * routes in publication-routes.tsx). A route file only adds the segment
 * config (`revalidate`), which must be a literal in the file.
 *
 * An empty article or book list is noindex and outside the hreflang
 * cluster, like the sitemap, which leaves it out (src/content/list-seo.ts).
 */

export function createArticleListRoute(locale: SiteLocale) {
  async function generateMetadata(): Promise<Metadata> {
    return createListPageMetadata({
      ...publicationListSeo.article[locale],
      locale,
      paths: articleListPaths,
      content: await loadListContent(hasPublishedArticles),
    });
  }

  async function ArticleListRoutePage() {
    const articles = await getAllPublishedArticles(locale);
    return <ArticleListPage articles={articles} locale={locale} />;
  }

  return { generateMetadata, Page: ArticleListRoutePage };
}

export function createBookReviewListRoute(locale: SiteLocale) {
  async function generateMetadata(): Promise<Metadata> {
    return createListPageMetadata({
      ...publicationListSeo.bookReview[locale],
      locale,
      paths: bookListPaths,
      content: await loadListContent(hasPublishedBookReviews),
    });
  }

  async function BookReviewListRoutePage() {
    const bookReviews = await getAllPublishedBookReviews(locale);
    return <BookReviewListPage bookReviews={bookReviews} locale={locale} />;
  }

  return { generateMetadata, Page: BookReviewListRoutePage };
}

type PhotoListRouteProps = {
  searchParams: Promise<PhotoListSearchParams>;
};

/**
 * The photo list reads its filters and page from the query string, so it
 * renders per request. The page and its metadata share one list query
 * (list find + count, plus the cached facets); only the unfiltered first
 * page also checks, through a cached one-row read, whether the other
 * language has photos for its hreflang pair (photo-list-seo).
 */
export function createPhotoListRoute(locale: SiteLocale) {
  async function generateMetadata({
    searchParams,
  }: PhotoListRouteProps): Promise<Metadata> {
    const filters = parsePhotoListParams(await searchParams);
    return loadPhotoListMetadata(locale, filters, {
      list: () => getPublishedPhotos(locale, filters),
      hasPhotos: hasPublishedPhotos,
    });
  }

  async function PhotoListRoutePage({ searchParams }: PhotoListRouteProps) {
    const filters = parsePhotoListParams(await searchParams);
    const result = await getPublishedPhotos(locale, filters);
    return <PhotoListPage locale={locale} filters={filters} result={result} />;
  }

  return { generateMetadata, Page: PhotoListRoutePage };
}
