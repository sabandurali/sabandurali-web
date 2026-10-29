/**
 * Pure builders for `src/app/sitemap.ts`.
 *
 * The route loads the content (each source on its own, so one failing source
 * does not drop the whole sitemap) and passes it to `buildSitemap`. Rules:
 *
 * - Only indexable, self-canonical URLs are listed: CMS pages and reviews with
 *   `seo.index: false`, articles whose canonical points elsewhere, district
 *   pages without an indexable guide, district news lists without news,
 *   placeholder pages and workspace sections without published content stay
 *   out. Paginated news pages (`?sayfa=2`, …) are reached from page 1.
 * - hreflang alternates come from `createLanguageAlternates`, the helper the
 *   page metadata uses, and pair only URLs that are themselves listed.
 * - `lastModified` is a real content date (the item, the newest listed item of
 *   a list page or the guide). Pages without one omit it instead of claiming
 *   "now" on every request.
 * - Every URL appears once; image URLs are absolute.
 */
import type { MetadataRoute } from "next";
import { contactPaths, privacyPaths } from "@/config/site";
import { describeError, reportContentIssue } from "@/content/content-log";
import {
  articleListPaths,
  getArticlePath,
} from "@/content/articles/article-routes";
import { isArticleHreflangEligible } from "@/content/articles/article-seo";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { bookListPaths, getBookReviewPath } from "@/content/books/book-routes";
import { isBookReviewHreflangEligible } from "@/content/books/book-seo";
import type { PublicBookReview } from "@/content/books/public-types";
import type { DistrictGuide } from "@/content/districts/district-guide-projection";
import { districts } from "@/content/districts/district-registry";
import {
  districtGuidePath,
  getDistrictNewsPath,
  getDistrictPath,
} from "@/content/districts/district-routes";
import {
  isDistrictGuideIndexable,
  isDistrictNewsPageIndexable,
} from "@/content/districts/district-seo";
import {
  getPublicPagePath,
  homePagePaths,
  isHomePageIndexable,
} from "@/content/pages/page-seo";
import type { PublicPage } from "@/content/pages/public-types";
import { getPhotoPath, photoListPaths } from "@/content/photos/photo-routes";
import type { PublicPhoto } from "@/content/photos/types";
import {
  workspacePath,
  workspaces,
  type WorkspaceEntry,
} from "@/content/workspaces";
import {
  createLanguageAlternates,
  siteLocales,
  toAbsoluteUrl,
  type LocalizedPaths,
  type SiteLocale,
} from "@/lib/metadata";

export type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

/** Home page data as the page data source returns it; `null` if it failed. */
export type SitemapHomePage = {
  source: "static" | "payload";
  page: PublicPage | null;
} | null;

export type SitemapContent = {
  /** Published articles in both languages. */
  articles: readonly PublicArticleSummary[];
  /** Published book reviews in both languages. */
  bookReviews: readonly PublicBookReview[];
  /** Published photos in both languages. */
  photos: readonly PublicPhoto[];
  /** Published Turkish standard CMS pages. */
  standardPages: readonly PublicPage[];
  homePages: Record<SiteLocale, SitemapHomePage>;
  /** Published guide per district slug; a missing slug could not be loaded. */
  districtGuides: ReadonlyMap<string, DistrictGuide | null>;
  /** Published Turkish district news of every district. */
  districtNews: readonly PublicArticleSummary[];
};

type EntryOptions = {
  changeFrequency: ChangeFrequency;
  priority: number;
  lastModified?: Date;
  images?: readonly string[];
};

