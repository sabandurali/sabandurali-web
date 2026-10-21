import { normalizeTagValue } from "@/content/articles/helpers";
import {
  isPubliclyPublishedArticle,
  type ArticleRepository,
} from "@/content/articles/repository/article-repository";
import {
  DEFAULT_ARTICLE_PAGE_SIZE,
  MAX_ARTICLE_PAGE_SIZE,
  type ArticleListQuery,
  type ArticleSortOption,
  type PaginatedResult,
} from "@/content/articles/repository/types";
import type {
  Article,
  ArticleLanguage,
} from "@/content/articles/types";

const DEFAULT_ARTICLE_SORT: ArticleSortOption = "publishedAt_desc";
const TITLE_COLLATOR = new Intl.Collator(["tr", "en"], {
  numeric: true,
  sensitivity: "base",
});

function cloneArticle(article: Article): Article {
  return structuredClone(article);
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

function compareNullableDates(
  left: string | null,
  right: string | null,
  direction: "asc" | "desc",
): number {
  const leftTime = parseDate(left);
  const rightTime = parseDate(right);

  if (leftTime === null && rightTime === null) {
    return 0;
  }

  if (leftTime === null) {
    return 1;
  }

  if (rightTime === null) {
    return -1;
  }

  return direction === "asc" ? leftTime - rightTime : rightTime - leftTime;
}

function compareArticles(
  left: Article,
  right: Article,
  sort: ArticleSortOption,
): number {
  let comparison = 0;

  switch (sort) {
    case "publishedAt_asc":
      comparison = compareNullableDates(
        left.publishedAt,
        right.publishedAt,
        "asc",
      );
      break;
    case "updatedAt_desc":
      comparison = compareNullableDates(left.updatedAt, right.updatedAt, "desc");
      break;
    case "title_asc":
      comparison = TITLE_COLLATOR.compare(left.title, right.title);
      break;
    case "title_desc":
      comparison = TITLE_COLLATOR.compare(right.title, left.title);
      break;
    case "publishedAt_desc":
      comparison = compareNullableDates(
        left.publishedAt,
        right.publishedAt,
        "desc",
      );
      break;
  }

  return comparison || left.id.localeCompare(right.id);
}

function matchesSearch(article: Article, search: string | undefined): boolean {
  if (search === undefined || search.trim() === "") {
    return true;
  }

  const searchTerms = search
    .trim()
    .split(/\s+/)
    .map(normalizeTagValue)
    .filter(Boolean);
  const searchableText = normalizeTagValue(
    `${article.title} ${article.summary} ${article.slug}`,
  );

  return searchTerms.every((term) => searchableText.includes(term));
}

function matchesPublishedRange(
  article: Article,
  publishedAfter: string | undefined,
  publishedBefore: string | undefined,
): boolean {
  if (publishedAfter === undefined && publishedBefore === undefined) {
    return true;
  }

  const publishedAt = parseDate(article.publishedAt);

  if (publishedAt === null) {
    return false;
  }

  if (publishedAfter !== undefined) {
    const after = parseDate(publishedAfter);
    if (after === null || publishedAt <= after) {
      return false;
    }
  }

  if (publishedBefore !== undefined) {
    const before = parseDate(publishedBefore);
    if (before === null || publishedAt >= before) {
      return false;
    }
  }

  return true;
}

function matchesQuery(article: Article, query: ArticleListQuery): boolean {
  return (
    (query.language === undefined || article.language === query.language) &&
    (query.status === undefined || article.status === query.status) &&
    (query.visibility === undefined ||
      article.visibility === query.visibility) &&
    (query.category === undefined || article.category === query.category) &&
    (query.authorId === undefined || article.author?.id === query.authorId) &&
    (query.featured === undefined || article.featured === query.featured) &&
    (query.showOnHomepage === undefined ||
      article.showOnHomepage === query.showOnHomepage) &&
    (query.tagIds === undefined ||
      query.tagIds.every((tagId) =>
        article.tags.some((tag) => tag.id === tagId),
      )) &&
    (!query.publishedOnly ||
      isPubliclyPublishedArticle(article, query.publishedAsOf)) &&
    matchesPublishedRange(
      article,
      query.publishedAfter,
      query.publishedBefore,
    ) &&
    matchesSearch(article, query.search)
  );
}

/**
 * Development and test repository. Production persistence should implement
 * ArticleRepository without changing its read-only contract.
 */
export class InMemoryArticleRepository implements ArticleRepository {
  private readonly articles: ReadonlyArray<Article>;

  constructor(initialArticles: ReadonlyArray<Article> = []) {
    this.articles = initialArticles.map(cloneArticle);
  }

  async findById(id: string): Promise<Article | null> {
    const article = this.articles.find((item) => item.id === id);
    return article === undefined ? null : cloneArticle(article);
  }

  async findBySlugAndLanguage(
    slug: string,
    language: ArticleLanguage,
  ): Promise<Article | null> {
    const article = this.articles.find(
      (item) => item.slug === slug && item.language === language,
    );

    return article === undefined ? null : cloneArticle(article);
  }

  async findTranslation(
    articleId: string,
    targetLanguage: ArticleLanguage,
  ): Promise<Article | null> {
    const source = this.articles.find((article) => article.id === articleId);

    if (source === undefined || source.translationGroupId === null) {
      return null;
    }

    const translation = this.articles.find(
      (article) =>
        article.id !== source.id &&
        article.language === targetLanguage &&
        article.translationGroupId === source.translationGroupId,
    );

    return translation === undefined ? null : cloneArticle(translation);
  }

  async list(
    query: ArticleListQuery = {},
  ): Promise<PaginatedResult<Article>> {
    const effectiveQuery =
      query.publishedOnly && query.publishedAsOf === undefined
        ? { ...query, publishedAsOf: new Date() }
        : query;
    const page = normalizePositiveInteger(effectiveQuery.pagination?.page, 1);
    const pageSize = normalizePositiveInteger(
      effectiveQuery.pagination?.pageSize,
      DEFAULT_ARTICLE_PAGE_SIZE,
      MAX_ARTICLE_PAGE_SIZE,
    );
    const matchingArticles = this.articles
      .filter((article) => matchesQuery(article, effectiveQuery))
      .sort((left, right) =>
        compareArticles(
          left,
          right,
          effectiveQuery.sort ?? DEFAULT_ARTICLE_SORT,
        ),
      );
    const total = matchingArticles.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const offset = Math.min(
      (page - 1) * pageSize,
      Number.MAX_SAFE_INTEGER,
    );

    return {
      items: matchingArticles
        .slice(offset, offset + pageSize)
        .map(cloneArticle),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async existsBySlug(
    slug: string,
    language: ArticleLanguage,
    excludeId?: string,
  ): Promise<boolean> {
    return this.articles.some(
      (article) =>
        article.slug === slug &&
        article.language === language &&
        article.id !== excludeId,
    );
  }
}
