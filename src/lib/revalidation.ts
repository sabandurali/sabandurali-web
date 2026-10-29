/**
 * On-demand cache revalidation for Payload content.
 *
 * Statically rendered routes (`/`, `/makaleler`, `/kitaplar/[slug]`, ...) are
 * cached until something invalidates them. The collection and global hooks
 * below run after every create, update, publish, unpublish and delete, map the
 * changed document to every public path it can appear on and call Next.js
 * `revalidatePath`. The edit then reaches the site on the next visit instead
 * of the next deploy, and an unpublished or deleted document returns 404.
 *
 * Rules:
 *
 * - Outside a Next.js request (Payload CLI, migrations, import scripts,
 *   `node:test`) `revalidatePath` throws "static generation store missing".
 *   That case is a silent no-op. Any other failure is logged and never fails
 *   the write: the document is already saved, and the time-based safety net
 *   below still refreshes the page.
 * - A draft save of a document that was never public changes nothing public
 *   and is skipped.
 * - Detail routes are revalidated by literal path (current and previous slug)
 *   and by route pattern (`/(tr)/makaleler/[slug]` with type "page"). The
 *   pattern also covers the other locale's slug, translations' hreflang links
 *   and the related-content lists on sibling pages.
 * - Media, Pages and the Navigation global can appear on every page (header
 *   and footer links, shared images), so they revalidate the root layout.
 * - Rich text links to articles, photos and book reviews resolve only while
 *   the target is public (`getInternalDocumentPath`). A change to one of
 *   those therefore also revalidates every route that renders rich text:
 *   article details, CMS pages (`/(tr)/[slug]`) and the homes. Otherwise a
 *   link to an unpublished, renamed or deleted target kept pointing to a 404
 *   until the hourly safety net.
 *
 * Scheduled publishing: a future `publishedAt` makes a document public later
 * without any write, so no hook can fire at that moment. Every route that
 * reads Payload is therefore refreshed on a time basis as well:
 *
 * - the `(tr)` and `(en)` root layouts export `revalidate = 3600`. A route
 *   revalidates at the lowest `revalidate` of its layouts and page, so this
 *   covers every page below them, the header and footer navigation included
 *   (a navigation link to a scheduled page appears once the page is due);
 * - the homes (`/`, `/en`) export `revalidate = 300`;
 * - detail, list, district, workspace-section pages and `sitemap.ts` export
 *   `revalidate = 3600` themselves;
 * - photo lists (`/fotograflar`, `/en/photography`) and district news lists
 *   read `searchParams` and render per request.
 *
 * A page must not opt out with `dynamic = "force-dynamic"` to stay fresh:
 * the hooks below already revalidate it. `revalidation.test.ts` checks both
 * rules.
 */
import { getText, isRecord } from "@/content/guards";
import { isSiteLocale, siteLocales, type SiteLocale } from "@/content/locales";
import { revalidatePath, revalidateTag } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from "payload";
import { homeUrls } from "@/config/site";
import {
  articleListPaths,
  getArticlePath,
} from "@/content/articles/article-routes";
import { bookListPaths, getBookReviewPath } from "@/content/books/book-routes";
import {
  districtGuidePath,
  getDistrictNewsPath,
  getDistrictPath,
} from "@/content/districts/district-routes";
import { PHOTO_FACETS_CACHE_TAG } from "@/content/photos/photo-cache-tags";
import { getPhotoPath, photoListPaths } from "@/content/photos/photo-routes";
import { workspaces } from "@/content/workspaces";

export type RevalidationTarget = Readonly<{
  path: string;
  type?: "layout" | "page";
}>;

export type RevalidatedCollection =
  | "articles"
  | "books"
  | "categories"
  | "district-guides"
  | "media"
  | "pages"
  | "photo-collections"
  | "photos"
  | "tags";

type Language = SiteLocale;

type Revalidate = (path: string, type?: "layout" | "page") => void;

type RevalidateTag = (tag: string, profile: { expire: number }) => void;

type RevalidationLogger = Readonly<{ warn: (message: string) => void }>;

const LANGUAGES: readonly Language[] = siteLocales;

/** Route groups that own the Turkish and English trees in `src/app`. */
const ROUTE_GROUPS: Readonly<Record<Language, string>> = {
  tr: "/(tr)",
  en: "/(en)",
};

