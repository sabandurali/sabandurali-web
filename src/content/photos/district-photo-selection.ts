import type { PublicPhoto } from "./types";

export function selectDistrictHeroPhoto(
  photos: PublicPhoto[],
): PublicPhoto | undefined {
  return (
    photos.find((photo) => photo.featured) ??
    photos.find((photo) => photo.districtPhotoCategory !== "tarih")
  );
}

export function selectDistrictGalleryPhotos(
  photos: PublicPhoto[],
  heroPhoto: PublicPhoto | undefined,
): PublicPhoto[] {
  return heroPhoto
    ? photos.filter((photo) => photo.id !== heroPhoto.id)
    : photos;
}

/**
 * Other photographs of a photo's district for its page (PHOTO-DETAIL-POLISH):
 * same district and language, never the photo itself or one already shown
 * as related, newest first as the query returns them, at most `limit`.
 */
export function selectSameDistrictPhotos(
  photo: PublicPhoto,
  candidates: readonly PublicPhoto[],
  shown: readonly PublicPhoto[] = [],
  limit = 4,
): PublicPhoto[] {
  if (photo.district === null) return [];
  const excluded = new Set([photo.id, ...shown.map((item) => item.id)]);
  return candidates
    .filter(
      (candidate) =>
        !excluded.has(candidate.id) &&
        candidate.district === photo.district &&
        candidate.language === photo.language,
    )
    .slice(0, limit);
}
