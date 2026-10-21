import type {
  Article,
  ArticleLanguage,
} from "@/content/articles/types";
import type {
  ArticleListQuery,
  PaginatedResult,
} from "@/content/articles/repository/types";

export function isPubliclyPublishedArticle(
  article: Article,
  asOf: Date = new Date(),
): boolean {
  if (
    article.status !== "published" ||
    article.visibility !== "public" ||
    article.publishedAt === null
  ) {
    return false;
  }

  const publishedAt = Date.parse(article.publishedAt);
  const referenceTime = asOf.getTime();

  return (
    Number.isFinite(publishedAt) &&
    Number.isFinite(referenceTime) &&
    publishedAt <= referenceTime
  );
}

export interface ArticleRepository {
  findById(id: string): Promise<Article | null>;
  findBySlugAndLanguage(
    slug: string,
    language: ArticleLanguage,
  ): Promise<Article | null>;
  findTranslation(
    articleId: string,
    targetLanguage: ArticleLanguage,
  ): Promise<Article | null>;
  list(query?: ArticleListQuery): Promise<PaginatedResult<Article>>;
  existsBySlug(
    slug: string,
    language: ArticleLanguage,
    excludeId?: string,
  ): Promise<boolean>;
}
