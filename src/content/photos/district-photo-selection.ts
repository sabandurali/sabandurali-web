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
