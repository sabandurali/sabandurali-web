import "server-only";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import { mapPayloadPhoto } from "@/content/photos/payload-photo-mapper";
import {
  collectPhotoFacets,
  type PhotoFacets,
} from "@/content/photos/photo-facets";
import {
  clampPhotoPage,
  createDistrictPhotoConditions,
  createIstanbulPhotoConditions,
  createPhotoCategoryConditions,
  createPhotoListConditions,
  createPublicPhotoConditions,
  createRelatedPhotoConditions,
  normalizeRequestedPage,
  PHOTO_LIST_PAGE_SIZE,
} from "@/content/photos/photo-query-conditions";
import type {
  PublicPhoto,
  PublishedPhotoList,
} from "@/content/photos/public-types";
import type { PhotoLanguage, PhotoListFilters } from "@/content/photos/types";

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
      /** Documents on this page before mapping. */
      found: result.docs.length,
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

  /**
   * Filter options: only the relationship fields of the public photos. They
   * do not depend on the request, so the data source caches them
   * (`getPublishedPhotos`); this query scans every public photo.
   */
  async listFacets(
    locale: PhotoLanguage,
    now: Date = new Date(),
  ): Promise<PhotoFacets> {
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
    loadFacets: (locale: PhotoLanguage) => Promise<PhotoFacets> = (language) =>
      this.listFacets(language, now),
  ): Promise<PublishedPhotoList> {
    const conditions = createPhotoListConditions(now, filters);
    const requestedPage = normalizeRequestedPage(filters.page);
    const findListPage = (page: number) =>
      this.findPage(locale, conditions, page, PHOTO_LIST_PAGE_SIZE, now);
    const [requested, facets] = await Promise.all([
      findListPage(requestedPage),
      loadFacets(locale),
    ]);
    // A page number past the end shows the last page. Payload returns no
    // documents there and, when the query joins other tables (localized
    // fields, collection or tag filters), a total of 0, so the first page
    // supplies the real total.
    const first =
      requestedPage === 1 || requested.found > 0
        ? requested
        : await findListPage(1);
    const { page, totalPages } = clampPhotoPage(requestedPage, first.totalDocs);
    const current =
      page === requestedPage
        ? requested
        : page === 1
          ? first
          : await findListPage(page);

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

  /**
   * Up to `wanted` public photos matching `conditions`, newest first,
   * skipping the IDs in `exclude`. Reads pages of `pageSize` documents and
   * stops as soon as enough photos are collected; a further page is read
   * only when the mapper rejected documents or excluded ones took room.
   */
  private async collectUpTo(
    locale: PhotoLanguage,
    conditions: Where[],
    wanted: number,
    pageSize: number,
    now: Date,
    exclude: ReadonlySet<string> = new Set(),
  ): Promise<PublicPhoto[]> {
    const photos: PublicPhoto[] = [];
    let page = 1;
    let totalPages = 1;

    while (photos.length < wanted && page <= totalPages) {
      const result = await this.findPage(
        locale,
        conditions,
        page,
        pageSize,
        now,
      );
      photos.push(...result.photos.filter(({ id }) => !exclude.has(id)));
      totalPages = result.totalPages;
      page += 1;
    }

    return photos.slice(0, wanted);
  }

  /**
   * The home selection with database limits: up to `limit` Istanbul photos,
   * newest first, then the newest other photos until `limit` is reached.
   * Usually one or two queries of `limit` documents, whatever the collection
   * size; a further page is read only when the mapper rejects documents.
   */
  async listHomePhotos(
    locale: PhotoLanguage,
    limit: number,
    now: Date = new Date(),
  ): Promise<PublicPhoto[]> {
    if (limit <= 0) return [];
    const istanbul = await this.collectUpTo(
      locale,
      createIstanbulPhotoConditions(now),
      limit,
      limit,
      now,
    );
    if (istanbul.length >= limit) return istanbul;

    // Every public Istanbul photo is listed now, so the others are the
    // newest public photos that are not among them.
    const others = await this.collectUpTo(
      locale,
      createPublicPhotoConditions(now),
      limit - istanbul.length,
      limit,
      now,
      new Set(istanbul.map(({ id }) => id)),
    );
    return [...istanbul, ...others];
  }

  /**
   * Whether a language has a public photo: the newest public document,
   * one one-row query unless the mapper rejects it.
   */
  async hasPublished(
    locale: PhotoLanguage,
    now: Date = new Date(),
  ): Promise<boolean> {
    const photos = await this.collectUpTo(
      locale,
      createPublicPhotoConditions(now),
      1,
      1,
      now,
    );
    return photos.length > 0;
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
