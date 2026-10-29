/**
 * Data cache tag of the photo list filter options (`getPublishedPhotos`).
 * Kept free of imports: the Payload revalidation hooks load it.
 */
export const PHOTO_FACETS_CACHE_TAG = "photo-facets";

/**
 * Data cache tag of the unfiltered first photo list page, the canonical
 * list URL. Photo, collection, tag and media writes invalidate it.
 */
export const PHOTO_LIST_CACHE_TAG = "photo-list";

/** Whether a list request is the unfiltered first page (cached). */
export function isFirstUnfilteredPhotoPage(
  collection: string | undefined,
  tag: string | undefined,
  page: number | undefined,
): boolean {
  return (
    collection === undefined &&
    tag === undefined &&
    (page === undefined || page === 1)
  );
}
