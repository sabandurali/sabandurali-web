import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { mapPayloadPhoto } from "@/content/photos/payload-photo-mapper";
import type {
  PhotoLanguage,
  PhotoListFilters,
  PublicPhoto,
} from "@/content/photos/types";

const PAGE_SIZE = 24;
const PAYLOAD_PAGE_SIZE = 100;

function publicConditions(now: Date): Where[] {
  return [
    { _status: { equals: "published" } },
    { publishedAt: { less_than_equal: now.toISOString() } },
  ];
}

export class PayloadPublicPhotoRepository {
  private async getAll(locale: PhotoLanguage, now: Date = new Date()): Promise<PublicPhoto[]> {
    const payload = await getPayload({ config });
    const photos: PublicPhoto[] = [];
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      const result = await payload.find({
        collection: "photos",
        depth: 2,
        draft: false,
        fallbackLocale: false,
        locale,
        limit: PAYLOAD_PAGE_SIZE,
        overrideAccess: false,
        page,
        sort: "-publishedAt",
        where: { and: publicConditions(now) },
      });
      for (const document of result.docs) {
        const photo = mapPayloadPhoto(document, locale, now);
        if (photo !== null) photos.push(photo);
      }
      totalPages = result.totalPages;
      page += 1;
    }
    return photos;
  }

  async listPublished(locale: PhotoLanguage, filters: PhotoListFilters = {}) {
    const allPhotos = await this.getAll(locale);
    const filtered = allPhotos.filter((photo) =>
      (filters.collection === undefined || photo.collections.some((item) => item.slug === filters.collection)) &&
      (filters.tag === undefined || photo.tags.some((item) => item.slug === filters.tag)),
    );
    const requestedPage = Math.max(1, Math.floor(filters.page ?? 1));
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const page = Math.min(requestedPage, totalPages);
    const collections = [...new Map(allPhotos.flatMap((photo) => photo.collections).map((item) => [item.id, item])).values()]
      .toSorted((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, locale));
    const tags = [...new Map(allPhotos.flatMap((photo) => photo.tags).map((item) => [item.id, item])).values()]
      .toSorted((left, right) => left.title.localeCompare(right.title, locale));
    return {
      photos: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      collections,
      tags,
      page,
      totalPages,
      totalItems: filtered.length,
    };
  }

  async listAllPublished(locale: PhotoLanguage): Promise<PublicPhoto[]> {
    return this.getAll(locale);
  }

  async findPublishedBySlug(slug: string, locale: PhotoLanguage): Promise<PublicPhoto | null> {
    const payload = await getPayload({ config });
    const now = new Date();
    const result = await payload.find({
      collection: "photos",
      depth: 2,
      draft: false,
      fallbackLocale: false,
      locale,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      where: { and: [...publicConditions(now), { slug: { equals: slug } }] },
    });
    const document = result.docs[0];
    return document === undefined ? null : mapPayloadPhoto(document, locale, now);
  }

  async findPublishedByID(id: string, locale: PhotoLanguage): Promise<PublicPhoto | null> {
    const payload = await getPayload({ config });
    const now = new Date();
    const result = await payload.find({
      collection: "photos",
      depth: 2,
      draft: false,
      fallbackLocale: false,
      locale,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      where: { and: [...publicConditions(now), { id: { equals: id } }] },
    });
    const document = result.docs[0];
    return document === undefined ? null : mapPayloadPhoto(document, locale, now);
  }

  async related(photo: PublicPhoto, limit = 4): Promise<PublicPhoto[]> {
    const all = await this.getAll(photo.language);
    const collectionIDs = new Set(photo.collections.map((item) => item.id));
    const tagIDs = new Set(photo.tags.map((item) => item.id));
    return all
      .filter((candidate) => candidate.id !== photo.id)
      .filter((candidate) =>
        candidate.collections.some((item) => collectionIDs.has(item.id)) ||
        candidate.tags.some((item) => tagIDs.has(item.id)),
      )
      .slice(0, limit);
  }
}
