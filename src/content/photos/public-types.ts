import type { SiteLocale } from "@/content/locales";

/*
 * What components receive for photos. The Payload mapper
 * (`payload-photo-mapper.ts`) is the only producer of these types from CMS
 * documents; components never see a Payload document.
 */

export type PublicPhotoImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type PublicPhotoCollection = {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
};

export type PublicPhotoTag = {
  id: string;
  title: string;
  slug: string;
};

export type PublicPhoto = {
  id: string;
  language: SiteLocale;
  title: string;
  slug: string;
  description: string | null;
  image: PublicPhotoImage;
  collections: PublicPhotoCollection[];
  tags: PublicPhotoTag[];
  takenAt: string | null;
  locationName: string | null;
  district: string | null;
  neighborhood: string | null;
  districtPhotoCategory: string | null;
  dayPeriod: string | null;
  photographer: string;
  creditLicense: string | null;
  exif: {
    camera: string | null;
    lens: string | null;
    focalLength: string | null;
    aperture: string | null;
    shutterSpeed: string | null;
    iso: string | null;
  };
  featured: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  seo: {
    title: string;
    description: string;
    openGraphImage: PublicPhotoImage | null;
  };
};

export type PublicPhotoTranslation = Pick<
  PublicPhoto,
  "id" | "language" | "title" | "slug"
>;

export type PublishedPhotoList = {
  photos: PublicPhoto[];
  collections: PublicPhotoCollection[];
  tags: PublicPhotoTag[];
  page: number;
  totalPages: number;
  totalItems: number;
};
