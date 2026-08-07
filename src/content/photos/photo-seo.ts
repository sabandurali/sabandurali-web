import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import { getPhotoAlternateUrls, getPhotoUrl } from "@/content/photos/photo-routes";
import type { PublicPhoto, PublicPhotoTranslation } from "@/content/photos/types";

function absoluteImageUrl(src: string): string {
  return src.startsWith("https://") ? src : getAbsoluteUrl(src);
}

export function createPhotoMetadata(
  photo: PublicPhoto,
  translation: PublicPhotoTranslation | null,
): Metadata {
  const image = photo.seo.openGraphImage ?? photo.image;
  return {
    title: photo.seo.title,
    description: photo.seo.description,
    alternates: {
      canonical: getPhotoUrl(photo.slug, photo.language),
      languages: getPhotoAlternateUrls(photo, translation),
    },
    openGraph: {
      title: photo.seo.title,
      description: photo.seo.description,
      url: getPhotoUrl(photo.slug, photo.language),
      locale: photo.language === "tr" ? "tr_TR" : "en_US",
      images: [{ url: absoluteImageUrl(image.src), alt: image.alt }],
      type: "article",
    },
  };
}
