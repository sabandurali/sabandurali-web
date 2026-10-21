import { getAbsoluteUrl } from "@/config/site";
import type {
  PublicPhoto,
  PublicPhotoTranslation,
  PhotoLanguage,
} from "@/content/photos/types";

export const photoListPaths = {
  tr: "/fotograflar",
  en: "/en/photography",
} as const satisfies Record<PhotoLanguage, string>;

export const photoListUrls = {
  "tr-TR": getAbsoluteUrl(photoListPaths.tr),
  en: getAbsoluteUrl(photoListPaths.en),
  "x-default": getAbsoluteUrl(photoListPaths.tr),
} as const;

export function getPhotoPath(slug: string, language: PhotoLanguage): string {
  return `${photoListPaths[language]}/${slug}`;
}

export function getPhotoUrl(slug: string, language: PhotoLanguage): string {
  return getAbsoluteUrl(getPhotoPath(slug, language));
}

export function getPhotoLanguagePaths(
  photo: PublicPhoto,
  translation: PublicPhotoTranslation | null,
): Record<PhotoLanguage, string> {
  const paths: Record<PhotoLanguage, string> = {
    tr: photoListPaths.tr,
    en: photoListPaths.en,
  };
  paths[photo.language] = getPhotoPath(photo.slug, photo.language);
  if (translation !== null) {
    paths[translation.language] = getPhotoPath(
      translation.slug,
      translation.language,
    );
  }
  return paths;
}

export function getPhotoAlternateUrls(
  photo: PublicPhoto,
  translation: PublicPhotoTranslation | null,
): Record<string, string> {
  const urls: Record<string, string> = {
    [photo.language === "tr" ? "tr-TR" : "en"]: getPhotoUrl(
      photo.slug,
      photo.language,
    ),
  };
  if (translation !== null) {
    urls[translation.language === "tr" ? "tr-TR" : "en"] = getPhotoUrl(
      translation.slug,
      translation.language,
    );
  }
  urls["x-default"] = urls["tr-TR"] ?? getPhotoUrl(photo.slug, photo.language);
  return urls;
}
