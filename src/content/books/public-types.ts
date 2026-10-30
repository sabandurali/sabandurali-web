import type { BookReview } from "@/content/books/types";

/**
 * Editorial fields of the book review model that public pages never show:
 * the review workflow, the people behind it, homepage curation and
 * translation bookkeeping.
 */
export const PRIVATE_BOOK_REVIEW_FIELDS = [
  "reviewStatus",
  "authorId",
  "editorId",
  "showOnHomepage",
  "translationStatus",
  "translationSourceUpdatedAt",
  "relatedBookIds",
] as const satisfies ReadonlyArray<keyof BookReview>;

type PrivateBookReviewField = (typeof PRIVATE_BOOK_REVIEW_FIELDS)[number];

/**
 * What components receive for a book review. The translation links
 * (`translationGroupId`, `translationSourceBookReviewId`) stay: they only
 * name other public reviews and pair the language versions.
 */
export type PublicBookReview = Omit<BookReview, PrivateBookReviewField>;

/**
 * Copies the public fields one by one (an allowlist), so the editorial
 * fields are dropped at runtime and not only in the type, and a field added
 * to the model stays private until it is listed here.
 */
export function toPublicBookReview(bookReview: BookReview): PublicBookReview {
  return {
    id: bookReview.id,
    title: bookReview.title,
    slug: bookReview.slug,
    language: bookReview.language,
    translationGroupId: bookReview.translationGroupId,
    originalTitle: bookReview.originalTitle,
    authors: bookReview.authors,
    translator: bookReview.translator,
    publisher: bookReview.publisher,
    originalPublisher: bookReview.originalPublisher,
    publicationYear: bookReview.publicationYear,
    originalPublicationYear: bookReview.originalPublicationYear,
    edition: bookReview.edition,
    isbn10: bookReview.isbn10,
    isbn13: bookReview.isbn13,
    pageCount: bookReview.pageCount,
    coverImage: bookReview.coverImage,
    category: bookReview.category,
    tags: bookReview.tags,
    readingStatus: bookReview.readingStatus,
    startedAt: bookReview.startedAt,
    completedAt: bookReview.completedAt,
    summary: bookReview.summary,
    keyIdeas: bookReview.keyIdeas,
    strengths: bookReview.strengths,
    weaknesses: bookReview.weaknesses,
    whoShouldRead: bookReview.whoShouldRead,
    whoShouldNotRead: bookReview.whoShouldNotRead,
    applicationNotes: bookReview.applicationNotes,
    personalEvaluation: bookReview.personalEvaluation,
    rating: bookReview.rating,
    quotes: bookReview.quotes,
    featured: bookReview.featured,
    seo: bookReview.seo,
    createdAt: bookReview.createdAt,
    updatedAt: bookReview.updatedAt,
    publishedAt: bookReview.publishedAt,
    ...(bookReview.translationSourceBookReviewId === undefined
      ? {}
      : {
          translationSourceBookReviewId:
            bookReview.translationSourceBookReviewId,
        }),
  };
}

/**
 * Long-form fields only the review page shows. Lists (cards, the home page,
 * the sitemap, static params) never read them: the list query leaves them
 * out (`BOOK_LIST_SELECT`) and the summary type does not carry them.
 */
export const BOOK_REVIEW_DETAIL_FIELDS = [
  "keyIdeas",
  "strengths",
  "weaknesses",
  "whoShouldRead",
  "whoShouldNotRead",
  "applicationNotes",
  "quotes",
] as const satisfies ReadonlyArray<keyof PublicBookReview>;

type BookReviewDetailField = (typeof BOOK_REVIEW_DETAIL_FIELDS)[number];

/** What a list of reviews (card, home page, sitemap) receives. */
export type PublicBookReviewSummary = Omit<
  PublicBookReview,
  BookReviewDetailField
>;

/**
 * The list projection of a review, again an allowlist: the public fields
 * without the long-form detail fields.
 */
export function toPublicBookReviewSummary(
  bookReview: BookReview | PublicBookReview,
): PublicBookReviewSummary {
  return {
    id: bookReview.id,
    title: bookReview.title,
    slug: bookReview.slug,
    language: bookReview.language,
    translationGroupId: bookReview.translationGroupId,
    originalTitle: bookReview.originalTitle,
    authors: bookReview.authors,
    translator: bookReview.translator,
    publisher: bookReview.publisher,
    originalPublisher: bookReview.originalPublisher,
    publicationYear: bookReview.publicationYear,
    originalPublicationYear: bookReview.originalPublicationYear,
    edition: bookReview.edition,
    isbn10: bookReview.isbn10,
    isbn13: bookReview.isbn13,
    pageCount: bookReview.pageCount,
    coverImage: bookReview.coverImage,
    category: bookReview.category,
    tags: bookReview.tags,
    readingStatus: bookReview.readingStatus,
    startedAt: bookReview.startedAt,
    completedAt: bookReview.completedAt,
    summary: bookReview.summary,
    personalEvaluation: bookReview.personalEvaluation,
    rating: bookReview.rating,
    featured: bookReview.featured,
    seo: bookReview.seo,
    createdAt: bookReview.createdAt,
    updatedAt: bookReview.updatedAt,
    publishedAt: bookReview.publishedAt,
    ...(bookReview.translationSourceBookReviewId === undefined
      ? {}
      : {
          translationSourceBookReviewId:
            bookReview.translationSourceBookReviewId,
        }),
  };
}
