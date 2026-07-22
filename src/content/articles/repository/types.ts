import type {
  ArticleCategory,
  ArticleLanguage,
  ArticleStatus,
  ArticleVisibility,
} from "@/content/articles/types";

export const DEFAULT_ARTICLE_PAGE_SIZE = 10;
export const MAX_ARTICLE_PAGE_SIZE = 100;

export type ArticleSortOption =
  | "publishedAt_desc"
  | "publishedAt_asc"
  | "updatedAt_desc"
  | "title_asc"
  | "title_desc";

export type ArticlePagination = {
  page?: number;
  pageSize?: number;
};

export type ArticleListQuery = {
  language?: ArticleLanguage;
  status?: ArticleStatus;
  visibility?: ArticleVisibility;
  category?: ArticleCategory;
  tagIds?: ReadonlyArray<string>;
  authorId?: string;
  featured?: boolean;
  showOnHomepage?: boolean;
  publishedBefore?: string;
  publishedAfter?: string;
  search?: string;
  sort?: ArticleSortOption;
  pagination?: ArticlePagination;
  publishedOnly?: boolean;
  publishedAsOf?: Date;
};

export type PublishedArticleListQuery = Omit<
  ArticleListQuery,
  "status" | "visibility" | "publishedOnly" | "publishedAsOf"
>;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
