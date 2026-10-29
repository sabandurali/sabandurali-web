import type { SiteLocale } from "@/content/locales";

export type PhotoLanguage = SiteLocale;

/** The public photo types live in `public-types.ts`. */
export type {
  PublicPhoto,
  PublicPhotoCollection,
  PublicPhotoImage,
  PublicPhotoTag,
  PublicPhotoTranslation,
  PublishedPhotoList,
} from "@/content/photos/public-types";

export type PhotoListFilters = {
  collection?: string;
  tag?: string;
  page?: number;
};
