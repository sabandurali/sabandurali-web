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
import type { BookReviewLanguage } from "@/content/books/types";
import { readPublicSource } from "@/content/public-source";

const staticBookReviews = createStaticBookReviewFixtures(process.env.NODE_ENV);
const payloadBookReviewRepository = new PayloadPublicBookReviewRepository();

export type PublishedBookReviewPageData = {
  bookReview: PublicBookReview | null;
  translation: PublicBookReview | null;
};

function isPayloadSource(): boolean {
  return readPublicSource("BOOK_PUBLIC_SOURCE") === "payload";
}

/*
 * Both sources return public types: the Payload repository projects at its
 * boundary, the static fixtures are projected here. The editorial fields of
 * the book model never leave this module.
 */

export const getPublishedBookReviewPageData = cache(
  async (
    slug: string,
    language: BookReviewLanguage,
  ): Promise<PublishedBookReviewPageData> => {
    const now = new Date();
    const targetLanguage = language === "tr" ? "en" : "tr";

    if (isPayloadSource()) {
      const bookReview = await payloadBookReviewRepository.findPublishedBySlug(
        slug,
        language,
        now,
      );

      return {
        bookReview,
        translation:
          bookReview === null
            ? null
            : await payloadBookReviewRepository.findPublishedTranslation(
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
    const translation =
      bookReview === null
        ? null
        : findStaticBookReviewTranslation(
            staticBookReviews,
            bookReview,
            targetLanguage,
            now,
          );

    return {
      bookReview: bookReview === null ? null : toPublicBookReview(bookReview),
      translation:
        translation === null ? null : toPublicBookReview(translation),
    };
  },
);

function listStatic(language: BookReviewLanguage): PublicBookReview[] {
  return listStaticPublishedBookReviews(
    staticBookReviews,
    language,
    new Date(),
  ).map(toPublicBookReview);
}

/** Every public review of one language, newest first. */
export const getAllPublishedBookReviews = cache(
  async (language: BookReviewLanguage): Promise<PublicBookReview[]> =>
    isPayloadSource()
      ? payloadBookReviewRepository.listPublished(language)
      : listStatic(language),
);

/**
 * The newest `limit` public reviews, read with a database limit for
 * surfaces that show only a few (the home page). Use this instead of
 * slicing getAllPublishedBookReviews().
 */
export const getLatestPublishedBookReviews = cache(
  async (
    language: BookReviewLanguage,
    limit: number,
  ): Promise<PublicBookReview[]> =>
    isPayloadSource()
      ? payloadBookReviewRepository.listPublished(language, new Date(), limit)
      : listStatic(language).slice(0, Math.max(0, limit)),
);

/** Whether a language has any public book review (one-row read). */
export async function hasPublishedBookReviews(
  language: BookReviewLanguage,
): Promise<boolean> {
  return (await getLatestPublishedBookReviews(language, 1)).length > 0;
}
