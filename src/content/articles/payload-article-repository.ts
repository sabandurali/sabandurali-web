import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { createPublicArticleConditions } from "@/content/articles/article-query-conditions";
import { isOfferedArticleContent } from "@/content/articles/article-translation";
import { getEnglishRichTextLinkContext } from "@/content/rich-text/offered-article-links";
import {
  mapPayloadArticle,
  mapPayloadArticleSummary,
} from "@/content/articles/payload-article-mapper";
import type {
  PublicArticle,
  PublicArticleSummary,
} from "@/content/articles/public-types";
import type { ArticleLanguage } from "@/content/articles/types";

const PAYLOAD_ARTICLE_PAGE_SIZE = 100;
const PUBLIC_ARTICLE_SORT = ["-publishedAt", "id"];

/** District news has no body by design; every other article needs one. */
const HAS_BODY: Where = {
  or: [
    { articleType: { equals: "district-news" } },
    { content: { exists: true } },
  ],
};

export class PayloadPublicArticleRepository {
  /**
   * List reads: every field but the rich text, which lists never show. The
   * mapper cannot check the body then, so the query requires it to exist
   * (publishing requires it to be meaningful). `limit` reads only the
   * newest matches instead of every page.
   */
  private async findSummaries(
    locale: ArticleLanguage,
    conditions: Where[],
    now: Date,
    limit?: number,
  ): Promise<PublicArticleSummary[]> {
    const payload = await getPayload({ config });
    const articles: PublicArticleSummary[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const result = await payload.find({
        collection: "articles",
        depth: 1,
        draft: false,
        fallbackLocale: false,
        limit: limit ?? PAYLOAD_ARTICLE_PAGE_SIZE,
        locale,
        overrideAccess: false,
        page,
        select: { content: false },
        sort: PUBLIC_ARTICLE_SORT,
        where: { and: [...conditions, HAS_BODY] },
      });

      for (const document of result.docs) {
        const article = mapPayloadArticleSummary(document, locale, now);
        if (article !== null) articles.push(article);
      }

      totalPages = limit === undefined ? result.totalPages : 1;
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

  /** Rich text of `ids` in `locale`, unpopulated (depth 0). */
  private async readContent(
    ids: string[],
    locale: ArticleLanguage,
  ): Promise<Map<string, unknown>> {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "articles",
      depth: 0,
      draft: false,
      fallbackLocale: false,
      limit: ids.length,
      locale,
      overrideAccess: false,
      pagination: false,
      select: { content: true },
      where: { id: { in: ids } },
    });

    return new Map(
      result.docs.map((document) => [document.id, document.content]),
    );
  }

  /**
   * English versions are compared with their Turkish source; two extra
   * queries per 100 articles read only the English and Turkish rich text,
   * without populating links or uploads.
   */
  private async withoutIncompleteTranslations(
    articles: PublicArticleSummary[],
  ): Promise<PublicArticleSummary[]> {
    const offered: PublicArticleSummary[] = [];

    for (let start = 0; start < articles.length; start += 100) {
      const batch = articles.slice(start, start + 100);
      const ids = batch.map(({ id }) => id);
      const [english, turkish] = await Promise.all([
        this.readContent(ids, "en"),
        this.readContent(ids, "tr"),
      ]);

      for (const article of batch) {
        if (
          isOfferedArticleContent(
            article,
            english.get(article.id),
            turkish.get(article.id),
          )
        ) {
          offered.push(article);
        }
      }
    }

    return offered;
  }

  async listPublished(
    locale: ArticleLanguage,
    now: Date = new Date(),
  ): Promise<PublicArticleSummary[]> {
    return this.findSummaries(
      locale,
      createPublicArticleConditions(now, { kind: "standalone" }),
      now,
    );
  }

  async listByCategory(
    categorySlug: string,
    locale: ArticleLanguage,
    now: Date = new Date(),
  ): Promise<PublicArticleSummary[]> {
    return this.findSummaries(
      locale,
      createPublicArticleConditions(now, { kind: "category", categorySlug }),
      now,
    );
  }

  async listDistrictArticles(
    articleType: "district-research" | "district-news",
    district: string,
    locale: ArticleLanguage,
    now: Date = new Date(),
    limit?: number,
  ): Promise<PublicArticleSummary[]> {
    return this.findSummaries(
      locale,
      createPublicArticleConditions(now, {
        kind: "district",
        articleType,
        district,
      }),
      now,
      limit,
    );
  }

  /** Every public district news item (all districts), for the sitemap. */
  async listAllDistrictNews(
    locale: ArticleLanguage,
    now: Date = new Date(),
  ): Promise<PublicArticleSummary[]> {
    return this.findSummaries(
      locale,
      createPublicArticleConditions(now, { kind: "all-district-news" }),
      now,
    );
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
