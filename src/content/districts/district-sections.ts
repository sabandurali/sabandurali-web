import type { PublicArticleSummary } from "@/content/articles/public-types";
import { refuseDegradedCachedRender } from "@/content/degraded-render";
import type { PublicPhoto } from "@/content/photos/types";
import { settleSection } from "@/content/settle-section";

/**
 * District pages combine the guide (their main content) with photos,
 * research and news from other collections. A failing query for one of
 * those supporting sections must not take the whole district page down:
 * the section renders empty, is reported as unavailable (so the page can
 * say "temporarily unavailable" instead of "nothing published") and the
 * error is logged. The guide query itself stays fail-closed.
 *
 * The district route is ISR: `loadDistrictSectionsForCache` refuses to let
 * such a degraded render replace the cached page on a production server
 * (see src/content/degraded-render.ts), so a one-second outage does not
 * hide photos, research or news for an hour.
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

export async function settleDistrictSections(
  district: string,
  loaders: DistrictSectionLoaders,
): Promise<{
  sections: DistrictSections;
  unavailableSections: DistrictSectionName[];
}> {
  const unavailable = new Set<DistrictSectionName>();
  const common = { scope: "districts", id: district, unavailable } as const;
  const [photos, research, news] = await Promise.all([
    settleSection({
      ...common,
      name: "photos",
      load: loaders.photos,
      fallback: [],
    }),
    settleSection({
      ...common,
      name: "research",
      load: loaders.research,
      fallback: [],
    }),
    settleSection({
      ...common,
      name: "news",
      load: loaders.news,
      fallback: [],
    }),
  ]);

  return {
    sections: { photos, research, news },
    unavailableSections: SECTION_ORDER.filter((name) => unavailable.has(name)),
  };
}

/** `settleDistrictSections` for the ISR district route. */
export async function loadDistrictSectionsForCache(
  district: string,
  loaders: DistrictSectionLoaders,
  env?: Readonly<Record<string, string | undefined>>,
): ReturnType<typeof settleDistrictSections> {
  const settled = await settleDistrictSections(district, loaders);
  refuseDegradedCachedRender(
    `district ${district}`,
    settled.unavailableSections,
    env,
  );
  return settled;
}
