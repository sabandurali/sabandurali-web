import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { createPublicBookReviewConditions } from "@/content/books/book-query-conditions";
import { mapPayloadBookReview } from "@/content/books/payload-book-review-mapper";
import {
  toPublicBookReview,
  type PublicBookReview,
} from "@/content/books/public-types";
import type { BookReviewLanguage } from "@/content/books/types";

const PAYLOAD_BOOK_PAGE_SIZE = 100;
const PUBLIC_BOOK_SORT = ["-publishedAt", "id"];

/**
 * `translation` and `relatedBooks` point to other books. The mapper only
 * keeps their IDs, so a populated book carries nothing but its ID and
 * `updatedAt` instead of the whole review with its arrays. Media (cover and
 * Open Graph image) are still populated in full.
 */
export const BOOK_RELATION_POPULATE = {
  books: { updatedAt: true },
} as const;

/**
 * Public book review reads. Every result is projected to the public type
 * here, at the repository boundary, so no caller ever receives the
 * editorial fields (review workflow, curation, translation bookkeeping).
 */
export class PayloadPublicBookReviewRepository {
  private async findOne(
    conditions: Where[],
    now: Date,
    relatedTranslationID?: string | null,
  ): Promise<PublicBookReview | null> {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "books",
      depth: 1,
      draft: false,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      populate: BOOK_RELATION_POPULATE,
      where: {
        and: [...createPublicBookReviewConditions(now), ...conditions],
      },
    });
    const document = result.docs[0];
    const bookReview =
      document === undefined
        ? null
        : mapPayloadBookReview(document, now, relatedTranslationID);

    return bookReview === null ? null : toPublicBookReview(bookReview);
  }

  /** Every public review of one language, or only the newest `limit`. */
  async listPublished(
    language: BookReviewLanguage,
    now: Date = new Date(),
    limit?: number,
  ): Promise<PublicBookReview[]> {
    const payload = await getPayload({ config });
    const bookReviews: PublicBookReview[] = [];
    let page = 1;
    let totalPages = 1;

    while (
      page <= totalPages &&
      (limit === undefined || bookReviews.length < limit)
    ) {
      const result = await payload.find({
        collection: "books",
        depth: 1,
        draft: false,
        limit: limit ?? PAYLOAD_BOOK_PAGE_SIZE,
        overrideAccess: false,
        page,
        populate: BOOK_RELATION_POPULATE,
        sort: PUBLIC_BOOK_SORT,
        where: {
          and: [
            ...createPublicBookReviewConditions(now),
            { language: { equals: language } },
          ],
        },
      });

      for (const document of result.docs) {
        const bookReview = mapPayloadBookReview(document, now);
        if (bookReview !== null) {
          bookReviews.push(toPublicBookReview(bookReview));
        }
      }

      totalPages = result.totalPages;
      page += 1;
    }

    return limit === undefined ? bookReviews : bookReviews.slice(0, limit);
  }

  async findPublishedBySlug(
    slug: string,
    language: BookReviewLanguage,
    now: Date = new Date(),
  ): Promise<PublicBookReview | null> {
    return this.findOne(
      [{ slug: { equals: slug } }, { language: { equals: language } }],
      now,
    );
  }

  /**
   * Translations are linked from either side: the review may point to its
   * translation, or the translation may point back to the review.
   */
  async findPublishedTranslation(
    bookReview: Pick<PublicBookReview, "id" | "translationSourceBookReviewId">,
    targetLanguage: BookReviewLanguage,
    now: Date = new Date(),
  ): Promise<PublicBookReview | null> {
    const linkedID = bookReview.translationSourceBookReviewId;
    const languageCondition: Where = { language: { equals: targetLanguage } };

    return linkedID === undefined
      ? this.findOne(
          [{ translation: { equals: bookReview.id } }, languageCondition],
          now,
          bookReview.id,
        )
      : this.findOne(
          [{ id: { equals: linkedID } }, languageCondition],
          now,
          bookReview.id,
        );
  }
}
