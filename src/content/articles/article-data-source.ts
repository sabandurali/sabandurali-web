import "server-only";
import { cache } from "react";
import {
  exampleDraftArticle,
  exampleEnglishArticle,
  exampleTurkishArticle,
} from "@/content/articles/examples";
import { ARTICLE_CATEGORY_LABELS } from "@/content/articles/constants";
import { PayloadPublicArticleRepository } from "@/content/articles/payload-article-repository";
import {
  toPublicArticleSummary,
  toPublicArticleTranslation,
} from "@/content/articles/payload-article-mapper";
import type {
  PublicArticle,
  PublicArticleCategory,
  PublicArticleSummary,
  PublicArticleTranslation,
} from "@/content/articles/public-types";
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
const payloadArticleRepository = new PayloadPublicArticleRepository();

export const articleQueryService = new ArticleQueryService(articleRepository);

export type PublishedArticlePageData = {
  article: PublicArticle | null;
  translation: PublicArticleTranslation | null;
};

type PublicArticleSource = "payload" | "static";

function getPublicArticleSource(): PublicArticleSource {
  const source = process.env.ARTICLE_PUBLIC_SOURCE;

  if (source === undefined || source === "static") {
    return "static";
  }

  if (source === "payload") {
    if (process.env.NODE_ENV !== "development") {
      throw new Error(
        "ARTICLE_PUBLIC_SOURCE=payload is restricted to local development during this project stage.",
      );
    }

    return "payload";
  }

  throw new Error(
    `Invalid ARTICLE_PUBLIC_SOURCE value "${source}". Expected "static" or "payload".`,
  );
}

function mapStaticCategory(
  article: Article,
): PublicArticleCategory[] {
  if (article.category === null) {
    return [];
  }

  return [
    {
      id: article.category,
      name: ARTICLE_CATEGORY_LABELS[article.category][article.language],
      slug: article.category,
      sortOrder: 0,
    },
  ];
}

function mapStaticArticle(article: Article): PublicArticle {
  if (article.publishedAt === null) {
    throw new Error(
      `Published static article ${article.id} is missing publishedAt.`,
    );
  }

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    language: article.language,
    translationKey: article.translationGroupId,
    summary: article.summary,
    content: {
      source: "static",
      blocks: article.content,
      details: {
        author: article.author,
        faq: article.faq,
        legalNotice: article.legalNotice,
        sources: article.sources,
      },
    },
    categories: mapStaticCategory(article),
    featuredImage:
      article.coverImage === null
        ? null
        : {
            source: "static",
            src: article.coverImage.src,
            alt: article.coverImage.alt,
            caption: article.coverImage.caption,
            width: article.coverImage.width,
            height: article.coverImage.height,
          },
    featured: article.featured,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    seo: {
      title: article.seo.title,
      description: article.seo.description,
      canonical: article.seo.canonical,
      index: article.seo.index,
      follow: article.seo.follow,
      openGraphTitle: article.seo.openGraphTitle,
      openGraphDescription: article.seo.openGraphDescription,
      openGraphImage: article.seo.openGraphImage,
    },
  };
}

async function getStaticPublishedArticlePageData(
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

  const translation =
    await payloadArticleRepository.findPublishedTranslation(
      article.id,
      language === "tr" ? "en" : "tr",
    );

  return {
    article,
    translation:
      translation === null
        ? null
        : toPublicArticleTranslation(translation),
  };
}

export const getPublishedArticlePageData = cache(
  async (
    slug: string,
    language: ArticleLanguage,
  ): Promise<PublishedArticlePageData> =>
    getPublicArticleSource() === "payload"
      ? getPayloadPublishedArticlePageData(slug, language)
      : getStaticPublishedArticlePageData(slug, language),
);

async function getAllStaticPublishedArticles(
  language: ArticleLanguage,
): Promise<PublicArticleSummary[]> {
  const articles: PublicArticleSummary[] = [];
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

    articles.push(
      ...result.items.map((article) =>
        toPublicArticleSummary(mapStaticArticle(article)),
      ),
    );
    totalPages = result.totalPages;
    page += 1;
  }

  return articles;
}

export async function getAllPublishedArticles(
  language: ArticleLanguage,
): Promise<PublicArticleSummary[]> {
  return getPublicArticleSource() === "payload"
    ? payloadArticleRepository.listPublished(language)
    : getAllStaticPublishedArticles(language);
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
