import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import {
  mapPayloadArticle,
  toPublicArticleSummary,
} from "@/content/articles/payload-article-mapper";
import type {
  PublicArticle,
  PublicArticleSummary,
} from "@/content/articles/public-types";
import { MAX_ARTICLE_PAGE_SIZE } from "@/content/articles/repository/types";
import type { ArticleLanguage } from "@/content/articles/types";

function createPublishedConditions(now: Date): Where[] {
  return [
    {
      _status: {
        equals: "published",
      },
    },
    {
      publishedAt: {
        less_than_equal: now.toISOString(),
      },
    },
  ];
}

export class PayloadPublicArticleRepository {
  async listPublished(
    locale: ArticleLanguage,
  ): Promise<PublicArticleSummary[]> {
    const payload = await getPayload({ config });
    const now = new Date();
    const articles: PublicArticleSummary[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const result = await payload.find({
        collection: "articles",
        depth: 1,
        draft: false,
        fallbackLocale: false,
        limit: MAX_ARTICLE_PAGE_SIZE,
        locale,
        overrideAccess: false,
        page,
        sort: "-publishedAt",
        where: {
          and: createPublishedConditions(now),
        },
      });

      for (const document of result.docs) {
        const article = mapPayloadArticle(document, locale, now);

        if (article !== null) {
          articles.push(toPublicArticleSummary(article));
        }
      }

      totalPages = result.totalPages;
      page += 1;
    }

    return articles;
  }

  async findPublishedBySlug(
    slug: string,
    locale: ArticleLanguage,
  ): Promise<PublicArticle | null> {
    const payload = await getPayload({ config });
    const now = new Date();
    const result = await payload.find({
      collection: "articles",
      depth: 1,
      draft: false,
      fallbackLocale: false,
      limit: 1,
      locale,
      overrideAccess: false,
      pagination: false,
      sort: "-publishedAt",
      where: {
        and: [
          ...createPublishedConditions(now),
          {
            slug: {
              equals: slug,
            },
          },
        ],
      },
    });
    const document = result.docs[0];

    return document === undefined
      ? null
      : mapPayloadArticle(document, locale, now);
  }

  async findPublishedTranslation(
    documentID: string,
    locale: ArticleLanguage,
  ): Promise<PublicArticle | null> {
    const payload = await getPayload({ config });
    const now = new Date();
    const result = await payload.find({
      collection: "articles",
      depth: 1,
      draft: false,
      fallbackLocale: false,
      limit: 1,
      locale,
      overrideAccess: false,
      pagination: false,
      sort: "-publishedAt",
      where: {
        and: [
          ...createPublishedConditions(now),
          {
            id: {
              equals: documentID,
            },
          },
        ],
      },
    });
    const document = result.docs[0];

    return document === undefined
      ? null
      : mapPayloadArticle(document, locale, now);
  }
}
