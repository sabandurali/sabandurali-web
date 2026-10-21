import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookReviewDetailPage from "@/components/books/BookReviewDetailPage";
import {
  getAllPublishedBookReviews,
  getPublishedBookReviewPageData,
} from "@/content/books/book-data-source";
import { createBookReviewMetadata } from "@/content/books/book-seo";

type TurkishBookReviewPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const bookReviews = await getAllPublishedBookReviews("tr");
  return bookReviews.map((bookReview) => ({ slug: bookReview.slug }));
}

export async function generateMetadata({
  params,
}: TurkishBookReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { bookReview, translation } =
    await getPublishedBookReviewPageData(slug, "tr");

  if (bookReview === null) {
    return {
      title: "Kitap incelemesi bulunamadı | Şaban Durali",
      robots: { index: false, follow: false },
    };
  }

  return createBookReviewMetadata(bookReview, translation);
}

export default async function TurkishBookReviewPage({
  params,
}: TurkishBookReviewPageProps) {
  const { slug } = await params;
  const { bookReview, translation } =
    await getPublishedBookReviewPageData(slug, "tr");

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
