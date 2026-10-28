import "server-only";
import { cache } from "react";
import { PayloadPublicPhotoRepository } from "@/content/photos/payload-photo-repository";
import type {
  PhotoLanguage,
  PhotoListFilters,
  PublicPhoto,
  PublicPhotoTranslation,
  PublishedPhotoList,
} from "@/content/photos/types";
import { readPublicSource } from "@/content/public-source";

const payloadPhotoRepository = new PayloadPublicPhotoRepository();

function isPayloadSource(): boolean {
  return readPublicSource("PHOTO_PUBLIC_SOURCE") === "payload";
}

function emptyList(): PublishedPhotoList {
  return {
    photos: [],
    collections: [],
    tags: [],
    page: 1,
    totalPages: 1,
    totalItems: 0,
  };
}

/** One list page; collection and tag filters run in the database. */
export async function getPublishedPhotos(
  locale: PhotoLanguage,
  filters: PhotoListFilters = {},
): Promise<PublishedPhotoList> {
  return isPayloadSource()
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
    if (!isPayloadSource()) {
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

/** Up to four photos sharing a collection or tag, found in the database. */
export async function getRelatedPublishedPhotos(
  photo: PublicPhoto,
): Promise<PublicPhoto[]> {
  return isPayloadSource() ? payloadPhotoRepository.related(photo) : [];
}

/** Every public photo (sitemap, home page), newest first. */
export const getAllPublishedPhotos = cache(
  async (locale: PhotoLanguage): Promise<PublicPhoto[]> =>
    isPayloadSource() ? payloadPhotoRepository.listAllPublished(locale) : [],
);

/** Photos of one district, filtered in the database. */
export const getDistrictPhotos = cache(
  async (district: string, locale: PhotoLanguage): Promise<PublicPhoto[]> =>
    isPayloadSource()
      ? payloadPhotoRepository.listByDistrict(district, locale)
      : [],
);

/**
 * Photos of a workspace section: a collection or a tag with this slug,
 * filtered in the database. Use this instead of filtering
 * getAllPublishedPhotos() in a page.
 */
export const getPublishedPhotosByCollectionOrTag = cache(
  async (slug: string, locale: PhotoLanguage): Promise<PublicPhoto[]> =>
    isPayloadSource()
      ? payloadPhotoRepository.listByCollectionOrTag(slug, locale)
      : [],
);
