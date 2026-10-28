import type { Where } from "payload";
import type { PhotoListFilters, PublicPhoto } from "@/content/photos/types";

/** Photos per list page. */
export const PHOTO_LIST_PAGE_SIZE = 24;

export function createPublicPhotoConditions(now: Date): Where[] {
  return [
    { _status: { equals: "published" } },
    { publishedAt: { less_than_equal: now.toISOString() } },
  ];
}

/** List page: optional collection and tag filters, applied in the database. */
export function createPhotoListConditions(
  now: Date,
  filters: Pick<PhotoListFilters, "collection" | "tag">,
): Where[] {
  return [
    ...createPublicPhotoConditions(now),
    ...(filters.collection === undefined
      ? []
      : [{ "collections.slug": { equals: filters.collection } }]),
    ...(filters.tag === undefined
      ? []
      : [{ "tags.slug": { equals: filters.tag } }]),
  ];
}

/** Workspace photo sections match a collection or a tag with the same slug. */
export function createPhotoCategoryConditions(
  now: Date,
  slug: string,
): Where[] {
  return [
    ...createPublicPhotoConditions(now),
    {
      or: [
        { "collections.slug": { equals: slug } },
        { "tags.slug": { equals: slug } },
      ],
    },
  ];
}

export function createDistrictPhotoConditions(
  now: Date,
  district: string,
): Where[] {
  return [
    ...createPublicPhotoConditions(now),
    { district: { equals: district } },
  ];
}

/** Other public photos that share a collection or a tag with `photo`. */
export function createRelatedPhotoConditions(
  now: Date,
  photo: Pick<PublicPhoto, "id" | "collections" | "tags">,
): Where[] | null {
  const collectionIDs = photo.collections.map((item) => item.id);
  const tagIDs = photo.tags.map((item) => item.id);
  const shared: Where[] = [
    ...(collectionIDs.length === 0
      ? []
      : [{ collections: { in: collectionIDs } }]),
    ...(tagIDs.length === 0 ? [] : [{ tags: { in: tagIDs } }]),
  ];

  if (shared.length === 0) return null;

  return [
    ...createPublicPhotoConditions(now),
    { id: { not_equals: photo.id } },
    { or: shared },
  ];
}

/** A positive integer page number; anything else means page 1. */
export function normalizeRequestedPage(requested: number | undefined): number {
  return requested !== undefined && Number.isFinite(requested)
    ? Math.max(1, Math.floor(requested))
    : 1;
}

/** Requested list page clamped to the available pages (at least 1). */
export function clampPhotoPage(
  requested: number | undefined,
  totalItems: number,
): { page: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(totalItems / PHOTO_LIST_PAGE_SIZE));

  return {
    page: Math.min(normalizeRequestedPage(requested), totalPages),
    totalPages,
  };
}
