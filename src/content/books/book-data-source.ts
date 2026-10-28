import "server-only";
import { cache } from "react";
import { PayloadPublicBookReviewRepository } from "@/content/books/payload-book-review-repository";
import {
  createStaticBookReviewFixtures,
  findStaticBookReviewTranslation,
  findStaticPublishedBookReview,
  listStaticPublishedBookReviews,
} from "@/content/books/static-book-reviews";
import type { BookReview, BookReviewLanguage } from "@/content/books/types";
import { readPublicSource } from "@/content/public-source";

const staticBookReviews = createStaticBookReviewFixtures(process.env.NODE_ENV);
const payloadBookReviewRepository = new PayloadPublicBookReviewRepository();

export type PublishedBookReviewPageData = {
  bookReview: BookReview | null;
  translation: BookReview | null;
};

export const getPublishedBookReviewPageData = cache(
  async (
    slug: string,
    language: BookReviewLanguage,
  ): Promise<PublishedBookReviewPageData> => {
    const now = new Date();
    const targetLanguage = language === "tr" ? "en" : "tr";

    if (readPublicSource("BOOK_PUBLIC_SOURCE") === "payload") {
      const bookReview = await payloadBookReviewRepository.findPublishedBySlug(
        slug,
        language,
        now,
      );

      return bookReview === null
        ? { bookReview: null, translation: null }
        : {
            bookReview,
            translation:
              await payloadBookReviewRepository.findPublishedTranslation(
                bookReview,
                targetLanguage,
                now,
              ),
          };
    }

    const bookReview = findStaticPublishedBookReview(
      staticBookReviews,
      slug,
      language,
      now,
    );

    return bookReview === null
      ? { bookReview: null, translation: null }
      : {
          bookReview,
          translation: findStaticBookReviewTranslation(
            staticBookReviews,
            bookReview,
            targetLanguage,
            now,
          ),
        };
  },
);

export async function getAllPublishedBookReviews(
  language: BookReviewLanguage,
): Promise<BookReview[]> {
  return readPublicSource("BOOK_PUBLIC_SOURCE") === "payload"
    ? payloadBookReviewRepository.listPublished(language)
    : listStaticPublishedBookReviews(staticBookReviews, language, new Date());
}
