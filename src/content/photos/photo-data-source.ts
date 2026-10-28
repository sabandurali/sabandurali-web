import "server-only";
import { cache } from "react";
import { PayloadPublicPhotoRepository } from "@/content/photos/payload-photo-repository";
import type {
  PhotoLanguage,
  PhotoListFilters,
  PublicPhoto,
  PublicPhotoTranslation,
} from "@/content/photos/types";
import { readPublicSource } from "@/content/public-source";

const payloadPhotoRepository = new PayloadPublicPhotoRepository();

function emptyList() {
  return {
    photos: [],
    collections: [],
    tags: [],
    page: 1,
    totalPages: 1,
    totalItems: 0,
  };
}

export async function getPublishedPhotos(
  locale: PhotoLanguage,
  filters: PhotoListFilters = {},
) {
  return readPublicSource("PHOTO_PUBLIC_SOURCE") === "payload"
    ? payloadPhotoRepository.listPublished(locale, filters)
    : emptyList();
}

export const getPublishedPhotoPageData = cache(
  async (
    slug: string,
    locale: PhotoLanguage,
  ): Promise<{
    photo: PublicPhoto | null;
    translation: PublicPhotoTranslation | null;
  }> => {
    if (readPublicSource("PHOTO_PUBLIC_SOURCE") === "static") {
      return { photo: null, translation: null };
    }
    const photo = await payloadPhotoRepository.findPublishedBySlug(
      slug,
      locale,
    );
    if (photo === null) return { photo: null, translation: null };
    const translated = await payloadPhotoRepository.findPublishedByID(
      photo.id,
      locale === "tr" ? "en" : "tr",
    );
    return {
      photo,
      translation:
        translated === null
          ? null
          : {
              id: translated.id,
              language: translated.language,
              title: translated.title,
              slug: translated.slug,
            },
    };
  },
);

export async function getRelatedPublishedPhotos(photo: PublicPhoto) {
  return readPublicSource("PHOTO_PUBLIC_SOURCE") === "payload"
    ? payloadPhotoRepository.related(photo)
    : [];
}

export async function getAllPublishedPhotos(locale: PhotoLanguage) {
  return readPublicSource("PHOTO_PUBLIC_SOURCE") === "payload"
    ? payloadPhotoRepository.listAllPublished(locale)
    : [];
}

export async function getDistrictPhotos(
  district: string,
  locale: PhotoLanguage,
) {
  const photos = await getAllPublishedPhotos(locale);
  return photos.filter((photo) => photo.district === district);
}
