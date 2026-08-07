import "server-only";
import { cache } from "react";
import { PayloadPublicPhotoRepository } from "@/content/photos/payload-photo-repository";
import type {
  PhotoLanguage,
  PhotoListFilters,
  PublicPhoto,
  PublicPhotoTranslation,
} from "@/content/photos/types";
import { assertProductionPayloadInfrastructure } from "@/lib/payloadInfrastructure";

type PublicPhotoSource = "payload" | "static";

const payloadPhotoRepository = new PayloadPublicPhotoRepository();

function getPublicPhotoSource(): PublicPhotoSource {
  const source = process.env.PHOTO_PUBLIC_SOURCE;
  if (source === undefined || source === "static") return "static";
  if (source === "payload") {
    assertProductionPayloadInfrastructure();
    return "payload";
  }
  throw new Error(
    `Invalid PHOTO_PUBLIC_SOURCE value "${source}". Expected "static" or "payload".`,
  );
}

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
  return getPublicPhotoSource() === "payload"
    ? payloadPhotoRepository.listPublished(locale, filters)
    : emptyList();
}

export const getPublishedPhotoPageData = cache(
  async (
    slug: string,
    locale: PhotoLanguage,
  ): Promise<{ photo: PublicPhoto | null; translation: PublicPhotoTranslation | null }> => {
    if (getPublicPhotoSource() === "static") {
      return { photo: null, translation: null };
    }
    const photo = await payloadPhotoRepository.findPublishedBySlug(slug, locale);
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
  return getPublicPhotoSource() === "payload"
    ? payloadPhotoRepository.related(photo)
    : [];
}

export async function getAllPublishedPhotos(locale: PhotoLanguage) {
  return getPublicPhotoSource() === "payload"
    ? payloadPhotoRepository.listAllPublished(locale)
    : [];
}
