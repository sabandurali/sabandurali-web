import type {
  PublicPhoto,
  PublicPhotoTranslation,
  PhotoLanguage,
  PhotoListFilters,
} from "@/content/photos/types";

export const photoListPaths = {
  tr: "/fotograflar",
  en: "/en/photography",
} as const satisfies Record<PhotoLanguage, string>;

export function getPhotoPath(slug: string, language: PhotoLanguage): string {
  return `${photoListPaths[language]}/${slug}`;
}

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

export function getPhotoLanguagePaths(
  photo: PublicPhoto,
  translation: PublicPhotoTranslation | null,
): Record<PhotoLanguage, string> {
  const paths: Record<PhotoLanguage, string> = {
    tr: photoListPaths.tr,
    en: photoListPaths.en,
  };
  paths[photo.language] = getPhotoPath(photo.slug, photo.language);
  if (translation !== null) {
    paths[translation.language] = getPhotoPath(
      translation.slug,
      translation.language,
    );
  }
  return paths;
}
