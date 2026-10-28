import "server-only";
import { cache } from "react";
import {
  exampleDraftArticle,
  exampleEnglishArticle,
  exampleTurkishArticle,
} from "@/content/articles/examples";
import { isOfferedTranslationPair } from "@/content/articles/article-translation";
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
  const now = new Date();
  const article = await payloadArticleRepository.findPublishedBySlug(
    slug,
    language,
    now,
  );

  if (article === null) {
    return { article: null, translation: null };
  }

  const translation = await payloadArticleRepository.findPublishedTranslation(
    article.id,
    language === "tr" ? "en" : "tr",
    now,
  );

  // The Turkish version is the source of every English page: an English
  // translation that does not cover it is neither served nor linked.
  if (language === "en") {
    return isOfferedTranslationPair(article, translation)
      ? {
          article,
          translation:
            translation === null
              ? null
              : toPublicArticleTranslation(translation),
        }
      : { article: null, translation: null };
  }

  return {
    article,
    translation:
      translation !== null && isOfferedTranslationPair(translation, article)
        ? toPublicArticleTranslation(translation)
        : null,
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

/** Every public standalone article (district news excluded), newest first. */
export const getAllPublishedArticles = cache(
  async (language: ArticleLanguage): Promise<PublicArticleSummary[]> =>
    readPublicSource("ARTICLE_PUBLIC_SOURCE") === "payload"
      ? payloadArticleRepository.listPublished(language)
      : getAllStaticPublishedArticles(language),
);

/**
 * Public articles in one category, filtered in the database. Use this
 * instead of filtering getAllPublishedArticles() in a page.
 */
export const getPublishedArticlesByCategory = cache(
  async (
    categorySlug: string,
    language: ArticleLanguage,
  ): Promise<PublicArticleSummary[]> =>
    readPublicSource("ARTICLE_PUBLIC_SOURCE") === "payload"
      ? payloadArticleRepository.listByCategory(categorySlug, language)
      : getAllStaticPublishedArticles(language).filter((article) =>
          article.categories.some((category) => category.slug === categorySlug),
        ),
);

/** Source-linked district news; the static source has none. */
export const getDistrictNews = cache(
  async (
    district: string,
    language: ArticleLanguage,
  ): Promise<PublicArticleSummary[]> =>
    readPublicSource("ARTICLE_PUBLIC_SOURCE") === "payload"
      ? payloadArticleRepository.listDistrictArticles(
          "district-news",
          district,
          language,
        )
      : [],
);

/** District research articles, filtered in the database. */
export const getDistrictResearch = cache(
  async (
    district: string,
    language: ArticleLanguage,
  ): Promise<PublicArticleSummary[]> =>
    readPublicSource("ARTICLE_PUBLIC_SOURCE") === "payload"
      ? payloadArticleRepository.listDistrictArticles(
          "district-research",
          district,
          language,
        )
      : [],
);
