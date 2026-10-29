import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { PublicBookReviewSummary } from "@/content/books/public-types";
import { refuseDegradedCachedRender } from "@/content/degraded-render";
import type { PublicPhoto } from "@/content/photos/types";
import { settleSection } from "@/content/settle-section";
import type { SiteLocale } from "@/lib/metadata";

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
