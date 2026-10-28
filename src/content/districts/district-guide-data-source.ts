import "server-only";
import { cache } from "react";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { readPublicSource } from "@/content/public-source";
import {
  projectPublishedDistrictGuide,
  type DistrictGuide,
} from "./district-guide-projection";
export type { DistrictGuide } from "./district-guide-projection";

function publishedGuideConditions(now: Date): Where[] {
  return [
    { _status: { equals: "published" } },
    { publishedAt: { less_than_equal: now.toISOString() } },
  ];
}

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
      where: {
        and: [
          ...publishedGuideConditions(now),
          { district: { equals: district } },
        ],
      },
    });
    return result.docs[0] === undefined
      ? null
      : projectPublishedDistrictGuide(result.docs[0], now.getTime());
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
      where: { and: publishedGuideConditions(now) },
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
