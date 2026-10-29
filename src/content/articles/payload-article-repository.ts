import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { createPublicArticleConditions } from "@/content/articles/article-query-conditions";
import { isOfferedArticleVersion } from "@/content/articles/article-translation";
import { getEnglishRichTextLinkContext } from "@/content/articles/offered-article-links";
import {
  mapPayloadArticle,
  toPublicArticleSummary,
} from "@/content/articles/payload-article-mapper";
import type {
  PublicArticle,
  PublicArticleSummary,
} from "@/content/articles/public-types";
import type { ArticleLanguage } from "@/content/articles/types";

const PAYLOAD_ARTICLE_PAGE_SIZE = 100;
const PUBLIC_ARTICLE_SORT = ["-publishedAt", "id"];

export class PayloadPublicArticleRepository {
  private async findMany(
    locale: ArticleLanguage,
    conditions: Where[],
    now: Date,
  ): Promise<PublicArticle[]> {
    const payload = await getPayload({ config });
    const articles: PublicArticle[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const result = await payload.find({
        collection: "articles",
        depth: 1,
        draft: false,
        fallbackLocale: false,
        limit: PAYLOAD_ARTICLE_PAGE_SIZE,
        locale,
        overrideAccess: false,
        page,
        sort: PUBLIC_ARTICLE_SORT,
        where: { and: conditions },
      });

      const links =
        locale === "en"
          ? await getEnglishRichTextLinkContext(result.docs)
          : undefined;

      for (const document of result.docs) {
        const article = mapPayloadArticle(document, locale, now, links);
        if (article !== null) articles.push(article);
      }

      totalPages = result.totalPages;
      page += 1;
    }

    return locale === "en"
      ? this.withoutIncompleteTranslations(articles)
      : articles;
  }

  private async findOne(
    locale: ArticleLanguage,
    conditions: Where[],
    now: Date,
  ): Promise<PublicArticle | null> {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "articles",
      depth: 1,
      draft: false,
      fallbackLocale: false,
      limit: 1,
      locale,
      overrideAccess: false,
      pagination: false,
      sort: PUBLIC_ARTICLE_SORT,
      where: { and: conditions },
    });
    const document = result.docs[0];

    if (document === undefined) return null;

    const links =
      locale === "en"
        ? await getEnglishRichTextLinkContext([document])
        : undefined;

    return mapPayloadArticle(document, locale, now, links);
  }

  /**
   * English versions are compared with their Turkish source; one extra
   * query per 100 articles selects only the Turkish rich text.
   */
  private async withoutIncompleteTranslations(
    articles: PublicArticle[],
  ): Promise<PublicArticle[]> {
    if (articles.length === 0) return articles;

    const payload = await getPayload({ config });
    const turkishContent = new Map<string, unknown>();

    for (let start = 0; start < articles.length; start += 100) {
      const ids = articles.slice(start, start + 100).map(({ id }) => id);
      const result = await payload.find({
        collection: "articles",
        depth: 0,
        draft: false,
        fallbackLocale: false,
        limit: ids.length,
        locale: "tr",
        overrideAccess: false,
        pagination: false,
        select: { content: true },
        where: { id: { in: ids } },
      });

      for (const document of result.docs) {
        turkishContent.set(document.id, document.content);
      }
    }

    return articles.filter((article) =>
      isOfferedArticleVersion(article, turkishContent.get(article.id)),
    );
  }

  async listPublished(
    locale: ArticleLanguage,
    now: Date = new Date(),
  ): Promise<PublicArticleSummary[]> {
    const articles = await this.findMany(
      locale,
      createPublicArticleConditions(now, { kind: "standalone" }),
      now,
    );

    return articles.map(toPublicArticleSummary);
  }

  async listByCategory(
    categorySlug: string,
    locale: ArticleLanguage,
    now: Date = new Date(),
  ): Promise<PublicArticleSummary[]> {
    const articles = await this.findMany(
      locale,
      createPublicArticleConditions(now, { kind: "category", categorySlug }),
      now,
    );

    return articles.map(toPublicArticleSummary);
  }

  async listDistrictArticles(
    articleType: "district-research" | "district-news",
    district: string,
    locale: ArticleLanguage,
    now: Date = new Date(),
  ): Promise<PublicArticleSummary[]> {
    const articles = await this.findMany(
      locale,
      createPublicArticleConditions(now, {
        kind: "district",
        articleType,
        district,
      }),
      now,
    );

    return articles.map(toPublicArticleSummary);
  }

  async findPublishedBySlug(
    slug: string,
    locale: ArticleLanguage,
    now: Date = new Date(),
  ): Promise<PublicArticle | null> {
    return this.findOne(
      locale,
      [
        ...createPublicArticleConditions(now, { kind: "standalone" }),
        { slug: { equals: slug } },
      ],
      now,
    );
  }

  async findPublishedTranslation(
    documentID: string,
    locale: ArticleLanguage,
    now: Date = new Date(),
  ): Promise<PublicArticle | null> {
    return this.findOne(
      locale,
      [
        ...createPublicArticleConditions(now, { kind: "standalone" }),
        { id: { equals: documentID } },
      ],
      now,
    );
  }
}
