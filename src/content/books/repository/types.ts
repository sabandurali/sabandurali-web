import type {
  BookCategory,
  BookReviewLanguage,
  ReadingStatus,
  ReviewStatus,
} from "@/content/books/types";

export const DEFAULT_BOOK_REVIEW_PAGE_SIZE = 10;
export const MAX_BOOK_REVIEW_PAGE_SIZE = 100;

export type BookReviewSortOption =
  | "publishedAt_desc"
  | "publishedAt_asc"
  | "updatedAt_desc"
  | "title_asc"
  | "title_desc"
  | "rating_desc"
  | "rating_asc"
  | "completedAt_desc"
  | "completedAt_asc";

export type BookReviewPagination = {
  page?: number;
  pageSize?: number;
};

export type BookReviewListQuery = {
  language?: BookReviewLanguage;
  reviewStatus?: ReviewStatus;
  readingStatus?: ReadingStatus;
  category?: BookCategory;
  /** Every supplied tag id must exist on the review. */
  tagIds?: ReadonlyArray<string>;
  /** At least one supplied author id must exist on the review. */
  authorIds?: ReadonlyArray<string>;
  featured?: boolean;
  showOnHomepage?: boolean;
  minimumRating?: number;
  maximumRating?: number;
  publishedBefore?: string;
  publishedAfter?: string;
  completedBefore?: string;
  completedAfter?: string;
  search?: string;
  sort?: BookReviewSortOption;
  pagination?: BookReviewPagination;
  publishedOnly?: boolean;
  publishedAsOf?: Date;
};

export type PublishedBookReviewListQuery = Omit<
  BookReviewListQuery,
  "reviewStatus" | "publishedOnly" | "publishedAsOf"
>;

export type PaginatedBookReviewResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
