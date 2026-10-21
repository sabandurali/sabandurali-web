import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { normalizeIsbn } from "@/content/books/helpers";
import { mapPayloadBookReview } from "@/content/books/payload-book-review-mapper";
import type { BookReviewRepository } from "@/content/books/repository/book-review-repository";
import { InMemoryBookReviewRepository } from "@/content/books/repository/in-memory-book-review-repository";
import type {
  BookReviewListQuery,
  PaginatedBookReviewResult,
} from "@/content/books/repository/types";
import type {
  BookReview,
  BookReviewLanguage,
} from "@/content/books/types";

const PAYLOAD_BOOK_PAGE_SIZE = 100;

function createPublicConditions(now: Date): Where[] {
  return [
    {
      _status: {
        equals: "published",
      },
    },
    {
      reviewStatus: {
        equals: "published",
      },
    },
    {
      publishedAt: {
        less_than_equal: now.toISOString(),
      },
    },
    {
      "seo.index": {
        equals: true,
      },
    },
  ];
}

function createIDCondition(id: string): Where {
  return {
    id: {
      equals: id,
    },
  };
}

export class PayloadBookReviewRepository
  implements BookReviewRepository
{
  private async findOne(
    conditions: Where[],
    now: Date = new Date(),
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
        and: [...createPublicConditions(now), ...conditions],
      },
    });
    const document = result.docs[0];

    return document === undefined
      ? null
      : mapPayloadBookReview(document, now, relatedTranslationID);
  }

  private async listAllPublic(
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
        sort: "-publishedAt",
        where: {
          and: createPublicConditions(now),
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

  async findById(id: string): Promise<BookReview | null> {
    return this.findOne([createIDCondition(id)]);
  }

  async findBySlugAndLanguage(
    slug: string,
    language: BookReviewLanguage,
  ): Promise<BookReview | null> {
    return this.findOne([
      {
        slug: {
          equals: slug,
        },
      },
      {
        language: {
          equals: language,
        },
      },
    ]);
  }

  async findByIsbn(isbn: string): Promise<BookReview | null> {
    const normalizedIsbn = normalizeIsbn(isbn);

    if (normalizedIsbn === "") return null;

    return this.findOne([
      {
        or: [
          {
            isbn10: {
              equals: normalizedIsbn,
            },
          },
          {
            isbn13: {
              equals: normalizedIsbn,
            },
          },
        ],
      },
    ]);
  }

  async findTranslation(
    bookReviewId: string,
    targetLanguage: BookReviewLanguage,
  ): Promise<BookReview | null> {
    const payload = await getPayload({ config });
    const now = new Date();
    const sourceResult = await payload.find({
      collection: "books",
      depth: 0,
      draft: false,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      where: {
        and: [
          ...createPublicConditions(now),
          createIDCondition(bookReviewId),
        ],
      },
    });
    const source = sourceResult.docs[0];

    if (source === undefined) return null;

    const directTranslationID =
      typeof source.translation === "string"
        ? source.translation
        : source.translation?.id ?? null;

    if (directTranslationID !== null) {
      return this.findOne(
        [
          createIDCondition(directTranslationID),
          {
            language: {
              equals: targetLanguage,
            },
          },
        ],
        now,
        bookReviewId,
      );
    }

    return this.findOne(
      [
        {
          translation: {
            equals: bookReviewId,
          },
        },
        {
          language: {
            equals: targetLanguage,
          },
        },
      ],
      now,
      bookReviewId,
    );
  }

  async list(
    query: BookReviewListQuery = {},
  ): Promise<PaginatedBookReviewResult<BookReview>> {
    const now = query.publishedAsOf ?? new Date();
    const publicBookReviews = await this.listAllPublic(now);
    const repository = new InMemoryBookReviewRepository(publicBookReviews);

    return repository.list({
      ...query,
      publishedOnly: true,
      publishedAsOf: now,
    });
  }

  async existsBySlug(
    slug: string,
    language: BookReviewLanguage,
    excludeId?: string,
  ): Promise<boolean> {
    const now = new Date();
    const bookReview = await this.findOne([
      {
        slug: {
          equals: slug,
        },
      },
      {
        language: {
          equals: language,
        },
      },
      ...(excludeId === undefined
        ? []
        : [
            {
              id: {
                not_equals: excludeId,
              },
            },
          ]),
    ], now);

    return bookReview !== null;
  }

  async existsByIsbn(
    isbn: string,
    excludeId?: string,
  ): Promise<boolean> {
    const normalizedIsbn = normalizeIsbn(isbn);

    if (normalizedIsbn === "") return false;

    const bookReview = await this.findOne([
      {
        or: [
          { isbn10: { equals: normalizedIsbn } },
          { isbn13: { equals: normalizedIsbn } },
        ],
      },
      ...(excludeId === undefined
        ? []
        : [
            {
              id: {
                not_equals: excludeId,
              },
            },
          ]),
    ]);

    return bookReview !== null;
  }
}
