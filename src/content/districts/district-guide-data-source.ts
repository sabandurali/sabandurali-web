import "server-only";
import { cache } from "react";
import { readPublicSource } from "@/content/public-source";
import type { DistrictGuide } from "./district-guide-projection";
import { PayloadPublicDistrictGuideRepository } from "./payload-district-guide-repository";
export type { DistrictGuide } from "./district-guide-projection";

const repository = new PayloadPublicDistrictGuideRepository();

// District guides follow the page source (docs/PROJECT-STATE.md).
function isPayloadSource(): boolean {
  return readPublicSource("PAGE_PUBLIC_SOURCE") === "payload";
}

export const getDistrictGuide = cache(
  async (district: string): Promise<DistrictGuide | null> =>
    isPayloadSource() ? repository.findPublished(district) : null,
);

/**
 * Every published guide, projected for the public, in one query (the
 * sitemap used to send 39 separate queries). Districts without a published
 * guide are absent from the map.
 */
export const getPublishedDistrictGuides = cache(
  async (): Promise<Map<string, DistrictGuide>> =>
    isPayloadSource() ? repository.listPublished() : new Map(),
);

/**
 * Public summaries of every published guide in one query (the directory
 * page used to send 39 separate queries). Districts without a public
 * summary are absent from the map.
 */
export const getDistrictGuideSummaries = cache(
  async (): Promise<Map<string, string>> =>
    isPayloadSource() ? repository.listSummaries() : new Map(),
);
