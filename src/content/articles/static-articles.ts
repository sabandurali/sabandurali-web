import { ARTICLE_CATEGORY_LABELS } from "@/content/articles/constants";
import type {
  PublicArticle,
  PublicArticleCategory,
} from "@/content/articles/public-types";
import type { Article, ArticleLanguage } from "@/content/articles/types";

/**
 * Static (repository fixture) articles. They are only served when
 * ARTICLE_PUBLIC_SOURCE is unset or "static"; production builds receive an
 * empty fixture list from the data source.
 */
export function isPubliclyPublishedStaticArticle(
  article: Article,
  now: Date,
): boolean {
  if (
    article.status !== "published" ||
    article.visibility !== "public" ||
    article.publishedAt === null
  ) {
    return false;
  }

  const publishedAt = Date.parse(article.publishedAt);
  return Number.isFinite(publishedAt) && publishedAt <= now.getTime();
}

function compareNewestFirst(left: Article, right: Article): number {
  const leftTime = Date.parse(left.publishedAt ?? "");
  const rightTime = Date.parse(right.publishedAt ?? "");
  const byDate =
    (Number.isFinite(rightTime) ? rightTime : 0) -
    (Number.isFinite(leftTime) ? leftTime : 0);

  return byDate || left.id.localeCompare(right.id);
}

export function listStaticPublishedArticles(
  articles: ReadonlyArray<Article>,
  language: ArticleLanguage,
  now: Date,
): Article[] {
  return articles
    .filter(
      (article) =>
        article.language === language &&
        isPubliclyPublishedStaticArticle(article, now),
    )
    .toSorted(compareNewestFirst);
}

export function findStaticPublishedArticle(
  articles: ReadonlyArray<Article>,
  slug: string,
  language: ArticleLanguage,
  now: Date,
): Article | null {
  return (
    listStaticPublishedArticles(articles, language, now).find(
      (article) => article.slug === slug,
    ) ?? null
  );
}

export function findStaticArticleTranslation(
  articles: ReadonlyArray<Article>,
  article: Article,
  targetLanguage: ArticleLanguage,
  now: Date,
): Article | null {
  if (article.translationGroupId === null) return null;

  return (
    listStaticPublishedArticles(articles, targetLanguage, now).find(
      (candidate) =>
        candidate.id !== article.id &&
        candidate.translationGroupId === article.translationGroupId,
    ) ?? null
  );
}

function mapStaticCategory(article: Article): PublicArticleCategory[] {
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

export function mapStaticArticle(article: Article): PublicArticle {
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
    articleType: "article",
    district: null,
    districtNeighborhood: null,
    newsCategory: null,
    externalSource: null,
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
