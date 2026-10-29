import "server-only";
import { cache } from "react";
import { PayloadPublicBookReviewRepository } from "@/content/books/payload-book-review-repository";
import {
  createStaticBookReviewFixtures,
  findStaticBookReviewTranslation,
  findStaticPublishedBookReview,
  listStaticPublishedBookReviews,
} from "@/content/books/static-book-reviews";
import {
  toPublicBookReview,
  type PublicBookReview,
} from "@/content/books/public-types";
import type { BookReview, BookReviewLanguage } from "@/content/books/types";
import { readPublicSource } from "@/content/public-source";

const staticBookReviews = createStaticBookReviewFixtures(process.env.NODE_ENV);
const payloadBookReviewRepository = new PayloadPublicBookReviewRepository();

export type PublishedBookReviewPageData = {
  bookReview: PublicBookReview | null;
  translation: PublicBookReview | null;
};

function toPublicPageData(
  bookReview: BookReview | null,
  translation: BookReview | null,
): PublishedBookReviewPageData {
  return {
    bookReview: bookReview === null ? null : toPublicBookReview(bookReview),
    translation: translation === null ? null : toPublicBookReview(translation),
  };
}

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
        ? toPublicPageData(null, null)
        : toPublicPageData(
            bookReview,
            await payloadBookReviewRepository.findPublishedTranslation(
              bookReview,
              targetLanguage,
              now,
            ),
          );
    }

    const bookReview = findStaticPublishedBookReview(
      staticBookReviews,
      slug,
      language,
      now,
    );

    return bookReview === null
      ? toPublicPageData(null, null)
      : toPublicPageData(
          bookReview,
          findStaticBookReviewTranslation(
            staticBookReviews,
            bookReview,
            targetLanguage,
            now,
          ),
        );
  },
);

/** Every public review of one language, newest first. */
export const getAllPublishedBookReviews = cache(
  async (language: BookReviewLanguage): Promise<BookReview[]> =>
    readPublicSource("BOOK_PUBLIC_SOURCE") === "payload"
      ? payloadBookReviewRepository.listPublished(language)
      : listStaticPublishedBookReviews(staticBookReviews, language, new Date()),
);
