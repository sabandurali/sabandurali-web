import type { Metadata } from "next";
import BookReviewListPage from "@/components/books/BookReviewListPage";
import {
  getAllPublishedBookReviews,
  hasPublishedBookReviews,
} from "@/content/books/book-data-source";
import { bookListPaths } from "@/content/books/book-routes";
import { loadListContent, createListPageMetadata } from "@/content/list-seo";

const locale = "en" as const;

// Prerendered and refreshed at most hourly; CMS writes revalidate this path
// on demand (src/lib/revalidation.ts), the hour is the time-based safety net
// for scheduled publishing, which no write announces.
export const revalidate = 3600;

// An empty list is noindex and outside the hreflang cluster, like the
// sitemap, which leaves it out (src/content/list-seo.ts).
export async function generateMetadata(): Promise<Metadata> {
  return createListPageMetadata({
    title: "Books | Şaban Durali",
    description:
      "Book reviews on business, psychology, learning, artificial intelligence, sales, real estate and personal development.",
    locale,
    paths: bookListPaths,
    content: await loadListContent(hasPublishedBookReviews),
  });
}

export default async function EnglishBooksPage() {
  const bookReviews = await getAllPublishedBookReviews(locale);

  return <BookReviewListPage bookReviews={bookReviews} locale={locale} />;
}
