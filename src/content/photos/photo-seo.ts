import type { Metadata } from "next";
import { getPhotoPath } from "@/content/photos/photo-routes";
import type {
  PublicPhoto,
  PublicPhotoTranslation,
} from "@/content/photos/types";
import { getContentLastModifiedIso } from "@/lib/content-dates";
import {
  createOptimizedSocialImage,
  createPageMetadata,
  createSocialImage,
} from "@/lib/metadata";

export function createPhotoMetadata(
  photo: PublicPhoto,
  translation: PublicPhotoTranslation | null,
): Metadata {
  // An explicit share image is used as uploaded; the photograph itself is an
  // original upload and goes through the image optimizer.
  const image =
    photo.seo.openGraphImage === null
      ? createOptimizedSocialImage(photo.image)
      : createSocialImage(photo.seo.openGraphImage);

  return createPageMetadata({
    title: photo.seo.title,
    description: photo.seo.description,
    locale: photo.language,
    path: getPhotoPath(photo.slug, photo.language),
    translations:
      translation === null
        ? undefined
        : {
            [translation.language]: getPhotoPath(
              translation.slug,
              translation.language,
            ),
          },
    images: [image],
    article: {
      publishedTime: photo.publishedAt,
      modifiedTime: getContentLastModifiedIso(photo),
      authors: [photo.photographer],
    },
  });
}
