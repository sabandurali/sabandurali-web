import { reportContentIssue } from "@/content/content-log";
import {
  getFiniteNumber,
  getText,
  isPublishedBy,
  isRecord,
} from "@/content/guards";
import { mapMediaImage } from "@/content/media";
import type { Photo } from "@/payload-types";
import type {
  PublicPhoto,
  PublicPhotoCollection,
  PublicPhotoImage,
  PublicPhotoTag,
  PublicPhotoTranslation,
} from "@/content/photos/public-types";
import type { PhotoLanguage } from "@/content/photos/types";

function mapImage(
  value: unknown,
  alt: string,
  locale: PhotoLanguage,
): PublicPhotoImage | null {
  const image = mapMediaImage(value, { alt, fallbackAlt: alt, locale });

  if (image === null) return null;

  return {
    src: image.src,
    alt: image.alt,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
  };
}

export function mapPhotoCollection(
  value: unknown,
): PublicPhotoCollection | null {
  if (!isRecord(value)) return null;
  const id = getText(value.id);
  const title = getText(value.title);
  const slug = getText(value.slug);
  if (id === null || title === null || slug === null) return null;
  const parent = value.parent;
  const parentId =
    typeof parent === "string"
      ? parent
      : isRecord(parent)
        ? getText(parent.id)
        : null;
  return {
    id,
    title,
    slug,
    parentId,
    sortOrder: getFiniteNumber(value.sortOrder) ?? 0,
  };
}

export function mapPhotoTag(value: unknown): PublicPhotoTag | null {
  if (!isRecord(value)) return null;
  const id = getText(value.id);
  const title = getText(value.title);
  const slug = getText(value.slug);
  return id === null || title === null || slug === null
    ? null
    : { id, title, slug };
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

  if (id === null) return null;

  const skip = (reason: string): null => {
    reportContentIssue({ scope: "photos", id, locale, reason });
    return null;
  };

  if (value._status !== "published" || !isPublishedBy(publishedAt, now)) {
    return skip("status or publication date is not public");
  }

  if (title === null || slug === null || altText === null) {
    return skip("title, slug or alt text is missing for the requested locale");
  }

  const image = mapImage(value.image, altText, locale);
  const collections = (
    Array.isArray(value.collections) ? value.collections : []
  )
    .map(mapPhotoCollection)
    .filter((item): item is PublicPhotoCollection => item !== null)
    .toSorted(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.title.localeCompare(right.title, locale),
    );

  if (image === null) return skip("image is missing or not a servable image");
  if (collections.length === 0) return skip("no public photo collection");

  const tags = (value.tags ?? [])
    .map(mapPhotoTag)
    .filter((item): item is PublicPhotoTag => item !== null)
    .toSorted((left, right) => left.title.localeCompare(right.title, locale));
  const fallbackDescription = getText(value.description) ?? "";
  const ogImage = mapImage(value.seo?.openGraphImage, altText, locale);

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

/**
 * The other-language version of a photo as the photo page links it: only
 * its identity, title and slug, never the rest of the public photo.
 */
export function toPublicPhotoTranslation(
  photo: PublicPhoto,
): PublicPhotoTranslation {
  return {
    id: photo.id,
    language: photo.language,
    title: photo.title,
    slug: photo.slug,
  };
}