/** Every page below the root layout, header and footer included. */
export const ALL_PAGES: RevalidationTarget = { path: "/", type: "layout" };

export const SITEMAP_PATH = "/sitemap.xml";

const HOME_PATHS: Readonly<Record<Language, string>> = {
  tr: new URL(homeUrls["tr-TR"]).pathname,
  en: new URL(homeUrls.en).pathname,
};

/** Slugs produced by `normalizeSlug`; anything else is covered by patterns. */
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getLanguage(value: unknown): Language | null {
  return isSiteLocale(value) ? value : null;
}

function getSafeSlug(value: unknown): string | null {
  const slug = getText(value);
  return slug !== null && SAFE_SLUG.test(slug) ? slug : null;
}

/**
 * Slugs of a localized field. A normal read returns the request locale's
 * string; a `locale: "all"` read returns an object keyed by locale.
 */
function getLocalizedSlugs(
  value: unknown,
  requestLanguage: Language,
): Array<{ language: Language; slug: string }> {
  const slug = getSafeSlug(value);

  if (slug !== null) return [{ language: requestLanguage, slug }];
  if (!isRecord(value)) return [];

  return LANGUAGES.flatMap((language) => {
    const localizedSlug = getSafeSlug(value[language]);
    return localizedSlug === null ? [] : [{ language, slug: localizedSlug }];
  });
}

function getDistricts(docs: readonly unknown[]): string[] {
  return docs.flatMap((doc) => {
    const district = isRecord(doc) ? getSafeSlug(doc.district) : null;
    return district === null ? [] : [district];
  });
}

function pathTarget(path: string): RevalidationTarget {
  return { path };
}

function patternTarget(language: Language, path: string): RevalidationTarget {
  return { path: `${ROUTE_GROUPS[language]}${path}`, type: "page" };
}

function homeTargets(): RevalidationTarget[] {
  return LANGUAGES.map((language) => pathTarget(HOME_PATHS[language]));
}

function workspaceFeedTargets(
  feed: "articleCategory" | "photoCategory",
): RevalidationTarget[] {
  return workspaces.flatMap((workspace) =>
    workspace.entries.flatMap((entry) =>
      entry[feed] === undefined ? [] : [pathTarget(entry.href)],
    ),
  );
}

/**
 * Routes that render rich text, whose internal links resolve only to public
 * targets (see the header comment).
 */
function richTextLinkSourceTargets(): RevalidationTarget[] {
  return [
    ...homeTargets(),
    ...LANGUAGES.map((language) =>
      patternTarget(language, getArticlePath("[slug]", language)),
    ),
    patternTarget("tr", "/[slug]"),
  ];
}

function districtPageTargets(
  districts: readonly string[],
  { news }: { news: boolean },
): RevalidationTarget[] {
  return [
    pathTarget(districtGuidePath),
    ...districts.flatMap((district) => [
      pathTarget(getDistrictPath(district)),
      ...(news ? [pathTarget(getDistrictNewsPath(district))] : []),
    ]),
    patternTarget("tr", getDistrictPath("[district]")),
    ...(news ? [patternTarget("tr", getDistrictNewsPath("[district]"))] : []),
  ];
}

function articleTargets(
  docs: readonly unknown[],
  requestLanguage: Language,
): RevalidationTarget[] {
  return [
    ...homeTargets(),
    ...LANGUAGES.map((language) => pathTarget(articleListPaths[language])),
    ...docs.flatMap((doc) =>
      isRecord(doc)
        ? getLocalizedSlugs(doc.slug, requestLanguage).map(
            ({ language, slug }) => pathTarget(getArticlePath(slug, language)),
          )
        : [],
    ),
    ...LANGUAGES.map((language) =>
      patternTarget(language, getArticlePath("[slug]", language)),
    ),
    ...workspaceFeedTargets("articleCategory"),
    ...districtPageTargets(getDistricts(docs), { news: true }),
    ...richTextLinkSourceTargets(),
    pathTarget(SITEMAP_PATH),
  ];
}

