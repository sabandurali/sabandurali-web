import type { Metadata } from "next";
import BookReviewListPage from "@/components/books/BookReviewListPage";
import { getAllPublishedBookReviews } from "@/content/books/book-data-source";
import { bookListPaths } from "@/content/books/book-routes";
import { createPageMetadata } from "@/lib/metadata";

const locale = "en" as const;

// Prerendered and refreshed at most hourly; CMS writes revalidate this path
// on demand (src/lib/revalidation.ts), the hour is the time-based safety net
// for scheduled publishing, which no write announces.
export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "Books | Şaban Durali",
  description:
    "Book reviews on business, psychology, learning, artificial intelligence, sales, real estate and personal development.",
  locale,
  path: bookListPaths[locale],
  translations: bookListPaths,
});

export default async function EnglishBooksPage() {
  const bookReviews = await getAllPublishedBookReviews(locale);

  return <BookReviewListPage bookReviews={bookReviews} locale={locale} />;
}
