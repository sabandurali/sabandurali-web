import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import {
  createPersonReference,
  personalBrandName,
  serializeJsonLd,
} from "@/content/entity-seo";
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

/**
 * ImageObject for a photo page. Only what the CMS states is published: the
 * photographer is the creator and credit, and the free-text credit/licence
 * field is the copyright notice. `license` and `acquireLicensePage` need
 * verified licence URLs, which the photo model does not hold, so they are
 * left out rather than guessed.
 */
export function createPhotoJsonLd(photo: PublicPhoto) {
  const photographer = photo.photographer.trim();
  const url = getAbsoluteUrl(getPhotoPath(photo.slug, photo.language));

  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${url}#image`,
    url,
    contentUrl: getAbsoluteUrl(photo.image.src),
    name: photo.title,
    description: photo.description ?? photo.seo.description,
    caption: photo.image.alt,
    width: photo.image.width,
    height: photo.image.height,
    creator:
      photographer === personalBrandName
        ? createPersonReference()
        : { "@type": "Person", name: photographer },
    creditText: photographer,
    copyrightNotice: photo.creditLicense ?? undefined,
    datePublished: photo.publishedAt,
    dateModified: getContentLastModifiedIso(photo),
    inLanguage: photo.language === "tr" ? "tr-TR" : "en",
  };
}

export function serializePhotoJsonLd(photo: PublicPhoto): string {
  return serializeJsonLd(createPhotoJsonLd(photo));
}
