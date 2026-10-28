import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { createPublicBookReviewConditions } from "@/content/books/book-query-conditions";
import { mapPayloadBookReview } from "@/content/books/payload-book-review-mapper";
import type { BookReview, BookReviewLanguage } from "@/content/books/types";

const PAYLOAD_BOOK_PAGE_SIZE = 100;
const PUBLIC_BOOK_SORT = ["-publishedAt", "id"];

export class PayloadPublicBookReviewRepository {
  private async findOne(
    conditions: Where[],
    now: Date,
    relatedTranslationID?: string | null,
  ): Promise<BookReview | null> {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "books",
      depth: 1,
      draft: false,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      where: {
        and: [...createPublicBookReviewConditions(now), ...conditions],
      },
    });
    const document = result.docs[0];

    return document === undefined
      ? null
      : mapPayloadBookReview(document, now, relatedTranslationID);
  }

  async listPublished(
    language: BookReviewLanguage,
    now: Date = new Date(),
  ): Promise<BookReview[]> {
    const payload = await getPayload({ config });
    const bookReviews: BookReview[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const result = await payload.find({
        collection: "books",
        depth: 1,
        draft: false,
        limit: PAYLOAD_BOOK_PAGE_SIZE,
        overrideAccess: false,
        page,
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
        if (bookReview !== null) bookReviews.push(bookReview);
      }

      totalPages = result.totalPages;
      page += 1;
    }

    return bookReviews;
  }

  async findPublishedBySlug(
    slug: string,
    language: BookReviewLanguage,
    now: Date = new Date(),
  ): Promise<BookReview | null> {
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
    bookReview: BookReview,
    targetLanguage: BookReviewLanguage,
    now: Date = new Date(),
  ): Promise<BookReview | null> {
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
