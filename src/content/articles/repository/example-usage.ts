import {
  exampleEnglishArticle,
  exampleTurkishArticle,
} from "@/content/articles/examples";
import { ArticleQueryService } from "@/content/articles/repository/article-query-service";
import { InMemoryArticleRepository } from "@/content/articles/repository/in-memory-article-repository";

export async function getArticleRepositoryExamples() {
  const repository = new InMemoryArticleRepository([
    exampleTurkishArticle,
    exampleEnglishArticle,
  ]);
  const queryService = new ArticleQueryService(repository);

  const turkishArticle = await queryService.getPublishedArticle(
    exampleTurkishArticle.slug,
    "tr",
  );
  const publishedArticles = await queryService.getPublishedArticles({
    language: "tr",
  });
  const realEstateArticles = await queryService.getPublishedArticles({
    language: "tr",
    category: "real_estate",
  });
  const featuredArticles = await queryService.getFeaturedArticles("tr", 3);
  const englishTranslation = await queryService.getArticleTranslation(
    exampleTurkishArticle.id,
    "en",
  );

  return {
    turkishArticle,
    publishedArticles,
    realEstateArticles,
    featuredArticles,
    englishTranslation,
  };
}
