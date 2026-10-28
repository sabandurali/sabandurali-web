import "server-only";
import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import { readPublicSource } from "@/content/public-source";
import {
  projectPublishedDistrictGuide,
  type DistrictGuide,
} from "./district-guide-projection";
export type { DistrictGuide } from "./district-guide-projection";

export const getDistrictGuide = cache(
  async (district: string): Promise<DistrictGuide | null> => {
    // District guides follow the page source (docs/PROJECT-STATE.md).
    if (readPublicSource("PAGE_PUBLIC_SOURCE") !== "payload") return null;
    const payload = await getPayload({ config });
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
          { _status: { equals: "published" } },
          { district: { equals: district } },
          { publishedAt: { less_than_equal: new Date().toISOString() } },
        ],
      },
    });
    return result.docs[0] === undefined
      ? null
      : projectPublishedDistrictGuide(result.docs[0]);
  },
);