function bookTargets(docs: readonly unknown[]): RevalidationTarget[] {
  return [
    // Reviews carry `showOnHomepage`; the homes are cheap to refresh.
    ...homeTargets(),
    ...LANGUAGES.map((language) => pathTarget(bookListPaths[language])),
    ...docs.flatMap((doc) => {
      if (!isRecord(doc)) return [];

      const language = getLanguage(doc.language);
      const slug = getSafeSlug(doc.slug);

      return language === null || slug === null
        ? []
        : [pathTarget(getBookReviewPath(slug, language))];
    }),
    ...LANGUAGES.map((language) =>
      patternTarget(language, getBookReviewPath("[slug]", language)),
    ),
    ...richTextLinkSourceTargets(),
    pathTarget(SITEMAP_PATH),
  ];
}

function pageTargets(docs: readonly unknown[]): RevalidationTarget[] {
  return [
    // Navigation links resolve CMS pages, so a page change can reach the
    // header and footer of every route.
    ALL_PAGES,
    ...docs.flatMap((doc) => {
      if (!isRecord(doc)) return [];

      const language = getLanguage(doc.language);

      if (doc.pageType === "home" && language !== null) {
        return [pathTarget(HOME_PATHS[language])];
      }

      const slug = getSafeSlug(doc.slug);

      return language === "tr" && slug !== null ? [pathTarget(`/${slug}`)] : [];
    }),
    patternTarget("tr", "/[slug]"),
    pathTarget(SITEMAP_PATH),
  ];
}

function photoTargets(
  docs: readonly unknown[],
  requestLanguage: Language,
): RevalidationTarget[] {
  return [
    ...homeTargets(),
    ...LANGUAGES.map((language) => pathTarget(photoListPaths[language])),
    ...docs.flatMap((doc) =>
      isRecord(doc)
        ? getLocalizedSlugs(doc.slug, requestLanguage).map(
            ({ language, slug }) => pathTarget(getPhotoPath(slug, language)),
          )
        : [],
    ),
    ...LANGUAGES.map((language) =>
      patternTarget(language, getPhotoPath("[slug]", language)),
    ),
    ...workspaceFeedTargets("photoCategory"),
    ...districtPageTargets(getDistricts(docs), { news: false }),
    ...richTextLinkSourceTargets(),
    pathTarget(SITEMAP_PATH),
  ];
}

function districtGuideTargets(docs: readonly unknown[]): RevalidationTarget[] {
  return [
    ...districtPageTargets(getDistricts(docs), { news: true }),
    pathTarget(SITEMAP_PATH),
  ];
}

