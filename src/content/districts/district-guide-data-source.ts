import "server-only";
import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import { assertProductionPayloadInfrastructure } from "@/lib/payloadInfrastructure";

import {
  mapDistrictGuide,
  type DistrictGuide,
} from "./district-guide-projection";
export type { DistrictGuide } from "./district-guide-projection";

export const getDistrictGuides = cache(
  async (): Promise<Map<string, DistrictGuide>> => {
    if (process.env.PAGE_PUBLIC_SOURCE !== "payload") return new Map();
    assertProductionPayloadInfrastructure();
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "district-guides",
      depth: 0,
      draft: false,
      locale: "tr",
      fallbackLocale: false,
      limit: 39,
      pagination: false,
      overrideAccess: false,
      where: {
        and: [
          { _status: { equals: "published" } },
          { publishedAt: { less_than_equal: new Date().toISOString() } },
        ],
      },
    });
    return new Map(
      result.docs.flatMap((doc) => {
        const guide = mapDistrictGuide(doc);
        return guide ? [[doc.district, guide] as const] : [];
      }),
    );
  },
);
export const getDistrictGuide = cache(
  async (district: string): Promise<DistrictGuide | null> =>
    (await getDistrictGuides()).get(district) ?? null,
);
