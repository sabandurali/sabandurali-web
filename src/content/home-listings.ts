import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { PublicBookReviewSummary } from "@/content/books/public-types";
import { refuseDegradedCachedRender } from "@/content/degraded-render";
import type { PublicPhoto } from "@/content/photos/types";
import { settleSection } from "@/content/settle-section";
import type { SiteLocale } from "@/content/locales";

/**
 * The home page's main content is the home record (static or CMS). The
 * latest articles, book reviews, photos and the district guide summaries
 * behind the atlas are supporting lists from other collections: like the
 * district page's sections, a failing query empties only its own list, is
 * logged, and the list says "temporarily unavailable" instead of "nothing
 * published". The home routes are ISR, so a production server keeps the
 * previous render instead of caching the degraded one
 * (src/content/degraded-render.ts).
 */
export type HomeListingName = "articles" | "books" | "photos" | "districts";

export type HomeListings = {
  articles: PublicArticleSummary[];
  books: PublicBookReviewSummary[];
  photos: PublicPhoto[];
  /** District slug → public guide summary. */
  districts: Map<string, string>;
};

export type HomeListingLoaders = {
  [K in HomeListingName]: () => Promise<HomeListings[K]>;
};

const LISTING_ORDER: ReadonlyArray<HomeListingName> = [
  "articles",
  "books",
  "photos",
  "districts",
];

export async function loadHomeListings(
  locale: SiteLocale,
  loaders: HomeListingLoaders,
  env?: Readonly<Record<string, string | undefined>>,
): Promise<{ listings: HomeListings; unavailable: HomeListingName[] }> {
  const unavailable = new Set<HomeListingName>();
  const common = { scope: "home", id: locale, unavailable } as const;
  const [articles, books, photos, districts] = await Promise.all([
    settleSection({
      ...common,
      name: "articles",
      load: loaders.articles,
      fallback: [],
    }),
    settleSection({
      ...common,
      name: "books",
      load: loaders.books,
      fallback: [],
    }),
    settleSection({
      ...common,
      name: "photos",
      load: loaders.photos,
      fallback: [],
    }),
    settleSection({
      ...common,
      name: "districts",
      load: loaders.districts,
      fallback: new Map<string, string>(),
    }),
  ]);
  const failed = LISTING_ORDER.filter((name) => unavailable.has(name));
  refuseDegradedCachedRender(`home ${locale}`, failed, env);

  return {
    listings: { articles, books, photos, districts },
    unavailable: failed,
  };
}

/** Shown instead of a list whose query failed (not "nothing published"). */
export const homeListingUnavailableCopy: Record<
  SiteLocale,
  Record<HomeListingName, string>
> = {
  tr: {
    articles:
      "Makaleler geçici olarak yüklenemedi. Sayfayı biraz sonra yeniden açın.",
    books:
      "Kitap incelemeleri geçici olarak yüklenemedi. Sayfayı biraz sonra yeniden açın.",
    photos:
      "Fotoğraflar geçici olarak yüklenemedi. Sayfayı biraz sonra yeniden açın.",
    districts:
      "Öne çıkan ilçe rehberi geçici olarak yüklenemedi. Sayfayı biraz sonra yeniden açın.",
  },
  en: {
    articles:
      "Articles could not be loaded right now. Please reopen the page shortly.",
    books:
      "Book reviews could not be loaded right now. Please reopen the page shortly.",
    photos:
      "Photographs could not be loaded right now. Please reopen the page shortly.",
    districts:
      "The featured district guide could not be loaded right now. Please reopen the page shortly.",
  },
};

/** The "latest" lists shown as their own numbered home section. */
export type HomeListingSectionName = Exclude<HomeListingName, "districts">;

const LISTING_SECTION_ORDER: ReadonlyArray<HomeListingSectionName> = [
  "articles",
  "books",
  "photos",
];

export type HomeSectionPlan = {
  /** Listing sections to render, in page order. */
  listings: HomeListingSectionName[];
  /**
   * Two-digit section numbers; the atlas is always "01". A hidden list has
   * no number (null).
   */
  numbers: Record<HomeListingSectionName, string | null> & {
    atlas: string;
    workspaces: string;
  };
  /**
   * Ground of each list: the shown lists alternate paper and band after
   * the atlas band, so two neighbours never share a ground.
   */
  tones: Record<HomeListingSectionName, "paper" | "band">;
};

function sectionNumber(position: number): string {
  return String(position).padStart(2, "0");
}

/**
 * Which "latest" sections the home page renders and how they are numbered
 * (UX-04). A list with nothing published is left out instead of filling a
 * full-width band with "nothing yet"; it returns by itself once content is
 * published. A list whose query failed stays visible with its "temporarily
 * unavailable" message, because a failed read is not an empty one. The
 * numbers follow the sections actually shown, so they never skip.
 */
export function planHomeSections(
  counts: Readonly<Record<HomeListingSectionName, number>>,
  unavailable: readonly HomeListingName[],
): HomeSectionPlan {
  const listings = LISTING_SECTION_ORDER.filter(
    (name) => counts[name] > 0 || unavailable.includes(name),
  );
  const numberOf = (name: HomeListingSectionName): string | null => {
    const index = listings.indexOf(name);
    return index === -1 ? null : sectionNumber(index + 2);
  };
  const toneOf = (name: HomeListingSectionName): "paper" | "band" =>
    listings.indexOf(name) % 2 === 1 ? "band" : "paper";

  return {
    listings,
    numbers: {
      atlas: sectionNumber(1),
      articles: numberOf("articles"),
      books: numberOf("books"),
      photos: numberOf("photos"),
      workspaces: sectionNumber(listings.length + 2),
    },
    tones: {
      articles: toneOf("articles"),
      books: toneOf("books"),
      photos: toneOf("photos"),
    },
  };
}
