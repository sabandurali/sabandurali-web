import { getUiStrings } from "@/components/ui/strings";
import type { SiteLocale } from "@/content/locales";

/**
 * Built-in texts of the publication pages that the content layer does not
 * provide (breadcrumbs, counts, filter and section labels). Plural forms:
 * Turkish nouns do not change after a number; English ones do.
 */
export type PublicationCopy = {
  home: string;
  homePath: string;
  allArticles: string;
  allBooks: string;
  allPhotos: string;
  articleCount: (count: number) => string;
  bookCount: (count: number) => string;
  photoCount: (count: number) => string;
  /** Name of a scrollable data table region that has no caption. */
  table: string;
  photos: {
    eyebrow: string;
    title: string;
    description: string;
    filtersTitle: string;
    collection: string;
    tag: string;
    all: string;
    filter: string;
    clearFilters: string;
    empty: string;
    emptyFiltered: string;
    pageOf: (page: number, total: number) => string;
    location: string;
    date: string;
    photographer: string;
    licence: string;
    tags: string;
    exif: string;
    details: string;
    related: string;
    camera: string;
    lens: string;
    focalLength: string;
    aperture: string;
    shutterSpeed: string;
    iso: string;
    translation: string;
    notFound: string;
  };
};

export const publicationCopy = {
  tr: {
    home: getUiStrings("tr").home,
    homePath: getUiStrings("tr").homePath,
    allArticles: "Tüm makaleler",
    allBooks: "Tüm kitap incelemeleri",
    allPhotos: "Fotoğraflar",
    articleCount: (count) => `${count} makale`,
    bookCount: (count) => `${count} kitap incelemesi`,
    photoCount: (count) => `${count} fotoğraf`,
    table: "Tablo",
    photos: {
      eyebrow: "FOTOĞRAFÇILIK",
      title: "Fotoğraf Hikâyeleri",
      description:
        "Şehir, insan ve hayvan hikâyelerinden seçilmiş fotoğraflar.",
      filtersTitle: "Fotoğrafları süz",
      collection: "Koleksiyon",
      tag: "Etiket",
      all: "Tümü",
      filter: "Süz",
      clearFilters: "Süzgeçleri temizle",
      empty: "Henüz yayımlanmış bir fotoğraf eklenmedi.",
      emptyFiltered: "Bu süzgeçlerle eşleşen yayımlanmış fotoğraf yok.",
      pageOf: (page, total) => `Sayfa ${page} / ${total}`,
      location: "Konum",
      date: "Çekim tarihi",
      photographer: "Fotoğrafçı",
      licence: "Kredi / lisans",
      tags: "Etiketler",
      exif: "Çekim bilgileri",
      details: "Fotoğraf bilgileri",
      related: "İlgili fotoğraflar",
      camera: "Kamera",
      lens: "Objektif",
      focalLength: "Odak uzaklığı",
      aperture: "Diyafram",
      shutterSpeed: "Enstantane",
      iso: "ISO",
      translation: "View in English",
      notFound: "Fotoğraf bulunamadı | Şaban Durali",
    },
  },
  en: {
    home: getUiStrings("en").home,
    homePath: getUiStrings("en").homePath,
    allArticles: "All articles",
    allBooks: "All book reviews",
    allPhotos: "Photographs",
    articleCount: (count) => `${count} ${count === 1 ? "article" : "articles"}`,
    bookCount: (count) =>
      `${count} ${count === 1 ? "book review" : "book reviews"}`,
    photoCount: (count) =>
      `${count} ${count === 1 ? "photograph" : "photographs"}`,
    table: "Table",
    photos: {
      eyebrow: "PHOTOGRAPHY",
      title: "Photo Stories",
      description: "Selected photographs from city, human and animal stories.",
      filtersTitle: "Filter photographs",
      collection: "Collection",
      tag: "Tag",
      all: "All",
      filter: "Filter",
      clearFilters: "Clear filters",
      empty: "No photographs have been published yet.",
      emptyFiltered: "No published photographs match these filters.",
      pageOf: (page, total) => `Page ${page} of ${total}`,
      location: "Location",
      date: "Date taken",
      photographer: "Photographer",
      licence: "Credit / licence",
      tags: "Tags",
      exif: "Camera details",
      details: "Photograph details",
      related: "Related photographs",
      camera: "Camera",
      lens: "Lens",
      focalLength: "Focal length",
      aperture: "Aperture",
      shutterSpeed: "Shutter speed",
      iso: "ISO",
      translation: "View in Turkish",
      notFound: "Photograph not found | Şaban Durali",
    },
  },
} as const satisfies Record<SiteLocale, PublicationCopy>;
