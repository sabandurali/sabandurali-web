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
import { assertProductionPayloadInfrastructure } from "@/lib/payloadInfrastructure";

const staticBookReviews = createStaticBookReviewFixtures(process.env.NODE_ENV);
const payloadBookReviewRepository = new PayloadPublicBookReviewRepository();

type PublicBookReviewSource = "payload" | "static";

function getPublicBookReviewSource(): PublicBookReviewSource {
  const source = process.env.BOOK_PUBLIC_SOURCE;

  if (source === undefined || source === "static") {
    return "static";
  }

  if (source === "payload") {
    assertProductionPayloadInfrastructure();
    return "payload";
  }

  throw new Error(
    `Invalid BOOK_PUBLIC_SOURCE value "${source}". Expected "static" or "payload".`,
  );
}

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

    if (getPublicBookReviewSource() === "payload") {
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
  return getPublicBookReviewSource() === "payload"
    ? payloadBookReviewRepository.listPublished(language)
    : listStaticPublishedBookReviews(staticBookReviews, language, new Date());
}
