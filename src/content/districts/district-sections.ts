import type { PublicArticleSummary } from "@/content/articles/public-types";
import { describeError, reportContentIssue } from "@/content/content-log";
import type { PublicPhoto } from "@/content/photos/types";

/**
 * District pages combine the guide (their main content) with photos,
 * research and news from other collections. A failing query for one of
 * those supporting sections must not take the whole district page down:
 * the section renders empty, is reported as unavailable (so the page can
 * say "temporarily unavailable" instead of "nothing published") and the
 * error is logged. The guide query itself stays fail-closed.
 */
export type DistrictSectionName = "photos" | "research" | "news";

export type DistrictSections = {
  photos: PublicPhoto[];
  research: PublicArticleSummary[];
  news: PublicArticleSummary[];
};

export type DistrictSectionLoaders = {
  [K in DistrictSectionName]: () => Promise<DistrictSections[K]>;
};

const SECTION_ORDER: ReadonlyArray<DistrictSectionName> = [
  "photos",
  "research",
  "news",
];

async function settle<T>(
  district: string,
  name: DistrictSectionName,
  load: () => Promise<T[]>,
  unavailable: Set<DistrictSectionName>,
): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    unavailable.add(name);
    reportContentIssue(
      {
        scope: "districts",
        id: district,
        reason: `${name} could not be loaded; the section is shown as unavailable`,
        detail: describeError(error),
      },
      "error",
    );
    return [];
  }
}

export async function settleDistrictSections(
  district: string,
  loaders: DistrictSectionLoaders,
): Promise<{
  sections: DistrictSections;
  unavailableSections: DistrictSectionName[];
}> {
  const unavailable = new Set<DistrictSectionName>();
  const [photos, research, news] = await Promise.all([
    settle(district, "photos", loaders.photos, unavailable),
    settle(district, "research", loaders.research, unavailable),
    settle(district, "news", loaders.news, unavailable),
  ]);

  return {
    sections: { photos, research, news },
    unavailableSections: SECTION_ORDER.filter((name) => unavailable.has(name)),
  };
}
