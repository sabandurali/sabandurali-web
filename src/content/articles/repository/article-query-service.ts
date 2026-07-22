import {
  isPubliclyPublishedArticle,
  type ArticleRepository,
} from "@/content/articles/repository/article-repository";
import type {
  PaginatedResult,
  PublishedArticleListQuery,
} from "@/content/articles/repository/types";
import type {
  Article,
  ArticleLanguage,
} from "@/content/articles/types";

const MAX_CURATED_ARTICLE_LIMIT = 20;

function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return 0;
  }

  return Math.min(Math.max(Math.floor(limit), 0), MAX_CURATED_ARTICLE_LIMIT);
}

export class ArticleQueryService {
  constructor(
    private readonly repository: ArticleRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getPublishedArticle(
    slug: string,
    language: ArticleLanguage,
  ): Promise<Article | null> {
    const article = await this.repository.findBySlugAndLanguage(slug, language);

    return article !== null && isPubliclyPublishedArticle(article, this.now())
      ? article
      : null;
  }

  async getPublishedArticles(
    query: PublishedArticleListQuery = {},
  ): Promise<PaginatedResult<Article>> {
    return this.repository.list({
      ...query,
      publishedOnly: true,
      publishedAsOf: this.now(),
    });
  }

  async getFeaturedArticles(
    language: ArticleLanguage,
    limit: number,
  ): Promise<Article[]> {
    const safeLimit = normalizeLimit(limit);

    if (safeLimit === 0) {
      return [];
    }

    const result = await this.getPublishedArticles({
      language,
      featured: true,
      pagination: { page: 1, pageSize: safeLimit },
    });

    return result.items;
  }

  async getHomepageArticles(
    language: ArticleLanguage,
    limit: number,
  ): Promise<Article[]> {
    const safeLimit = normalizeLimit(limit);

    if (safeLimit === 0) {
      return [];
    }

    const result = await this.getPublishedArticles({
      language,
      showOnHomepage: true,
      pagination: { page: 1, pageSize: safeLimit },
    });

    return result.items;
  }

  async getArticleTranslation(
    articleId: string,
    targetLanguage: ArticleLanguage,
  ): Promise<Article | null> {
    const translation = await this.repository.findTranslation(
      articleId,
      targetLanguage,
    );

    return translation !== null &&
      isPubliclyPublishedArticle(translation, this.now())
      ? translation
      : null;
  }
}
