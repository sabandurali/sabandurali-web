import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookReviewDetailPage from "@/components/books/BookReviewDetailPage";
import {
  getAllPublishedBookReviews,
  getPublishedBookReviewPageData,
} from "@/content/books/book-data-source";
import { createBookReviewMetadata } from "@/content/books/book-seo";

type EnglishBookReviewPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const bookReviews = await getAllPublishedBookReviews("en");
  return bookReviews.map((bookReview) => ({ slug: bookReview.slug }));
}

export async function generateMetadata({
  params,
}: EnglishBookReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { bookReview, translation } =
    await getPublishedBookReviewPageData(slug, "en");

  if (bookReview === null) {
    return {
      title: "Book review not found | Şaban Durali",
      robots: { index: false, follow: false },
    };
  }

  return createBookReviewMetadata(bookReview, translation);
}

export default async function EnglishBookReviewPage({
  params,
}: EnglishBookReviewPageProps) {
  const { slug } = await params;
  const { bookReview, translation } =
    await getPublishedBookReviewPageData(slug, "en");

  if (bookReview === null) {
    notFound();
  }

  return (
    <BookReviewDetailPage
      bookReview={bookReview}
      translation={translation}
    />
  );
}
