import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { mapPayloadPhoto } from "@/content/photos/payload-photo-mapper";
import { collectPhotoFacets } from "@/content/photos/photo-facets";
import {
  clampPhotoPage,
  createDistrictPhotoConditions,
  createPhotoCategoryConditions,
  createPhotoListConditions,
  createPublicPhotoConditions,
  createRelatedPhotoConditions,
  normalizeRequestedPage,
  PHOTO_LIST_PAGE_SIZE,
} from "@/content/photos/photo-query-conditions";
import type {
  PhotoLanguage,
  PhotoListFilters,
  PublicPhoto,
  PublishedPhotoList,
} from "@/content/photos/types";

const PAYLOAD_PAGE_SIZE = 100;
const PUBLIC_PHOTO_SORT = ["-publishedAt", "id"];

/**
 * Public photo reads. Filters run in the database and documents are loaded
 * at depth 1: the image, collections and tags are populated, nothing more.
 */
export class PayloadPublicPhotoRepository {
  private async findPage(
    locale: PhotoLanguage,
    conditions: Where[],
    page: number,
    limit: number,
    now: Date,
  ) {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "photos",
      depth: 1,
      draft: false,
      fallbackLocale: false,
      locale,
      limit,
      overrideAccess: false,
      page,
      sort: PUBLIC_PHOTO_SORT,
      where: { and: conditions },
    });
    const photos = result.docs.flatMap((document) => {
      const photo = mapPayloadPhoto(document, locale, now);
      return photo === null ? [] : [photo];
    });

    return {
      photos,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
    };
  }

  private async findAll(
    locale: PhotoLanguage,
    conditions: Where[],
    now: Date,
  ): Promise<PublicPhoto[]> {
    const photos: PublicPhoto[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const result = await this.findPage(
        locale,
        conditions,
        page,
        PAYLOAD_PAGE_SIZE,
        now,
      );
      photos.push(...result.photos);
      totalPages = result.totalPages;
      page += 1;
    }

    return photos;
  }

  /** Filter options: only the relationship fields of the public photos. */
  private async listFacets(locale: PhotoLanguage, now: Date) {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "photos",
      depth: 1,
      draft: false,
      fallbackLocale: false,
      locale,
      overrideAccess: false,
      pagination: false,
      populate: {
        "photo-collections": {
          title: true,
          slug: true,
          parent: true,
          sortOrder: true,
        },
        tags: { title: true, slug: true },
      },
      select: { collections: true, tags: true },
      where: { and: createPublicPhotoConditions(now) },
    });

    return collectPhotoFacets(result.docs, locale);
  }

  async listPublished(
    locale: PhotoLanguage,
    filters: PhotoListFilters = {},
    now: Date = new Date(),
  ): Promise<PublishedPhotoList> {
    const conditions = createPhotoListConditions(now, filters);
    const requestedPage = normalizeRequestedPage(filters.page);
    const [first, facets] = await Promise.all([
      this.findPage(
        locale,
        conditions,
        requestedPage,
        PHOTO_LIST_PAGE_SIZE,
        now,
      ),
      this.listFacets(locale, now),
    ]);
    const { page, totalPages } = clampPhotoPage(requestedPage, first.totalDocs);
    // A page number past the end shows the last page.
    const current =
      page === requestedPage
        ? first
        : await this.findPage(
            locale,
            conditions,
            page,
            PHOTO_LIST_PAGE_SIZE,
            now,
          );

    return {
      photos: current.photos,
      collections: facets.collections,
      tags: facets.tags,
      page,
      totalPages,
      totalItems: first.totalDocs,
    };
  }

  async listAllPublished(
    locale: PhotoLanguage,
    now: Date = new Date(),
  ): Promise<PublicPhoto[]> {
    return this.findAll(locale, createPublicPhotoConditions(now), now);
  }

  async listByDistrict(
    district: string,
    locale: PhotoLanguage,
    now: Date = new Date(),
  ): Promise<PublicPhoto[]> {
    return this.findAll(
      locale,
      createDistrictPhotoConditions(now, district),
      now,
    );
  }

  async listByCollectionOrTag(
    slug: string,
    locale: PhotoLanguage,
    now: Date = new Date(),
  ): Promise<PublicPhoto[]> {
    return this.findAll(locale, createPhotoCategoryConditions(now, slug), now);
  }

  async findPublishedBySlug(
    slug: string,
    locale: PhotoLanguage,
    now: Date = new Date(),
  ): Promise<PublicPhoto | null> {
    const { photos } = await this.findPage(
      locale,
      [...createPublicPhotoConditions(now), { slug: { equals: slug } }],
      1,
      1,
      now,
    );
    return photos[0] ?? null;
  }

  async findPublishedByID(
    id: string,
    locale: PhotoLanguage,
    now: Date = new Date(),
  ): Promise<PublicPhoto | null> {
    const { photos } = await this.findPage(
      locale,
      [...createPublicPhotoConditions(now), { id: { equals: id } }],
      1,
      1,
      now,
    );
    return photos[0] ?? null;
  }

  async related(
    photo: PublicPhoto,
    limit = 4,
    now: Date = new Date(),
  ): Promise<PublicPhoto[]> {
    const conditions = createRelatedPhotoConditions(now, photo);

    if (conditions === null) return [];

    const { photos } = await this.findPage(
      photo.language,
      conditions,
      1,
      limit,
      now,
    );
    return photos;
  }
}
