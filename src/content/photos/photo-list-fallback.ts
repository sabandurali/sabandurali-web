import type { SiteLocale } from "@/content/locales";
import type { PhotoListFilters, PublishedPhotoList } from "./types";

/**
 * Whether a photo list shows the Turkish photographs instead of "no
 * photographs" (A11Y-I18N-03, UX-02). Photographs are published in Turkish
 * first; until one has an English page, the unfiltered first page of the
 * English list would claim there are none although the Turkish list has
 * them. Only that page falls back: a filter or a later page that matches
 * nothing really is empty. The English list itself stays noindex while it
 * has no English photograph (photo-list-seo.ts), so the Turkish cards never
 * become indexable English content.
 */
export function shouldShowTurkishPhotoFallback(
  locale: SiteLocale,
  filters: PhotoListFilters,
  result: Pick<PublishedPhotoList, "totalItems">,
): boolean {
  return (
    locale !== "tr" &&
    result.totalItems === 0 &&
    filters.collection === undefined &&
    filters.tag === undefined &&
    (filters.page === undefined || filters.page === 1)
  );
}
