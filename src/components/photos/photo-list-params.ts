import { photoListPaths } from "@/content/photos/photo-routes";
import type { PhotoLanguage, PhotoListFilters } from "@/content/photos/types";

export type PhotoListSearchParams = Record<
  string,
  string | string[] | undefined
>;

/** Longest slug or page value read from the query string. */
const maxValueLength = 120;

function single(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" || trimmed.length > maxValueLength
    ? undefined
    : trimmed;
}

/**
 * Filters of the photograph list from its query string. Repeated or empty
 * values are ignored, and `page` must be a positive integer written in
 * digits ("2", not "2.0" or "1e3"), so every list URL maps to one result.
 */
export function parsePhotoListParams(
  query: PhotoListSearchParams,
): PhotoListFilters {
  const collection = single(query.collection);
  const tag = single(query.tag);
  const pageValue = single(query.page);
  const page =
    pageValue !== undefined && /^[1-9]\d{0,5}$/.test(pageValue)
      ? Number(pageValue)
      : undefined;

  return {
    ...(collection === undefined ? {} : { collection }),
    ...(tag === undefined ? {} : { tag }),
    ...(page === undefined || page === 1 ? {} : { page }),
  };
}

/**
 * Only the plain first page is indexed; filtered and later pages repeat
 * photographs of the list and point their canonical URL to it.
 */
export function isIndexablePhotoList(filters: PhotoListFilters): boolean {
  return (
    filters.collection === undefined &&
    filters.tag === undefined &&
    (filters.page === undefined || filters.page === 1)
  );
}

/** URL of one list page with the active filters (page 1 has no number). */
export function getPhotoListHref(
  locale: PhotoLanguage,
  filters: Pick<PhotoListFilters, "collection" | "tag">,
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.tag) params.set("tag", filters.tag);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `${photoListPaths[locale]}${query ? `?${query}` : ""}`;
}
