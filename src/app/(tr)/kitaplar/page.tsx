import type { Metadata } from "next";
import BookReviewListPage from "@/components/books/BookReviewListPage";
import { getAllPublishedBookReviews } from "@/content/books/book-data-source";
import { bookListUrls } from "@/content/books/book-routes";

export const metadata: Metadata = {
  title: "Kitaplar | Şaban Durali",
  description:
    "İş, psikoloji, öğrenme, yapay zekâ, satış, gayrimenkul ve kişisel gelişim alanlarında kitap incelemeleri.",
  alternates: {
    canonical: bookListUrls["tr-TR"],
    languages: bookListUrls,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function TurkishBooksPage() {
  const bookReviews = await getAllPublishedBookReviews("tr");

  return <BookReviewListPage bookReviews={bookReviews} locale="tr" />;
}
