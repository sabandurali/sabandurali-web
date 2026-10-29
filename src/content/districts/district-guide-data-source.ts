import "server-only";
import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import { readPublicSource } from "@/content/public-source";
import {
  projectPublishedDistrictGuide,
  type DistrictGuide,
} from "./district-guide-projection";
import {
  DISTRICT_GUIDE_SORT,
  publishedDistrictGuidesWhere,
} from "./district-guide-queries";
export type { DistrictGuide } from "./district-guide-projection";

// District guides follow the page source (docs/PROJECT-STATE.md).
function isPayloadSource(): boolean {
  return readPublicSource("PAGE_PUBLIC_SOURCE") === "payload";
}

export const getDistrictGuide = cache(
  async (district: string): Promise<DistrictGuide | null> => {
    if (!isPayloadSource()) return null;
    const payload = await getPayload({ config });
    const now = new Date();
    const result = await payload.find({
      collection: "district-guides",
      depth: 0,
      draft: false,
      locale: "tr",
      fallbackLocale: false,
      limit: 1,
      pagination: false,
      overrideAccess: false,
      where: publishedDistrictGuidesWhere(now, district),
    });
    return result.docs[0] === undefined
      ? null
      : projectPublishedDistrictGuide(result.docs[0], now.getTime());
  },
);

/**
 * Every published guide, projected for the public, in one query (the
 * sitemap used to send 39 separate queries). Districts without a published
 * guide are absent from the map.
 */
export const getPublishedDistrictGuides = cache(
  async (): Promise<Map<string, DistrictGuide>> => {
    const guides = new Map<string, DistrictGuide>();
    if (!isPayloadSource()) return guides;

    const payload = await getPayload({ config });
    const now = new Date();
    const result = await payload.find({
      collection: "district-guides",
      depth: 0,
      draft: false,
      locale: "tr",
      fallbackLocale: false,
      pagination: false,
      overrideAccess: false,
      sort: DISTRICT_GUIDE_SORT,
      where: publishedDistrictGuidesWhere(now),
    });

    for (const document of result.docs) {
      const guide = projectPublishedDistrictGuide(document, now.getTime());
      if (typeof document.district === "string" && guide !== null) {
        guides.set(document.district, guide);
      }
    }

    return guides;
  },
);

/**
 * Public summaries of every published guide in one query (the directory
 * page used to send 39 separate queries). Only the fields the summary
 * projection needs are selected. Districts without a public summary are
 * absent from the map.
 */
export const getDistrictGuideSummaries = cache(
  async (): Promise<Map<string, string>> => {
    const summaries = new Map<string, string>();
    if (!isPayloadSource()) return summaries;

    const payload = await getPayload({ config });
    const now = new Date();
    const result = await payload.find({
      collection: "district-guides",
      depth: 0,
      draft: false,
      locale: "tr",
      fallbackLocale: false,
      pagination: false,
      overrideAccess: false,
      select: {
        district: true,
        summary: true,
        reviewedSections: true,
        sources: true,
        publishedAt: true,
        _status: true,
      },
      sort: DISTRICT_GUIDE_SORT,
      where: publishedDistrictGuidesWhere(now),
    });

    for (const document of result.docs) {
      const summary = projectPublishedDistrictGuide(
        document,
        now.getTime(),
      )?.summary;
      if (typeof document.district === "string" && summary) {
        summaries.set(document.district, summary);
      }
    }

    return summaries;
  },
);
