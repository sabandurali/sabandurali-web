import "server-only";
import { cache } from "react";
import {
  exampleEnglishBookReview,
  exampleTurkishBookReview,
} from "@/content/books/examples";
import { PayloadBookReviewRepository } from "@/content/books/payload-book-review-repository";
import { BookReviewQueryService } from "@/content/books/repository/book-review-query-service";
import { InMemoryBookReviewRepository } from "@/content/books/repository/in-memory-book-review-repository";
import { MAX_BOOK_REVIEW_PAGE_SIZE } from "@/content/books/repository/types";
import type {
  BookReview,
  BookReviewLanguage,
} from "@/content/books/types";

const modelFixtures = [
  exampleTurkishBookReview,
  exampleEnglishBookReview,
] satisfies ReadonlyArray<BookReview>;

function createDevelopmentPublishedFixture(review: BookReview): BookReview {
  return {
    ...structuredClone(review),
    reviewStatus: "published",
    seo: {
      ...review.seo,
      index: true,
    },
  };
}

function createDevelopmentRouteGuards(): BookReview[] {
  const base = structuredClone(exampleTurkishBookReview);

  return [
    {
      ...base,
      id: "development-book-review-draft",
      slug: "development-draft-book-review",
      translationGroupId: null,
      reviewStatus: "draft",
      publishedAt: null,
      seo: { ...base.seo, index: false },
    },
    {
      ...base,
      id: "development-book-review-future",
      slug: "development-future-book-review",
      translationGroupId: null,
      reviewStatus: "published",
      publishedAt: "2099-01-01T00:00:00+03:00",
      seo: { ...base.seo, index: true },
    },
    {
      ...base,
      id: "development-book-review-noindex",
      slug: "development-noindex-book-review",
      translationGroupId: null,
      reviewStatus: "published",
      seo: { ...base.seo, index: false },
    },
  ];
}

// The source records remain draft/noindex in production. Local development
// receives isolated published clones so list/detail behavior can be exercised
// without presenting the model-only review as a real production publication.
const initialBookReviews: ReadonlyArray<BookReview> =
  process.env.NODE_ENV === "development"
    ? [
        ...modelFixtures.map(createDevelopmentPublishedFixture),
        ...createDevelopmentRouteGuards(),
      ]
    : modelFixtures;

const bookReviewRepository = new InMemoryBookReviewRepository(
  initialBookReviews,
);
const payloadBookReviewRepository = new PayloadBookReviewRepository();
const payloadBookReviewQueryService = new BookReviewQueryService(
  payloadBookReviewRepository,
);

export const bookReviewQueryService = new BookReviewQueryService(
  bookReviewRepository,
);

type PublicBookReviewSource = "payload" | "static";

function getPublicBookReviewSource(): PublicBookReviewSource {
  const source = process.env.BOOK_PUBLIC_SOURCE;

  if (source === undefined || source === "static") {
    return "static";
  }

  if (source === "payload") {
    if (process.env.NODE_ENV !== "development") {
      throw new Error(
        "BOOK_PUBLIC_SOURCE=payload is restricted to local development during this project stage.",
      );
    }

    return "payload";
  }

  throw new Error(
    `Invalid BOOK_PUBLIC_SOURCE value "${source}". Expected "static" or "payload".`,
  );
}

export async function getAllBookReviews(): Promise<BookReview[]> {
  const bookReviews: BookReview[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await bookReviewRepository.list({
      sort: "updatedAt_desc",
      pagination: {
        page,
        pageSize: MAX_BOOK_REVIEW_PAGE_SIZE,
      },
    });

    bookReviews.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  }

  return bookReviews;
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
    const queryService =
      getPublicBookReviewSource() === "payload"
        ? payloadBookReviewQueryService
        : bookReviewQueryService;
    const bookReview = await queryService.getPublishedBookReview(
      slug,
      language,
    );

    if (bookReview === null) {
      return { bookReview: null, translation: null };
    }

    const translation = await queryService.getBookReviewTranslation(
      bookReview.id,
      language === "tr" ? "en" : "tr",
    );

    return { bookReview, translation };
  },
);

export async function getAllPublishedBookReviews(
  language: BookReviewLanguage,
): Promise<BookReview[]> {
  const queryService =
    getPublicBookReviewSource() === "payload"
      ? payloadBookReviewQueryService
      : bookReviewQueryService;
  const bookReviews: BookReview[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await queryService.getPublishedBookReviews({
      language,
      pagination: {
        page,
        pageSize: MAX_BOOK_REVIEW_PAGE_SIZE,
      },
    });

    bookReviews.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  }

  return bookReviews;
}
