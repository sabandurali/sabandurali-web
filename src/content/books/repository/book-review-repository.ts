import type {
  BookReviewListQuery,
  PaginatedBookReviewResult,
} from "@/content/books/repository/types";
import type {
  BookReview,
  BookReviewLanguage,
} from "@/content/books/types";

export function isPubliclyPublishedBookReview(
  bookReview: BookReview,
  referenceDate: Date = new Date(),
): boolean {
  if (
    bookReview.reviewStatus !== "published" ||
    bookReview.publishedAt === null ||
    !bookReview.seo.index
  ) {
    return false;
  }

  const publishedAt = Date.parse(bookReview.publishedAt);
  const referenceTime = referenceDate.getTime();

  return (
    Number.isFinite(publishedAt) &&
    Number.isFinite(referenceTime) &&
    publishedAt <= referenceTime
  );
}

export interface BookReviewRepository {
  findById(id: string): Promise<BookReview | null>;
  findBySlugAndLanguage(
    slug: string,
    language: BookReviewLanguage,
  ): Promise<BookReview | null>;
  findByIsbn(isbn: string): Promise<BookReview | null>;
  findTranslation(
    bookReviewId: string,
    targetLanguage: BookReviewLanguage,
  ): Promise<BookReview | null>;
  list(
    query?: BookReviewListQuery,
  ): Promise<PaginatedBookReviewResult<BookReview>>;
  existsBySlug(
    slug: string,
    language: BookReviewLanguage,
    excludeId?: string,
  ): Promise<boolean>;
  existsByIsbn(isbn: string, excludeId?: string): Promise<boolean>;
}
