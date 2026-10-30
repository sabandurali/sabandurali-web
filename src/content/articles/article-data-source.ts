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
  PublicArticleSummaryPage,
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

function isPayloadSource(): boolean {
  return readPublicSource("ARTICLE_PUBLIC_SOURCE") === "payload";
}

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
    isPayloadSource()
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
    isPayloadSource()
      ? payloadArticleRepository.listPublished(language)
      : getAllStaticPublishedArticles(language),
);

/**
 * The newest `limit` public standalone articles, read with a database limit
 * for surfaces that show only a few (the home page). Use this instead of
 * slicing getAllPublishedArticles().
 */
export const getLatestPublishedArticles = cache(
  async (
    language: ArticleLanguage,
    limit: number,
  ): Promise<PublicArticleSummary[]> =>
    isPayloadSource()
      ? payloadArticleRepository.listPublished(language, new Date(), limit)
      : getAllStaticPublishedArticles(language).slice(0, Math.max(0, limit)),
);

/** Whether a language has any public standalone article (one-row read). */
export async function hasPublishedArticles(
  language: ArticleLanguage,
): Promise<boolean> {
  return (await getLatestPublishedArticles(language, 1)).length > 0;
}

/**
 * Public articles in one category, filtered in the database. Use this
 * instead of filtering getAllPublishedArticles() in a page.
 */
export const getPublishedArticlesByCategory = cache(
  async (
    categorySlug: string,
    language: ArticleLanguage,
  ): Promise<PublicArticleSummary[]> =>
    isPayloadSource()
      ? payloadArticleRepository.listByCategory(categorySlug, language)
      : getAllStaticPublishedArticles(language).filter((article) =>
          article.categories.some((category) => category.slug === categorySlug),
        ),
);

/**
 * One page of a district's (Turkish) news, paginated in the database: a
 * request reads `pageSize` items and the totals instead of the district's
 * whole history. The static source has no district news.
 */
export const getDistrictNewsPage = cache(
  async (
    district: string,
    page: number,
    pageSize: number,
  ): Promise<PublicArticleSummaryPage> =>
    isPayloadSource()
      ? payloadArticleRepository.listDistrictNewsPage(district, page, pageSize)
      : { items: [], currentPage: 1, totalPages: 1, totalItems: 0 },
);

/** The news of every district in one query (the sitemap groups them). */
export const getAllDistrictNews = cache(
  async (language: ArticleLanguage): Promise<PublicArticleSummary[]> =>
    isPayloadSource()
      ? payloadArticleRepository.listAllDistrictNews(language)
      : [],
);

/**
 * The newest `limit` district news items, read with a database limit for
 * surfaces that show only a few (the district page).
 */
export const getLatestDistrictNews = cache(
  async (
    district: string,
    language: ArticleLanguage,
    limit: number,
  ): Promise<PublicArticleSummary[]> =>
    isPayloadSource()
      ? payloadArticleRepository.listDistrictArticles(
          "district-news",
          district,
          language,
          new Date(),
          limit,
        )
      : [],
);

/** District research articles, filtered in the database. */
export const getDistrictResearch = cache(
  async (
    district: string,
    language: ArticleLanguage,
  ): Promise<PublicArticleSummary[]> =>
    isPayloadSource()
      ? payloadArticleRepository.listDistrictArticles(
          "district-research",
          district,
          language,
        )
      : [],
);
