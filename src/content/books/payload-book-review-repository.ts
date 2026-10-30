import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import {
  collectMappedPages,
  getReadBatchSize,
} from "@/content/shared/pagination";
import { createPublicBookReviewConditions } from "@/content/books/book-query-conditions";
import {
  mapPayloadBookReview,
  mapPayloadBookReviewSummary,
} from "@/content/books/payload-book-review-mapper";
import {
  toPublicBookReview,
  type PublicBookReview,
  type PublicBookReviewSummary,
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
 * List reads leave out the long-form fields only the review page shows
 * (`BOOK_REVIEW_DETAIL_FIELDS`): on Postgres each of them is a separate
 * array table, joined for every listed review.
 */
export const BOOK_LIST_SELECT = {
  keyIdeas: false,
  strengths: false,
  weaknesses: false,
  whoShouldRead: false,
  whoShouldNotRead: false,
  applicationNotes: false,
  quotes: false,
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

  /**
   * Every public review of one language, or only the newest `limit`, as
   * list summaries (no long-form detail fields).
   */
  async listPublished(
    language: BookReviewLanguage,
    now: Date = new Date(),
    limit?: number,
  ): Promise<PublicBookReviewSummary[]> {
    const payload = await getPayload({ config });

    return collectMappedPages(async (page) => {
      const result = await payload.find({
        collection: "books",
        depth: 1,
        draft: false,
        limit: getReadBatchSize(limit, PAYLOAD_BOOK_PAGE_SIZE),
        overrideAccess: false,
        page,
        populate: BOOK_RELATION_POPULATE,
        select: BOOK_LIST_SELECT,
        sort: PUBLIC_BOOK_SORT,
        where: {
          and: [
            ...createPublicBookReviewConditions(now),
            { language: { equals: language } },
          ],
        },
      });

      return {
        items: result.docs.flatMap((document): PublicBookReviewSummary[] => {
          const bookReview = mapPayloadBookReviewSummary(document, now);
          return bookReview === null ? [] : [bookReview];
        }),
        totalPages: result.totalPages,
      };
    }, limit);
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
