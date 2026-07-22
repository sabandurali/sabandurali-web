import type { Metadata } from "next";
import BookReviewListPage from "@/components/books/BookReviewListPage";
import { getAllPublishedBookReviews } from "@/content/books/book-data-source";
import { bookListUrls } from "@/content/books/book-routes";

export const metadata: Metadata = {
  title: "Books | Şaban Durali",
  description:
    "Book reviews on business, psychology, learning, artificial intelligence, sales, real estate and personal development.",
  alternates: {
    canonical: bookListUrls.en,
    languages: bookListUrls,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function EnglishBooksPage() {
  const bookReviews = await getAllPublishedBookReviews("en");

  return <BookReviewListPage bookReviews={bookReviews} locale="en" />;
}