function uniqueTargets(
  targets: readonly RevalidationTarget[],
): RevalidationTarget[] {
  const seen = new Set<string>();

  return targets.filter((target) => {
    const key = `${target.type ?? "path"}:${target.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Every public path that can show `docs` (the changed document and, on
 * update, its previous state). `requestLanguage` is the locale a localized
 * slug was read in.
 */
export function getCollectionRevalidationTargets(
  collection: RevalidatedCollection,
  docs: readonly unknown[],
  requestLanguage: Language = "tr",
): RevalidationTarget[] {
  switch (collection) {
    case "articles":
    case "categories":
      return uniqueTargets(
        articleTargets(collection === "articles" ? docs : [], requestLanguage),
      );
    case "books":
      return uniqueTargets(bookTargets(docs));
    case "district-guides":
      return uniqueTargets(districtGuideTargets(docs));
    case "media":
      // The sitemap lists image URLs; it is a metadata route, so it is
      // named explicitly instead of relying on the root layout target.
      return [ALL_PAGES, pathTarget(SITEMAP_PATH)];
    case "pages":
      return uniqueTargets(pageTargets(docs));
    case "photo-collections":
    case "photos":
    case "tags":
      return uniqueTargets(
        photoTargets(collection === "photos" ? docs : [], requestLanguage),
      );
  }
}

/**
 * Data cache tags (`unstable_cache`) that `collection` feeds. Paths only
 * refresh rendered pages; cached data that a per-request page reads needs
 * its tag invalidated too.
 */
export function getCollectionRevalidationTags(
  collection: RevalidatedCollection,
): string[] {
  switch (collection) {
    case "photo-collections":
    case "photos":
    case "tags":
      return [PHOTO_FACETS_CACHE_TAG];
    default:
      return [];
  }
}

/** The header and footer render on every page. */
export function getNavigationRevalidationTargets(): RevalidationTarget[] {
  return [ALL_PAGES];
}

function isPublicState(doc: unknown): boolean {
  // Collections without drafts have no `_status`: every change is public.
  return (
    !isRecord(doc) ||
    doc._status === undefined ||
    doc._status === null ||
    doc._status === "published"
  );
}

/**
 * A change is public when the document is published now or was published
 * before (unpublishing). Draft saves of never-published documents are not.
 */
export function shouldRevalidateChange({
  doc,
  operation,
  previousDoc,
}: {
  doc: unknown;
  operation: "create" | "update";
  previousDoc?: unknown;
}): boolean {
  if (isPublicState(doc)) return true;

  return operation === "update" && previousDoc !== undefined
    ? isPublicState(previousDoc)
    : false;
}

function isOutsideNextRequest(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("static generation store missing")
  );
}

function describeTarget(target: RevalidationTarget): string {
  return target.type === undefined
    ? target.path
    : `${target.path} (${target.type})`;
}

/**
 * Calls Next.js `revalidatePath` for every target. Never throws: outside a
 * Next.js request it stops silently, any other failure is logged.
 */
export function revalidateTargets(
  targets: readonly RevalidationTarget[],
  {
    logger,
    revalidate = revalidatePath,
  }: { logger?: RevalidationLogger; revalidate?: Revalidate } = {},
): void {
  for (const target of targets) {
    try {
      revalidate(target.path, target.type);
    } catch (error) {
      if (isOutsideNextRequest(error)) return;

      logger?.warn(
        `[revalidation] ${describeTarget(target)} was not revalidated: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

/**
 * Invalidates data cache tags at once (`expire: 0`: the next read is a
 * fresh query, never stale filter options). Same failure rules as
 * `revalidateTargets`.
 */
export function revalidateTags(
  tags: readonly string[],
  {
    logger,
    revalidate = revalidateTag,
  }: { logger?: RevalidationLogger; revalidate?: RevalidateTag } = {},
): void {
  for (const tag of tags) {
    try {
      revalidate(tag, { expire: 0 });
    } catch (error) {
      if (isOutsideNextRequest(error)) return;

      logger?.warn(
        `[revalidation] tag ${tag} was not revalidated: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

function getRequestLanguage(req: PayloadRequest): Language {
  return req.locale === "en" ? "en" : "tr";
}

function getLogger(req: PayloadRequest): RevalidationLogger {
  return { warn: (message) => req.payload.logger.warn(message) };
}

type HookOptions = Readonly<{
  /** Replaces Next.js `revalidatePath`; tests pass a recorder. */
  revalidate?: Revalidate;
  /** Replaces Next.js `revalidateTag`; tests pass a recorder. */
  revalidateTag?: RevalidateTag;
}>;

/** `afterChange` and `afterDelete` hooks that revalidate `collection`. */
export function createRevalidationHooks(
  collection: RevalidatedCollection,
  { revalidate, revalidateTag: revalidateCacheTag }: HookOptions = {},
): {
  afterChange: CollectionAfterChangeHook;
  afterDelete: CollectionAfterDeleteHook;
} {
  const tags = getCollectionRevalidationTags(collection);

  return {
    afterChange: ({ doc, operation, previousDoc, req }) => {
      if (shouldRevalidateChange({ doc, operation, previousDoc })) {
        revalidateTargets(
          getCollectionRevalidationTargets(
            collection,
            [doc, previousDoc],
            getRequestLanguage(req),
          ),
          { logger: getLogger(req), revalidate },
        );
        revalidateTags(tags, {
          logger: getLogger(req),
          revalidate: revalidateCacheTag,
        });
      }

      return doc;
    },
    afterDelete: ({ doc, req }) => {
      revalidateTargets(
        getCollectionRevalidationTargets(
          collection,
          [doc],
          getRequestLanguage(req),
        ),
        { logger: getLogger(req), revalidate },
      );
      revalidateTags(tags, {
        logger: getLogger(req),
        revalidate: revalidateCacheTag,
      });

      return doc;
    },
  };
}

/** `afterChange` hook for the Navigation global. */
export function createNavigationRevalidationHook({
  revalidate,
}: HookOptions = {}): GlobalAfterChangeHook {
  return ({ doc, previousDoc, req }) => {
    if (shouldRevalidateChange({ doc, operation: "update", previousDoc })) {
      revalidateTargets(getNavigationRevalidationTargets(), {
        logger: getLogger(req),
        revalidate,
      });
    }

    return doc;
  };
}

export const revalidateNavigationAfterChange =
  createNavigationRevalidationHook();
