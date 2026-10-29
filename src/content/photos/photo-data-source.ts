import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { PayloadPublicPhotoRepository } from "@/content/photos/payload-photo-repository";
import { PHOTO_FACETS_CACHE_TAG } from "@/content/photos/photo-cache-tags";
import { toPublicPhotoTranslation } from "@/content/photos/payload-photo-mapper";
import type {
  PublicPhoto,
  PublicPhotoTranslation,
  PublishedPhotoList,
} from "@/content/photos/public-types";
import type { PhotoLanguage, PhotoListFilters } from "@/content/photos/types";
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

/**
 * The list's filter options scan every public photo and do not depend on
 * the URL, so they are cached across requests: photo, photo collection and
 * tag writes invalidate the tag (`src/lib/revalidation.ts`), the hour is the
 * safety net for scheduled publishing. `unstable_cache` is used because the
 * app does not enable Cache Components (`use cache`).
 */
const getCachedPhotoFacets = unstable_cache(
  (locale: PhotoLanguage) => payloadPhotoRepository.listFacets(locale),
  ["photo-facets"],
  { tags: [PHOTO_FACETS_CACHE_TAG], revalidate: 3600 },
);

/** One list page; collection and tag filters run in the database. */
/*
 * Keyed by primitives: the route's metadata and page parse the query string
 * separately, so their filter objects differ, but they read the same list
 * once per request.
 */
const getPublishedPhotoPage = cache(
  async (
    locale: PhotoLanguage,
    collection: string | undefined,
    tag: string | undefined,
    page: number | undefined,
  ): Promise<PublishedPhotoList> =>
    isPayloadSource()
      ? payloadPhotoRepository.listPublished(
          locale,
          {
            ...(collection === undefined ? {} : { collection }),
            ...(tag === undefined ? {} : { tag }),
            ...(page === undefined ? {} : { page }),
          },
          new Date(),
          getCachedPhotoFacets,
        )
      : emptyList(),
);

export async function getPublishedPhotos(
  locale: PhotoLanguage,
  filters: PhotoListFilters = {},
): Promise<PublishedPhotoList> {
  return getPublishedPhotoPage(
    locale,
    filters.collection,
    filters.tag,
    filters.page,
  );
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
        translated === null ? null : toPublicPhotoTranslation(translated),
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

/**
 * The home page photos (Istanbul photos first, then the newest others),
 * read with database limits. Use this instead of selecting from
 * getAllPublishedPhotos().
 */
export const getHomePagePhotos = cache(
  async (locale: PhotoLanguage, limit: number): Promise<PublicPhoto[]> =>
    isPayloadSource()
      ? payloadPhotoRepository.listHomePhotos(locale, limit)
      : [],
);

/** Whether a language has any public photo (one-row read). */
export async function hasPublishedPhotos(
  locale: PhotoLanguage,
): Promise<boolean> {
  return (await getHomePagePhotos(locale, 1)).length > 0;
}

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
