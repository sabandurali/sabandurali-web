import { getSafePayloadMediaPath } from "@/content/articles/article-images";
import type {
  Media,
  Photo,
  PhotoCollection,
  Tag,
} from "@/payload-types";
import type {
  PhotoLanguage,
  PublicPhoto,
  PublicPhotoCollection,
  PublicPhotoImage,
  PublicPhotoTag,
} from "@/content/photos/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function getPositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function mapImage(value: unknown, alt: string): PublicPhotoImage | null {
  if (!isRecord(value)) return null;
  const media = value as unknown as Media;
  const src = getSafePayloadMediaPath(media.url);
  if (src === null || !getText(media.mimeType)?.startsWith("image/")) return null;
  return {
    src,
    alt,
    width: getPositiveNumber(media.width),
    height: getPositiveNumber(media.height),
  };
}

function mapCollection(value: string | PhotoCollection): PublicPhotoCollection | null {
  if (!isRecord(value)) return null;
  const id = getText(value.id);
  const title = getText(value.title);
  const slug = getText(value.slug);
  if (id === null || title === null || slug === null) return null;
  const parent = value.parent;
  const parentId = typeof parent === "string" ? parent : isRecord(parent) ? getText(parent.id) : null;
  return {
    id,
    title,
    slug,
    parentId,
    sortOrder: typeof value.sortOrder === "number" ? value.sortOrder : 0,
  };
}

function mapTag(value: string | Tag): PublicPhotoTag | null {
  if (!isRecord(value)) return null;
  const id = getText(value.id);
  const title = getText(value.title);
  const slug = getText(value.slug);
  return id === null || title === null || slug === null ? null : { id, title, slug };
}

export function mapPayloadPhoto(
  value: Photo,
  locale: PhotoLanguage,
  now: Date = new Date(),
): PublicPhoto | null {
  const id = getText(value.id);
  const title = getText(value.title);
  const slug = getText(value.slug);
  const altText = getText(value.altText);
  const publishedAt = getText(value.publishedAt);
  if (
    id === null ||
    value._status !== "published" ||
    title === null ||
    slug === null ||
    altText === null ||
    publishedAt === null ||
    !Number.isFinite(Date.parse(publishedAt)) ||
    Date.parse(publishedAt) > now.getTime()
  ) return null;

  const image = mapImage(value.image, altText);
  const collections = value.collections
    .map(mapCollection)
    .filter((item): item is PublicPhotoCollection => item !== null)
    .toSorted((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, locale));
  if (image === null || collections.length === 0) return null;

  const tags = (value.tags ?? [])
    .map(mapTag)
    .filter((item): item is PublicPhotoTag => item !== null)
    .toSorted((left, right) => left.title.localeCompare(right.title, locale));
  const fallbackDescription = getText(value.description) ?? "";
  const ogImage = mapImage(value.seo?.openGraphImage, altText);

  return {
    id,
    language: locale,
    title,
    slug,
    description: getText(value.description),
    image,
    collections,
    tags,
    takenAt: getText(value.takenAt),
    locationName: getText(value.locationName),
    district: getText(value.district),
    neighborhood: getText(value.neighborhood),
    districtPhotoCategory: getText(value.districtPhotoCategory),
    dayPeriod: getText(value.dayPeriod),
    photographer: getText(value.photographer) ?? "Şaban Durali",
    creditLicense: getText(value.creditLicense),
    exif: {
      camera: getText(value.exif?.camera),
      lens: getText(value.exif?.lens),
      focalLength: getText(value.exif?.focalLength),
      aperture: getText(value.exif?.aperture),
      shutterSpeed: getText(value.exif?.shutterSpeed),
      iso: getText(value.exif?.iso),
    },
    featured: value.featured === true,
    publishedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    seo: {
      title: getText(value.seo?.metaTitle) ?? title,
      description: getText(value.seo?.metaDescription) ?? fallbackDescription,
      openGraphImage: ogImage,
    },
  };
}
