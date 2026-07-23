import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { mapPayloadPage } from "@/content/pages/payload-page-mapper";
import type {
  PublicPage,
  PublicPageLanguage,
} from "@/content/pages/public-types";

const PAYLOAD_PAGE_SIZE = 100;

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
    language: PublicPageLanguage,
    now: Date = new Date(),
  ): Promise<PublicPage | null> {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "pages",
      depth: 1,
      draft: false,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      where: {
        and: [
          ...createPublicConditions(now),
          { language: { equals: language } },
          ...conditions,
        ],
      },
    });
    const document = result.docs[0];

    return document === undefined
      ? null
      : mapPayloadPage(document, language, now);
  }

  async findHome(
    language: PublicPageLanguage,
  ): Promise<PublicPage | null> {
    return this.findOne(
      [{ pageType: { equals: "home" } }],
      language,
    );
  }

  async findStandardBySlug(
    slug: string,
    language: PublicPageLanguage,
  ): Promise<PublicPage | null> {
    return this.findOne(
      [
        { pageType: { equals: "standard" } },
        { slug: { equals: slug } },
      ],
      language,
    );
  }

  async listStandards(
    language: PublicPageLanguage,
  ): Promise<PublicPage[]> {
    const payload = await getPayload({ config });
    const now = new Date();
    const pages: PublicPage[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const result = await payload.find({
        collection: "pages",
        depth: 1,
        draft: false,
        limit: PAYLOAD_PAGE_SIZE,
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

      for (const document of result.docs) {
        const mapped = mapPayloadPage(document, language, now);
        if (mapped !== null) pages.push(mapped);
      }

      totalPages = result.totalPages;
      page += 1;
    }

    return pages;
  }
}
