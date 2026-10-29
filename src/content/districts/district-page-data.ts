import "server-only";
import { cache } from "react";
import {
  getDistrictResearch,
  getLatestDistrictNews,
} from "@/content/articles/article-data-source";
import {
  getDistrictGuide,
  type DistrictGuide,
} from "@/content/districts/district-guide-data-source";
import {
  loadDistrictSectionsForCache,
  type DistrictSectionName,
  type DistrictSections,
} from "@/content/districts/district-sections";
import { getDistrictPhotos } from "@/content/photos/photo-data-source";

/**
 * News items the district page shows (`DistrictGuideArticle`); the full list
 * is on the paginated news page.
 */
export const DISTRICT_PAGE_NEWS_LIMIT = 3;

export type DistrictPageData = DistrictSections & {
  guide: DistrictGuide | null;
  /** Supporting sections whose query failed; render "temporarily unavailable". */
  unavailableSections: DistrictSectionName[];
};

/**
 * Everything a district page shows, with per-section failure isolation:
 * the guide query is fail-closed (an error reaches the error boundary),
 * photos, research and news fall back to an unavailable empty section,
 * which a production server never writes over the cached page.
 */
export const getDistrictPageData = cache(
  async (district: string): Promise<DistrictPageData> => {
    const [guide, settled] = await Promise.all([
      getDistrictGuide(district),
      loadDistrictSectionsForCache(district, {
        photos: () => getDistrictPhotos(district, "tr"),
        research: () => getDistrictResearch(district, "tr"),
        news: () =>
          getLatestDistrictNews(district, "tr", DISTRICT_PAGE_NEWS_LIMIT),
      }),
    ]);

    return {
      guide,
      ...settled.sections,
      unavailableSections: settled.unavailableSections,
    };
  },
);
