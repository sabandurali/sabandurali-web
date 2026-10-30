import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { collectMappedPages } from "@/content/shared/pagination";
import { getEnglishRichTextLinkContext } from "@/content/rich-text/offered-article-links";
import { LEGACY_TURKISH_HOME_SLUG } from "@/content/pages/legacy-home";
import { mapPayloadPage } from "@/content/pages/payload-page-mapper";
import type { SiteLocale } from "@/content/locales";
import type { PublicPage } from "@/content/pages/public-types";

const PAYLOAD_PAGE_SIZE = 100;
const PUBLIC_PAGE_SORT = ["-publishedAt", "-updatedAt", "id"];

function createPublicConditions(now: Date): Where[] {
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

export class PayloadPublicPageRepository {
  private async findOne(
    conditions: Where[],
    language: SiteLocale,
    now: Date = new Date(),
  ): Promise<PublicPage | null> {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "pages",
      depth: 1,
      draft: false,
      fallbackLocale: false,
      limit: 1,
      locale: language,
      overrideAccess: false,
      pagination: false,
      sort: PUBLIC_PAGE_SORT,
      where: {
        and: [
          ...createPublicConditions(now),
          { language: { equals: language } },
          ...conditions,
        ],
      },
    });
    const document = result.docs[0];

    if (document === undefined) return null;

    const links =
      language === "en"
        ? await getEnglishRichTextLinkContext([document])
        : undefined;

    return mapPayloadPage(document, language, now, links);
  }

  async findHome(language: SiteLocale): Promise<PublicPage | null> {
    const home = await this.findOne(
      [{ pageType: { equals: "home" } }],
      language,
    );

    if (home !== null || language !== "tr") return home;

    const legacyHome = await this.findOne(
      [
        { pageType: { equals: "standard" } },
        { slug: { equals: LEGACY_TURKISH_HOME_SLUG } },
      ],
      language,
    );

    return legacyHome === null ? null : { ...legacyHome, pageType: "home" };
  }

  async findStandardBySlug(
    slug: string,
    language: SiteLocale,
  ): Promise<PublicPage | null> {
    return this.findOne(
      [{ pageType: { equals: "standard" } }, { slug: { equals: slug } }],
      language,
    );
  }

  async listStandards(language: SiteLocale): Promise<PublicPage[]> {
    const payload = await getPayload({ config });
    const now = new Date();

    return collectMappedPages(async (page) => {
      const result = await payload.find({
        collection: "pages",
        depth: 1,
        draft: false,
        fallbackLocale: false,
        limit: PAYLOAD_PAGE_SIZE,
        locale: language,
        overrideAccess: false,
        page,
        sort: "title",
        where: {
          and: [
            ...createPublicConditions(now),
            { language: { equals: language } },
            { pageType: { equals: "standard" } },
          ],
        },
      });

      const links =
        language === "en"
          ? await getEnglishRichTextLinkContext(result.docs)
          : undefined;

      return {
        items: result.docs.flatMap((document): PublicPage[] => {
          const mapped = mapPayloadPage(document, language, now, links);
          return mapped === null ? [] : [mapped];
        }),
        totalPages: result.totalPages,
      };
    });
  }
}
