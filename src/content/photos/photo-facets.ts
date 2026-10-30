import { isRecord } from "@/content/guards";
import {
  mapPhotoCollection,
  mapPhotoTag,
} from "@/content/photos/payload-photo-mapper";
import type {
  PhotoLanguage,
  PublicPhotoCollection,
  PublicPhotoTag,
} from "@/content/photos/types";

export type PhotoFacets = {
  collections: PublicPhotoCollection[];
  tags: PublicPhotoTag[];
};

/**
 * Filter options of the photo list: every collection and tag used by at
 * least one public photo, de-duplicated and sorted. The input is the light
 * facet query (only the two relationship fields of each photo).
 */
export function collectPhotoFacets(
  documents: ReadonlyArray<unknown>,
  locale: PhotoLanguage,
): PhotoFacets {
  const collections = new Map<string, PublicPhotoCollection>();
  const tags = new Map<string, PublicPhotoTag>();

  for (const document of documents) {
    if (!isRecord(document)) continue;

    for (const value of Array.isArray(document.collections)
      ? document.collections
      : []) {
      const collection = mapPhotoCollection(value);
      if (collection !== null) collections.set(collection.id, collection);
    }

    for (const value of Array.isArray(document.tags) ? document.tags : []) {
      const tag = mapPhotoTag(value);
      if (tag !== null) tags.set(tag.id, tag);
    }
  }

  return {
    collections: [...collections.values()].toSorted(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.title.localeCompare(right.title, locale),
    ),
    tags: [...tags.values()].toSorted((left, right) =>
      left.title.localeCompare(right.title, locale),
    ),
  };
}