function toDate(value: string | null | undefined): Date | undefined {
  if (value === null || value === undefined) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

export function getLatestDate(
  dates: Iterable<Date | undefined>,
): Date | undefined {
  let latest: Date | undefined;
  for (const date of dates) {
    if (date !== undefined && (latest === undefined || date > latest)) {
      latest = date;
    }
  }
  return latest;
}

/**
 * When a content item last changed on the site: the later of `updatedAt` and
 * `publishedAt`. A scheduled item is saved before it goes live, so its
 * `updatedAt` predates the day it appears; its URL (and its list page) change
 * at `publishedAt`.
 */
export function getContentLastModified(item: {
  updatedAt: string | null;
  publishedAt: string | null;
}): Date | undefined {
  return getLatestDate([toDate(item.updatedAt), toDate(item.publishedAt)]);
}

function createEntry(
  path: string,
  options: EntryOptions,
  paths?: LocalizedPaths,
): SitemapEntry {
  const languages = paths === undefined ? {} : createLanguageAlternates(paths);

  return {
    url: toAbsoluteUrl(path),
    ...(options.lastModified === undefined
      ? {}
      : { lastModified: options.lastModified }),
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    // A single language needs no hreflang cluster.
    ...(Object.keys(languages).length > 1 ? { alternates: { languages } } : {}),
    ...(options.images === undefined || options.images.length === 0
      ? {}
      : { images: [...options.images] }),
  };
}

/** One entry per language version, each listing all versions as alternates. */
function createLocalizedEntries(
  paths: LocalizedPaths,
  options: Omit<EntryOptions, "lastModified"> & {
    lastModified?: Partial<Record<SiteLocale, Date | undefined>>;
  },
): SitemapEntry[] {
  return siteLocales.flatMap((locale) => {
    const path = paths[locale];
    return path === undefined
      ? []
      : [
          createEntry(
            path,
            { ...options, lastModified: options.lastModified?.[locale] },
            paths,
          ),
        ];
  });
}

function isListedArticle(article: PublicArticleSummary): boolean {
  return isArticleHreflangEligible(article);
}

export function buildArticleEntries(
  articles: readonly PublicArticleSummary[],
): SitemapEntry[] {
  const listed = articles.filter(isListedArticle);

  return listed.map((article) => {
    const translation =
      article.translationKey === null
        ? undefined
        : listed.find(
            (candidate) =>
              candidate.language !== article.language &&
              candidate.translationKey === article.translationKey,
          );
    const path = getArticlePath(article.slug, article.language);

    return createEntry(
      path,
      {
        changeFrequency: "monthly",
        priority: 0.7,
        lastModified: getContentLastModified(article),
      },
      {
        [article.language]: path,
        ...(translation === undefined
          ? {}
          : {
              [translation.language]: getArticlePath(
                translation.slug,
                translation.language,
              ),
            }),
      },
    );
  });
}

function isListedBookReview(bookReview: PublicBookReview): boolean {
  return isBookReviewHreflangEligible(bookReview);
}

/**
 * The other-language version of a review. A CMS translation link may be set
 * on one side only, so both directions are checked (the detail pages do the
 * same with a reverse lookup), then the shared translation group.
 */
export function findBookReviewTranslation(
  bookReview: PublicBookReview,
  candidates: readonly PublicBookReview[],
): PublicBookReview | undefined {
  const others = candidates.filter(
    (candidate) =>
      candidate.id !== bookReview.id &&
      candidate.language !== bookReview.language,
  );

  return (
    others.find(
      (candidate) => bookReview.translationSourceBookReviewId === candidate.id,
    ) ??
    others.find(
      (candidate) => candidate.translationSourceBookReviewId === bookReview.id,
    ) ??
    (bookReview.translationGroupId === null
      ? undefined
      : others.find(
          (candidate) =>
            candidate.translationGroupId === bookReview.translationGroupId,
        ))
  );
}

export function buildBookReviewEntries(
  bookReviews: readonly PublicBookReview[],
): SitemapEntry[] {
  const listed = bookReviews.filter(isListedBookReview);

  return listed.map((bookReview) => {
    const translation = findBookReviewTranslation(bookReview, listed);
    const path = getBookReviewPath(bookReview.slug, bookReview.language);

    return createEntry(
      path,
      {
        changeFrequency: "monthly",
        priority: 0.7,
        lastModified: getContentLastModified(bookReview),
      },
      {
        [bookReview.language]: path,
        ...(translation === undefined
          ? {}
          : {
              [translation.language]: getBookReviewPath(
                translation.slug,
                translation.language,
              ),
            }),
      },
    );
  });
}

export function buildPhotoEntries(
  photos: readonly PublicPhoto[],
): SitemapEntry[] {
  return photos.map((photo) => {
    // Localized versions of a CMS photo share the document ID.
    const translation = photos.find(
      (candidate) =>
        candidate.id === photo.id && candidate.language !== photo.language,
    );
    const path = getPhotoPath(photo.slug, photo.language);

    return createEntry(
      path,
      {
        changeFrequency: "monthly",
        priority: 0.65,
        lastModified: getContentLastModified(photo),
        images: [toAbsoluteUrl(photo.image.src)],
      },
      {
        [photo.language]: path,
        ...(translation === undefined
          ? {}
          : {
              [translation.language]: getPhotoPath(
                translation.slug,
                translation.language,
              ),
            }),
      },
    );
  });
}

/** The home page metadata uses the same rule for its hreflang pair. */
function isHomePageListed(home: SitemapHomePage): boolean {
  return isHomePageIndexable(home?.page ?? null);
}

export function buildHomeEntries(
  homePages: Record<SiteLocale, SitemapHomePage>,
): SitemapEntry[] {
  const listed = siteLocales.filter((locale) =>
    isHomePageListed(homePages[locale]),
  );
  const paths: LocalizedPaths = Object.fromEntries(
    listed.map((locale) => [locale, homePagePaths[locale]]),
  );

  return listed.map((locale) => {
    const page = homePages[locale]?.page ?? null;
    return createEntry(
      homePagePaths[locale],
      {
        changeFrequency: "weekly",
        priority: locale === "tr" ? 1 : 0.9,
        lastModified: page === null ? undefined : getContentLastModified(page),
      },
      paths,
    );
  });
}

export function buildStandardPageEntries(
  pages: readonly PublicPage[],
  excludedPageIds: ReadonlySet<string> = new Set(),
): SitemapEntry[] {
  return pages
    .filter(
      (page) =>
        page.pageType === "standard" &&
        // Only Turkish standard pages have a route (/<slug>); /en/<slug>
        // is a 404, so an English record must never reach the sitemap.
        page.language === "tr" &&
        page.seo.index &&
        // The legacy "ana-sayfa" record is served as the home page.
        !excludedPageIds.has(page.id),
    )
    .map((page) =>
      createEntry(getPublicPagePath(page), {
        changeFrequency: "monthly",
        priority: 0.6,
        lastModified: getContentLastModified(page),
      }),
    );
}

/**
 * Static pages with real content. `/hakkimda/biyografi` and
 * `/hakkimda/egitim-sertifikalar-diplomalar` are placeholders and are not
 * listed; the biography is published on `/hakkimda`.
 */
export function buildStaticPageEntries(): SitemapEntry[] {
  return [
    createEntry("/hakkimda", { changeFrequency: "monthly", priority: 0.7 }),
    ...createLocalizedEntries(contactPaths, {
      changeFrequency: "monthly",
      priority: 0.7,
    }),
    ...createLocalizedEntries(privacyPaths, {
      changeFrequency: "yearly",
      priority: 0.5,
    }),
  ];
}

function latestByLocale<T extends { language: SiteLocale }>(
  items: readonly T[],
  getDate: (item: T) => Date | undefined,
): Record<SiteLocale, Date | undefined> {
  return {
    tr: getLatestDate(
      items.filter((item) => item.language === "tr").map(getDate),
    ),
    en: getLatestDate(
      items.filter((item) => item.language === "en").map(getDate),
    ),
  };
}

export function buildListEntries(
  content: Pick<SitemapContent, "articles" | "bookReviews" | "photos">,
): SitemapEntry[] {
  const options = { changeFrequency: "weekly", priority: 0.8 } as const;

  return [
    ...createLocalizedEntries(articleListPaths, {
      ...options,
      lastModified: latestByLocale(content.articles, getContentLastModified),
    }),
    ...createLocalizedEntries(bookListPaths, {
      ...options,
      lastModified: latestByLocale(content.bookReviews, getContentLastModified),
    }),
    ...createLocalizedEntries(photoListPaths, {
      ...options,
      lastModified: latestByLocale(content.photos, getContentLastModified),
    }),
  ];
}

export function buildDistrictEntries(
  districtGuides: ReadonlyMap<string, DistrictGuide | null>,
): SitemapEntry[] {
  const indexable = districts.flatMap((district) => {
    const guide = districtGuides.get(district.slug) ?? null;
    return isDistrictGuideIndexable(guide) ? [{ district, guide }] : [];
  });

  return [
    createEntry(districtGuidePath, {
      changeFrequency: "monthly",
      priority: 0.7,
      lastModified: getLatestDate(
        indexable.map(({ guide }) => toDate(guide.updatedAt)),
      ),
    }),
    ...indexable.map(({ district, guide }) =>
      createEntry(getDistrictPath(district.slug), {
        changeFrequency: "monthly",
        priority: 0.6,
        lastModified: toDate(guide.updatedAt),
      }),
    ),
  ];
}

/**
 * Page 1 of every district news list that the news page itself lets search
 * engines index (`isDistrictNewsPageIndexable`), dated by its newest item.
 */
export function buildDistrictNewsEntries(
  news: readonly PublicArticleSummary[],
): SitemapEntry[] {
  return districts.flatMap((district) => {
    const items = news.filter(
      (item) =>
        item.language === "tr" &&
        item.articleType === "district-news" &&
        item.district === district.slug,
    );

    return isDistrictNewsPageIndexable(items)
      ? [
          createEntry(getDistrictNewsPath(district.slug), {
            changeFrequency: "weekly",
            priority: 0.5,
            lastModified: getLatestDate(items.map(getContentLastModified)),
          }),
        ]
      : [];
  });
}

/**
 * Published Turkish items a workspace section page lists, with the same
 * filters as `WorkspaceEntryPage`: articles by category, photos by collection
 * or tag. `null` when the section has no feed (a placeholder page).
 */
export function getWorkspaceEntryItems(
  entry: WorkspaceEntry,
  articles: readonly PublicArticleSummary[],
  photos: readonly PublicPhoto[],
): Array<PublicArticleSummary | PublicPhoto> | null {
  if (entry.articleCategory === undefined && entry.photoCategory === undefined)
    return null;

  return [
    ...(entry.articleCategory === undefined
      ? []
      : articles.filter(
          (article) =>
            article.language === "tr" &&
            article.categories.some(
              (category) => category.slug === entry.articleCategory,
            ),
        )),
    ...(entry.photoCategory === undefined
      ? []
      : photos.filter(
          (photo) =>
            photo.language === "tr" &&
            (photo.collections.some(
              (collection) => collection.slug === entry.photoCategory,
            ) ||
              photo.tags.some((tag) => tag.slug === entry.photoCategory)),
        )),
  ];
}

/**
 * The workspace index, the six workspace pages and the section pages that
 * have published content. Sections that only link to another listing
 * (`/istanbul/ilceler`, `/kitaplar`, `/fotograflar`) are listed there.
 */
export function buildWorkspaceEntries(
  articles: readonly PublicArticleSummary[],
  photos: readonly PublicPhoto[],
): SitemapEntry[] {
  return [
    createEntry(workspacePath, { changeFrequency: "monthly", priority: 0.8 }),
    ...workspaces.flatMap((workspace) => [
      createEntry(`/${workspace.key}`, {
        changeFrequency: "monthly",
        priority: 0.7,
      }),
      ...workspace.entries.flatMap((entry) => {
        if (!entry.href.startsWith(`/${workspace.key}/`)) return [];
        const items = getWorkspaceEntryItems(entry, articles, photos);
        return items === null || items.length === 0
          ? []
          : [
              createEntry(entry.href, {
                changeFrequency: "monthly",
                priority: 0.6,
                lastModified: getLatestDate(items.map(getContentLastModified)),
              }),
            ];
      }),
    ]),
  ];
}

/** Keeps the first entry for every URL. */
export function mergeSitemapEntries(
  entries: Iterable<SitemapEntry>,
): SitemapEntry[] {
  const byUrl = new Map<string, SitemapEntry>();
  for (const entry of entries) {
    if (!byUrl.has(entry.url)) byUrl.set(entry.url, entry);
  }
  return [...byUrl.values()];
}

export function buildSitemap(content: SitemapContent): MetadataRoute.Sitemap {
  const homePageIds = new Set(
    siteLocales.flatMap((locale) => {
      const id = content.homePages[locale]?.page?.id;
      return id === undefined ? [] : [id];
    }),
  );

  return mergeSitemapEntries([
    ...buildHomeEntries(content.homePages),
    ...buildStaticPageEntries(),
    ...buildListEntries(content),
    ...buildArticleEntries(content.articles),
    ...buildBookReviewEntries(content.bookReviews),
    ...buildPhotoEntries(content.photos),
    ...buildStandardPageEntries(content.standardPages, homePageIds),
    ...buildDistrictEntries(content.districtGuides),
    ...buildDistrictNewsEntries(content.districtNews),
    ...buildWorkspaceEntries(content.articles, content.photos),
  ]);
}

export type SitemapErrorReporter = (source: string, error: unknown) => void;

/**
 * One structured `[content]` line per failing source, like every other
 * content skip: the source name and the error class and message, never the
 * stringified error object.
 */
export const reportSitemapSourceError: SitemapErrorReporter = (
  source,
  error,
) => {
  reportContentIssue(
    {
      scope: "sitemap",
      reason: "source-unavailable",
      id: source,
      detail: describeError(error),
    },
    "error",
  );
};

/** Resolves to `fallback` (and reports the error) when `load` fails. */
export async function loadSitemapSource<T>(
  source: string,
  load: () => Promise<T>,
  fallback: T,
  report: SitemapErrorReporter = reportSitemapSourceError,
): Promise<T> {
  try {
    return await load();
  } catch (error) {
    report(source, error);
    return fallback;
  }
}

/**
 * Loads one value per key. Keys whose load fails are left out of the map and
 * reported together, so a single failing record does not hide the others.
 */
export async function loadSitemapSourcesByKey<T>(
  source: string,
  keys: readonly string[],
  load: (key: string) => Promise<T>,
  report: SitemapErrorReporter = reportSitemapSourceError,
): Promise<Map<string, T>> {
  // `async` turns a synchronous throw into a rejection of that key only.
  const results = await Promise.allSettled(keys.map(async (key) => load(key)));
  const values = new Map<string, T>();
  const failed: string[] = [];
  let firstError: unknown;

  results.forEach((result, index) => {
    const key = keys[index];
    if (key === undefined) return;
    if (result.status === "fulfilled") {
      values.set(key, result.value);
    } else {
      failed.push(key);
      firstError ??= result.reason;
    }
  });

  if (failed.length > 0) {
    report(`${source} (${failed.join(", ")})`, firstError);
  }

  return values;
}
