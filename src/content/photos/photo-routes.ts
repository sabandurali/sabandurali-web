import type { PhotoLanguage, PhotoListFilters } from "@/content/photos/types";
import { createPublicationRoutes } from "@/content/publication-routes";

export const photoListPaths = {
  tr: "/fotograflar",
  en: "/en/photography",
} as const satisfies Record<PhotoLanguage, string>;

const photoRoutes = createPublicationRoutes(photoListPaths);

export const getPhotoPath = photoRoutes.getPath;
export const getPhotoLanguagePaths = photoRoutes.getLanguagePaths;

/**
 * Path of one photograph list page with its filters, in a fixed parameter
 * order (collection, tag, page); page 1 has no number.
 */
export function getPhotoListPath(
  language: PhotoLanguage,
  filters: Pick<PhotoListFilters, "collection" | "tag">,
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.tag) params.set("tag", filters.tag);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `${photoListPaths[language]}${query ? `?${query}` : ""}`;
}
