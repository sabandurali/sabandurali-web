import "server-only";
import { cache } from "react";
import {
  exampleDraftArticle,
  exampleEnglishArticle,
  exampleTurkishArticle,
} from "@/content/articles/examples";
import { PayloadPublicArticleRepository } from "@/content/articles/payload-article-repository";
import {
  toPublicArticleSummary,
  toPublicArticleTranslation,
} from "@/content/articles/payload-article-mapper";
import type {
  PublicArticle,
  PublicArticleSummary,
  PublicArticleTranslation,
} from "@/content/articles/public-types";
import {
  findStaticArticleTranslation,
  findStaticPublishedArticle,
  listStaticPublishedArticles,
  mapStaticArticle,
} from "@/content/articles/static-articles";
import type { Article, ArticleLanguage } from "@/content/articles/types";
import { readPublicSource } from "@/content/public-source";

// Repository fixtures exercise the article templates locally. Production
// builds never serve them, whatever the public source is.
const staticArticleFixtures: ReadonlyArray<Article> =
  process.env.NODE_ENV === "production"
    ? []
    : [exampleTurkishArticle, exampleEnglishArticle, exampleDraftArticle];

const payloadArticleRepository = new PayloadPublicArticleRepository();

export type PublishedArticlePageData = {
  article: PublicArticle | null;
  translation: PublicArticleTranslation | null;
};

async function getStaticPublishedArticlePageData(
  slug: string,
  language: ArticleLanguage,
): Promise<PublishedArticlePageData> {
  const now = new Date();
  const article = findStaticPublishedArticle(
    staticArticleFixtures,
    slug,
    language,
    now,
  );

  if (article === null) {
    return { article: null, translation: null };
  }

  const translation = findStaticArticleTranslation(
    staticArticleFixtures,
    article,
    language === "tr" ? "en" : "tr",
    now,
  );

  return {
    article: mapStaticArticle(article),
    translation:
      translation === null
        ? null
        : toPublicArticleTranslation(mapStaticArticle(translation)),
  };
}

async function getPayloadPublishedArticlePageData(
  slug: string,
  language: ArticleLanguage,
): Promise<PublishedArticlePageData> {
  const article = await payloadArticleRepository.findPublishedBySlug(
    slug,
    language,
  );

  if (article === null) {
    return { article: null, translation: null };
  }

  const translation = await payloadArticleRepository.findPublishedTranslation(
    article.id,
    language === "tr" ? "en" : "tr",
  );

  return {
    article,
    translation:
      translation === null ? null : toPublicArticleTranslation(translation),
  };
}

export const getPublishedArticlePageData = cache(
  async (
    slug: string,
    language: ArticleLanguage,
  ): Promise<PublishedArticlePageData> =>
    readPublicSource("ARTICLE_PUBLIC_SOURCE") === "payload"
      ? getPayloadPublishedArticlePageData(slug, language)
      : getStaticPublishedArticlePageData(slug, language),
);

function getAllStaticPublishedArticles(
  language: ArticleLanguage,
): PublicArticleSummary[] {
  return listStaticPublishedArticles(
    staticArticleFixtures,
    language,
    new Date(),
  ).map((article) => toPublicArticleSummary(mapStaticArticle(article)));
}

export async function getAllPublishedArticles(
  language: ArticleLanguage,
): Promise<PublicArticleSummary[]> {
  return readPublicSource("ARTICLE_PUBLIC_SOURCE") === "payload"
    ? payloadArticleRepository.listPublished(language)
    : getAllStaticPublishedArticles(language);
}

export async function getDistrictNews(
  district: string,
  language: ArticleLanguage,
): Promise<PublicArticleSummary[]> {
  if (readPublicSource("ARTICLE_PUBLIC_SOURCE") !== "payload") return [];
  return payloadArticleRepository.listDistrictNews(district, language);
}

export async function getDistrictResearch(
  district: string,
  language: ArticleLanguage,
): Promise<PublicArticleSummary[]> {
  const articles = await getAllPublishedArticles(language);
  return articles.filter(
    (article) =>
      article.articleType === "district-research" &&
      article.district === district,
  );
}
