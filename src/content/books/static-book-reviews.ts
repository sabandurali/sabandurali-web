import {
  exampleEnglishBookReview,
  exampleTurkishBookReview,
} from "@/content/books/examples";
import type { BookReview, BookReviewLanguage } from "@/content/books/types";

/** A review is public only when it is published, indexable and not scheduled. */
export function isPubliclyPublishedBookReview(
  bookReview: BookReview,
  now: Date,
): boolean {
  if (
    bookReview.reviewStatus !== "published" ||
    bookReview.publishedAt === null ||
    !bookReview.seo.index
  ) {
    return false;
  }

  const publishedAt = Date.parse(bookReview.publishedAt);
  return Number.isFinite(publishedAt) && publishedAt <= now.getTime();
}

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

/**
 * The model fixtures stay draft/noindex outside development. Local
 * development receives isolated published clones plus draft, future and
 * noindex guards, so list and detail behaviour can be exercised without
 * presenting the model review as a real publication.
 */
export function createStaticBookReviewFixtures(
  nodeEnvironment: string | undefined,
): BookReview[] {
  const modelFixtures = [exampleTurkishBookReview, exampleEnglishBookReview];

  return nodeEnvironment === "development"
    ? [
        ...modelFixtures.map(createDevelopmentPublishedFixture),
        ...createDevelopmentRouteGuards(),
      ]
    : modelFixtures.map((review) => structuredClone(review));
}

function compareNewestFirst(left: BookReview, right: BookReview): number {
  const leftTime = Date.parse(left.publishedAt ?? "");
  const rightTime = Date.parse(right.publishedAt ?? "");
  const byDate =
    (Number.isFinite(rightTime) ? rightTime : 0) -
    (Number.isFinite(leftTime) ? leftTime : 0);

  return byDate || left.id.localeCompare(right.id);
}

export function listStaticPublishedBookReviews(
  bookReviews: ReadonlyArray<BookReview>,
  language: BookReviewLanguage,
  now: Date,
): BookReview[] {
  return bookReviews
    .filter(
      (bookReview) =>
        bookReview.language === language &&
        isPubliclyPublishedBookReview(bookReview, now),
    )
    .toSorted(compareNewestFirst);
}

export function findStaticPublishedBookReview(
  bookReviews: ReadonlyArray<BookReview>,
  slug: string,
  language: BookReviewLanguage,
  now: Date,
): BookReview | null {
  return (
    listStaticPublishedBookReviews(bookReviews, language, now).find(
      (bookReview) => bookReview.slug === slug,
    ) ?? null
  );
}

export function findStaticBookReviewTranslation(
  bookReviews: ReadonlyArray<BookReview>,
  bookReview: BookReview,
  targetLanguage: BookReviewLanguage,
  now: Date,
): BookReview | null {
  if (bookReview.translationGroupId === null) return null;

  return (
    listStaticPublishedBookReviews(bookReviews, targetLanguage, now).find(
      (candidate) =>
        candidate.id !== bookReview.id &&
        candidate.translationGroupId === bookReview.translationGroupId,
    ) ?? null
  );
}
