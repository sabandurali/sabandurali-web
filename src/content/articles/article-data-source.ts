import {
  exampleDraftArticle,
  exampleEnglishArticle,
  exampleTurkishArticle,
} from "@/content/articles/examples";
import { ArticleQueryService } from "@/content/articles/repository/article-query-service";
import { InMemoryArticleRepository } from "@/content/articles/repository/in-memory-article-repository";
import { MAX_ARTICLE_PAGE_SIZE } from "@/content/articles/repository/types";
import type {
  Article,
  ArticleLanguage,
} from "@/content/articles/types";

const articleRepository = new InMemoryArticleRepository([
  exampleTurkishArticle,
  exampleEnglishArticle,
  exampleDraftArticle,
]);

export const articleQueryService = new ArticleQueryService(articleRepository);

export type PublishedArticlePageData = {
  article: Article | null;
  translation: Article | null;
};

export async function getPublishedArticlePageData(
  slug: string,
  language: ArticleLanguage,
): Promise<PublishedArticlePageData> {
  const article = await articleQueryService.getPublishedArticle(slug, language);

  if (article === null) {
    return { article: null, translation: null };
  }

  const translation = await articleQueryService.getArticleTranslation(
    article.id,
    language === "tr" ? "en" : "tr",
  );

  return { article, translation };
}

export async function getAllPublishedArticles(
  language: ArticleLanguage,
): Promise<Article[]> {
  const articles: Article[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await articleQueryService.getPublishedArticles({
      language,
      pagination: {
        page,
        pageSize: MAX_ARTICLE_PAGE_SIZE,
      },
    });

    articles.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  }

  return articles;
}

export async function getAllArticles(): Promise<Article[]> {
  const articles: Article[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await articleQueryService.getArticles({
      sort: "updatedAt_desc",
      pagination: {
        page,
        pageSize: MAX_ARTICLE_PAGE_SIZE,
      },
    });

    articles.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  }

  return articles;
}
