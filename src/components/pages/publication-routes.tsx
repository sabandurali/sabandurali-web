import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDetailPage from "@/components/articles/ArticleDetailPage";
import BookReviewDetailPage from "@/components/books/BookReviewDetailPage";
import PhotoDetailPage from "@/components/photos/PhotoDetailPage";
import {
  getAllPublishedArticles,
  getPublishedArticlePageData,
} from "@/content/articles/article-data-source";
import { createArticleMetadata } from "@/content/articles/article-seo";
import {
  getAllPublishedBookReviews,
  getPublishedBookReviewPageData,
} from "@/content/books/book-data-source";
import { createBookReviewMetadata } from "@/content/books/book-seo";
import {
  getPublishedPhotoPageData,
  getRelatedPublishedPhotos,
} from "@/content/photos/photo-data-source";
import { createPhotoMetadata } from "@/content/photos/photo-seo";
import type { SiteLocale } from "@/lib/metadata";
import { publicationNotFoundMetadata } from "./publication-not-found";

/*
 * `generateStaticParams`, `generateMetadata` and the page of the article,
 * book review and photo detail routes, one factory per type and locale (the
 * workspace `[section]` routes follow the same pattern). A route file only
 * adds `revalidate`, because segment config must be a literal in the file.
 */

type SlugRouteProps = { params: Promise<{ slug: string }> };

export function createArticleDetailRoute(locale: SiteLocale) {
  async function generateStaticParams() {
    const articles = await getAllPublishedArticles(locale);
    return articles.map((article) => ({ slug: article.slug }));
  }

  async function generateMetadata({
    params,
  }: SlugRouteProps): Promise<Metadata> {
    const { slug } = await params;
    const { article, translation } = await getPublishedArticlePageData(
      slug,
      locale,
    );
    return article === null
      ? publicationNotFoundMetadata("article", locale)
      : createArticleMetadata(article, translation);
  }

  async function ArticleRoutePage({ params }: SlugRouteProps) {
    const { slug } = await params;
    const { article, translation } = await getPublishedArticlePageData(
      slug,
      locale,
    );
    if (article === null) notFound();
    return <ArticleDetailPage article={article} translation={translation} />;
  }

  return { generateStaticParams, generateMetadata, Page: ArticleRoutePage };
}

export function createBookReviewDetailRoute(locale: SiteLocale) {
  async function generateStaticParams() {
    const bookReviews = await getAllPublishedBookReviews(locale);
    return bookReviews.map((bookReview) => ({ slug: bookReview.slug }));
  }

  async function generateMetadata({
    params,
  }: SlugRouteProps): Promise<Metadata> {
    const { slug } = await params;
    const { bookReview, translation } = await getPublishedBookReviewPageData(
      slug,
      locale,
    );
    return bookReview === null
      ? publicationNotFoundMetadata("bookReview", locale)
      : createBookReviewMetadata(bookReview, translation);
  }

  async function BookReviewRoutePage({ params }: SlugRouteProps) {
    const { slug } = await params;
    const { bookReview, translation } = await getPublishedBookReviewPageData(
      slug,
      locale,
    );
    if (bookReview === null) notFound();
    return (
      <BookReviewDetailPage bookReview={bookReview} translation={translation} />
    );
  }

  return { generateStaticParams, generateMetadata, Page: BookReviewRoutePage };
}

export function createPhotoDetailRoute(locale: SiteLocale) {
  // No photo is prerendered at build time: pages are generated on demand.
  async function generateStaticParams(): Promise<Array<{ slug: string }>> {
    return [];
  }

  async function generateMetadata({
    params,
  }: SlugRouteProps): Promise<Metadata> {
    const { slug } = await params;
    const { photo, translation } = await getPublishedPhotoPageData(
      slug,
      locale,
    );
    return photo === null
      ? publicationNotFoundMetadata("photo", locale)
      : createPhotoMetadata(photo, translation);
  }

  async function PhotoRoutePage({ params }: SlugRouteProps) {
    const { slug } = await params;
    const { photo, translation } = await getPublishedPhotoPageData(
      slug,
      locale,
    );
    if (photo === null) notFound();
    const related = await getRelatedPublishedPhotos(photo);
    return (
      <PhotoDetailPage
        photo={photo}
        translation={translation}
        related={related}
      />
    );
  }

  return { generateStaticParams, generateMetadata, Page: PhotoRoutePage };
}
