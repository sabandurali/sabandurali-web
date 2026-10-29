import type { Metadata } from "next";
import type { ListContent } from "@/content/list-seo";
import { createListPageMetadata } from "@/content/list-seo";
import {
  getPhotoListPath,
  photoListPaths,
} from "@/content/photos/photo-routes";
import { normalizeRequestedPage } from "@/content/photos/photo-query-conditions";
import type {
  PhotoLanguage,
  PhotoListFilters,
  PublishedPhotoList,
} from "@/content/photos/types";
import { createPageMetadata, createPaginatedCopy } from "@/lib/metadata";

const copy = {
  tr: {
    title: "Fotoğraflar | Şaban Durali",
    description: "Şehir, insan ve hayvan hikâyelerinden fotoğraflar.",
  },
  en: {
    title: "Photography | Şaban Durali",
    description: "Photographs from city, human and animal stories.",
  },
} as const satisfies Record<
  PhotoLanguage,
  { title: string; description: string }
>;

/**
 * Metadata of one photograph list page, the same pagination model as the
 * district news lists:
 *
 * - page 1 without filters is the list: indexable with photos, paired with
 *   the other language's list when that one has photos too;
 * - a later page is its own canonical URL (`?page=N`), indexable, outside
 *   the hreflang cluster (the pages do not correspond across languages),
 *   with its page number in the title and description;
 * - a filtered view repeats photos of the list: noindex, follow, with its
 *   own URL as canonical (never noindex combined with a canonical that
 *   points elsewhere).
 *
 * `list.page` is the page actually served (a page past the end shows the
 * last one), so the canonical names the content on screen.
 */
export function createPhotoListMetadata(
  locale: PhotoLanguage,
  filters: PhotoListFilters,
  list: Pick<PublishedPhotoList, "page" | "totalItems">,
  content: ListContent,
): Metadata {
  const filtered =
    filters.collection !== undefined || filters.tag !== undefined;

  if (!filtered && list.page <= 1) {
    return createListPageMetadata({
      ...copy[locale],
      locale,
      paths: photoListPaths,
      // The served list is the source of truth for this language.
      content: { ...content, [locale]: list.totalItems > 0 },
    });
  }

  return createPageMetadata({
    ...createPaginatedCopy(copy[locale], list.page, locale),
    locale,
    path: getPhotoListPath(locale, filters, list.page),
    hreflang: false,
    index: !filtered && list.totalItems > 0,
    follow: true,
  });
}

export type PhotoListMetadataLoaders = {
  /** The served list page (shared with the page render). */
  list: () => Promise<Pick<PublishedPhotoList, "page" | "totalItems">>;
  /** Whether a language has any public photo. */
  hasPhotos: (locale: PhotoLanguage) => Promise<boolean>;
};

/**
 * Loads only what the metadata of this request uses. The other language's
 * photo check matters only to the hreflang pair of the unfiltered first
 * page; this language's comes from the served list. A filtered or later
 * page runs no extra query. A request for the first page starts the check
 * together with the list; a page past the end that is clamped to page 1
 * runs it afterwards.
 */
export async function loadPhotoListMetadata(
  locale: PhotoLanguage,
  filters: PhotoListFilters,
  load: PhotoListMetadataLoaders,
): Promise<Metadata> {
  const other: PhotoLanguage = locale === "tr" ? "en" : "tr";
  const filtered =
    filters.collection !== undefined || filters.tag !== undefined;
  const early =
    !filtered && normalizeRequestedPage(filters.page) <= 1
      ? load.hasPhotos(other)
      : null;
  const list = await load.list();
  const isListPage = !filtered && list.page <= 1;
  const own = list.totalItems > 0;
  const otherHasPhotos = isListPage
    ? await (early ?? load.hasPhotos(other))
    : false;
  const content: ListContent =
    locale === "tr"
      ? { tr: own, en: otherHasPhotos }
      : { tr: otherHasPhotos, en: own };
  return createPhotoListMetadata(locale, filters, list, content);
}
