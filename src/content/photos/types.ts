export type PhotoLanguage = "tr" | "en";

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
  language: PhotoLanguage;
  title: string;
  slug: string;
  description: string | null;
  image: PublicPhotoImage;
  collections: PublicPhotoCollection[];
  tags: PublicPhotoTag[];
  takenAt: string | null;
  locationName: string | null;
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

export type PhotoListFilters = {
  collection?: string;
  tag?: string;
  page?: number;
};

export type PublishedPhotoList = {
  photos: PublicPhoto[];
  collections: PublicPhotoCollection[];
  tags: PublicPhotoTag[];
  page: number;
  totalPages: number;
  totalItems: number;
};
