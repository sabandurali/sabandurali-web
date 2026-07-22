import { normalizeBookTagValue, normalizeIsbn } from "@/content/books/helpers";
import {
  isPubliclyPublishedBookReview,
  type BookReviewRepository,
} from "@/content/books/repository/book-review-repository";
import {
  DEFAULT_BOOK_REVIEW_PAGE_SIZE,
  MAX_BOOK_REVIEW_PAGE_SIZE,
  type BookReviewListQuery,
  type BookReviewSortOption,
  type PaginatedBookReviewResult,
} from "@/content/books/repository/types";
import type {
  BookReview,
  BookReviewLanguage,
} from "@/content/books/types";

const DEFAULT_BOOK_REVIEW_SORT: BookReviewSortOption = "publishedAt_desc";
const TITLE_COLLATOR = new Intl.Collator(["tr", "en"], {
  numeric: true,
  sensitivity: "base",
});

function cloneBookReview(bookReview: BookReview): BookReview {
  return structuredClone(bookReview);
}

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(value), 1), maximum);
}

function parseDate(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function compareNullableValues(
  left: number | null,
  right: number | null,
  direction: "asc" | "desc",
): number {
  if (left === null && right === null) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return direction === "asc" ? left - right : right - left;
}

function compareBookReviews(
  left: BookReview,
  right: BookReview,
  sort: BookReviewSortOption,
): number {
  let comparison = 0;

  switch (sort) {
    case "publishedAt_asc":
      comparison = compareNullableValues(
        parseDate(left.publishedAt),
        parseDate(right.publishedAt),
        "asc",
      );
      break;
    case "updatedAt_desc":
      comparison = compareNullableValues(
        parseDate(left.updatedAt),
        parseDate(right.updatedAt),
        "desc",
      );
      break;
    case "title_asc":
      comparison = TITLE_COLLATOR.compare(left.title, right.title);
      break;
    case "title_desc":
      comparison = TITLE_COLLATOR.compare(right.title, left.title);
      break;
    case "rating_desc":
      comparison = compareNullableValues(left.rating, right.rating, "desc");
      break;
    case "rating_asc":
      comparison = compareNullableValues(left.rating, right.rating, "asc");
      break;
    case "completedAt_desc":
      comparison = compareNullableValues(
        parseDate(left.completedAt),
        parseDate(right.completedAt),
        "desc",
      );
      break;
    case "completedAt_asc":
      comparison = compareNullableValues(
        parseDate(left.completedAt),
        parseDate(right.completedAt),
        "asc",
      );
      break;
    case "publishedAt_desc":
      comparison = compareNullableValues(
        parseDate(left.publishedAt),
        parseDate(right.publishedAt),
        "desc",
      );
      break;
  }

  return comparison || left.id.localeCompare(right.id);
}

function matchesSearch(
  bookReview: BookReview,
  search: string | undefined,
): boolean {
  if (search === undefined || search.trim() === "") {
    return true;
  }

  const searchTerms = search
    .trim()
    .split(/\s+/)
    .map(normalizeBookTagValue)
    .filter(Boolean);
  const searchableText = normalizeBookTagValue(
    [
      bookReview.title,
      bookReview.originalTitle,
      ...bookReview.authors.map((author) => author.name),
      bookReview.slug,
      bookReview.isbn10,
      bookReview.isbn13,
      bookReview.summary,
    ]
      .filter((value): value is string => value !== null)
      .join(" "),
  );

  return searchTerms.every((term) => searchableText.includes(term));
}

function matchesDateRange(
  value: string | null,
  after: string | undefined,
  before: string | undefined,
): boolean {
  if (after === undefined && before === undefined) {
    return true;
  }

  const timestamp = parseDate(value);

  if (timestamp === null) {
    return false;
  }

  if (after !== undefined) {
    const lowerBound = parseDate(after);
    if (lowerBound === null || timestamp <= lowerBound) {
      return false;
    }
  }

  if (before !== undefined) {
    const upperBound = parseDate(before);
    if (upperBound === null || timestamp >= upperBound) {
      return false;
    }
  }

  return true;
}

function normalizeRatingBound(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.min(Math.max(value, 0), 10);
}

function matchesRatingRange(
  bookReview: BookReview,
  minimumRating: number | undefined,
  maximumRating: number | undefined,
): boolean {
  const minimum = normalizeRatingBound(minimumRating);
  const maximum = normalizeRatingBound(maximumRating);

  if (minimum === undefined && maximum === undefined) {
    return true;
  }

  if (
    bookReview.rating === null ||
    (minimum !== undefined && maximum !== undefined && minimum > maximum)
  ) {
    return false;
  }

  return (
    (minimum === undefined || bookReview.rating >= minimum) &&
    (maximum === undefined || bookReview.rating <= maximum)
  );
}

function matchesQuery(
  bookReview: BookReview,
  query: BookReviewListQuery,
): boolean {
  return (
    (query.language === undefined ||
      bookReview.language === query.language) &&
    (query.reviewStatus === undefined ||
      bookReview.reviewStatus === query.reviewStatus) &&
    (query.readingStatus === undefined ||
      bookReview.readingStatus === query.readingStatus) &&
    (query.category === undefined ||
      bookReview.category === query.category) &&
    (query.featured === undefined ||
      bookReview.featured === query.featured) &&
    (query.showOnHomepage === undefined ||
      bookReview.showOnHomepage === query.showOnHomepage) &&
    (query.tagIds === undefined ||
      query.tagIds.length === 0 ||
      query.tagIds.every((tagId) =>
        bookReview.tags.some((tag) => tag.id === tagId),
      )) &&
    (query.authorIds === undefined ||
      query.authorIds.length === 0 ||
      query.authorIds.some((authorId) =>
        bookReview.authors.some((author) => author.id === authorId),
      )) &&
    (!query.publishedOnly ||
      isPubliclyPublishedBookReview(bookReview, query.publishedAsOf)) &&
    matchesRatingRange(
      bookReview,
      query.minimumRating,
      query.maximumRating,
    ) &&
    matchesDateRange(
      bookReview.publishedAt,
      query.publishedAfter,
      query.publishedBefore,
    ) &&
    matchesDateRange(
      bookReview.completedAt,
      query.completedAfter,
      query.completedBefore,
    ) &&
    matchesSearch(bookReview, query.search)
  );
}

function hasNormalizedIsbn(bookReview: BookReview, isbn: string): boolean {
  return [bookReview.isbn10, bookReview.isbn13].some(
    (candidate) => candidate !== null && normalizeIsbn(candidate) === isbn,
  );
}

/**
 * Development and test repository. Production persistence should implement
 * BookReviewRepository without changing its read-only contract.
 */
export class InMemoryBookReviewRepository implements BookReviewRepository {
  private readonly bookReviews: ReadonlyArray<BookReview>;

  constructor(initialBookReviews: ReadonlyArray<BookReview> = []) {
    this.bookReviews = initialBookReviews.map(cloneBookReview);
  }

  async findById(id: string): Promise<BookReview | null> {
    const bookReview = this.bookReviews.find((item) => item.id === id);
    return bookReview === undefined ? null : cloneBookReview(bookReview);
  }

  async findBySlugAndLanguage(
    slug: string,
    language: BookReviewLanguage,
  ): Promise<BookReview | null> {
    const bookReview = this.bookReviews.find(
      (item) => item.slug === slug && item.language === language,
    );

    return bookReview === undefined ? null : cloneBookReview(bookReview);
  }

  async findByIsbn(isbn: string): Promise<BookReview | null> {
    const normalizedIsbn = normalizeIsbn(isbn);

    if (normalizedIsbn === "") {
      return null;
    }

    const bookReview = this.bookReviews.find((item) =>
      hasNormalizedIsbn(item, normalizedIsbn),
    );

    return bookReview === undefined ? null : cloneBookReview(bookReview);
  }

  async findTranslation(
    bookReviewId: string,
    targetLanguage: BookReviewLanguage,
  ): Promise<BookReview | null> {
    const source = this.bookReviews.find((item) => item.id === bookReviewId);

    if (source === undefined || source.translationGroupId === null) {
      return null;
    }

    const translation = this.bookReviews.find(
      (item) =>
        item.id !== source.id &&
        item.language === targetLanguage &&
        item.translationGroupId === source.translationGroupId,
    );

    return translation === undefined ? null : cloneBookReview(translation);
  }

  async list(
    query: BookReviewListQuery = {},
  ): Promise<PaginatedBookReviewResult<BookReview>> {
    const effectiveQuery =
      query.publishedOnly && query.publishedAsOf === undefined
        ? { ...query, publishedAsOf: new Date() }
        : query;
    const page = normalizePositiveInteger(effectiveQuery.pagination?.page, 1);
    const pageSize = normalizePositiveInteger(
      effectiveQuery.pagination?.pageSize,
      DEFAULT_BOOK_REVIEW_PAGE_SIZE,
      MAX_BOOK_REVIEW_PAGE_SIZE,
    );
    const matchingBookReviews = this.bookReviews
      .filter((bookReview) => matchesQuery(bookReview, effectiveQuery))
      .sort((left, right) =>
        compareBookReviews(
          left,
          right,
          effectiveQuery.sort ?? DEFAULT_BOOK_REVIEW_SORT,
        ),
      );
    const total = matchingBookReviews.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const offset = Math.min(
      (page - 1) * pageSize,
      Number.MAX_SAFE_INTEGER,
    );

    return {
      items: matchingBookReviews
        .slice(offset, offset + pageSize)
        .map(cloneBookReview),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async existsBySlug(
    slug: string,
    language: BookReviewLanguage,
    excludeId?: string,
  ): Promise<boolean> {
    return this.bookReviews.some(
      (bookReview) =>
        bookReview.slug === slug &&
        bookReview.language === language &&
        bookReview.id !== excludeId,
    );
  }

  async existsByIsbn(isbn: string, excludeId?: string): Promise<boolean> {
    const normalizedIsbn = normalizeIsbn(isbn);

    if (normalizedIsbn === "") {
      return false;
    }

    return this.bookReviews.some(
      (bookReview) =>
        bookReview.id !== excludeId &&
        hasNormalizedIsbn(bookReview, normalizedIsbn),
    );
  }
}
