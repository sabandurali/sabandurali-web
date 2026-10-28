import "server-only";
import { cache } from "react";
import {
  getDistrictNews,
  getDistrictResearch,
} from "@/content/articles/article-data-source";
import {
  getDistrictGuide,
  type DistrictGuide,
} from "@/content/districts/district-guide-data-source";
import {
  settleDistrictSections,
  type DistrictSectionName,
  type DistrictSections,
} from "@/content/districts/district-sections";
import { getDistrictPhotos } from "@/content/photos/photo-data-source";

export type DistrictPageData = DistrictSections & {
  guide: DistrictGuide | null;
  /** Supporting sections whose query failed; render "temporarily unavailable". */
  unavailableSections: DistrictSectionName[];
};

/**
 * Everything a district page shows, with per-section failure isolation:
 * the guide query is fail-closed (an error reaches the error boundary),
 * photos, research and news fall back to an unavailable empty section.
 */
export const getDistrictPageData = cache(
  async (district: string): Promise<DistrictPageData> => {
    const [guide, settled] = await Promise.all([
      getDistrictGuide(district),
      settleDistrictSections(district, {
        photos: () => getDistrictPhotos(district, "tr"),
        research: () => getDistrictResearch(district, "tr"),
        news: () => getDistrictNews(district, "tr"),
      }),
    ]);

    return {
      guide,
      ...settled.sections,
      unavailableSections: settled.unavailableSections,
    };
  },
);
