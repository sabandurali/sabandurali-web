import type { SiteLocale } from "@/lib/metadata";

/**
 * Interface text of the home page that is not CMS content: section labels,
 * empty states and link labels. Titles and body text come from the content
 * layer (homeContent, the CMS home record, the published collections).
 */
export type HomeCopy = {
  heroFactsLabel: string;
  atlas: {
    number: string;
    eyebrow: string;
    title: string;
    description: string;
    allDistricts: string;
    /** Extra map caption: where the guides are and in which language. */
    caption: string | null;
    featuredHeading: string;
    featuredEmpty: string;
    featuredEmptyNote: string;
    guideCta: string;
    summaryLanguageNote: string | null;
  };
  articles: { number: string; eyebrow: string; empty: string };
  books: { number: string; eyebrow: string; empty: string };
  photos: { number: string; eyebrow: string; empty: string };
  workspaces: { number: string };
  about: { portraitCaption: string };
  licence: string;
};

export const homeCopy = {
  tr: {
    heroFactsLabel: "Platform özeti",
    atlas: {
      number: "01",
      eyebrow: "İSTANBUL ATLASI",
      title: "39 ilçe, tek atlas.",
      description:
        "İstanbul’un Avrupa ve Anadolu yakalarındaki 39 ilçesi şematik bir kare haritada. Her kare o ilçenin rehberine açılır; rehberler kaynakları ve veri tarihleriyle birlikte yayımlanır.",
      allDistricts: "Tüm ilçeler",
      caption: null,
      featuredHeading: "Öne çıkan rehber",
      featuredEmpty: "Öne çıkan ilçe rehberi henüz yayımlanmadı.",
      featuredEmptyNote:
        "Rehberler yayımlandıkça burada öne çıkan ilçe ve özeti görünür; haritadaki kareler ilçe sayfalarına açılır.",
      guideCta: "Rehberi aç",
      summaryLanguageNote: null,
    },
    articles: {
      number: "02",
      eyebrow: "MAKALELER",
      empty: "Henüz yayımlanmış makale yok.",
    },
    books: {
      number: "03",
      eyebrow: "KİTAPLAR",
      empty: "Henüz yayımlanmış kitap incelemesi yok.",
    },
    photos: {
      number: "04",
      eyebrow: "FOTOĞRAFLAR",
      empty: "Henüz yayımlanmış fotoğraf yok.",
    },
    workspaces: { number: "05" },
    about: { portraitCaption: "Şaban Durali" },
    licence: "Lisans",
  },
  en: {
    heroFactsLabel: "Platform at a glance",
    atlas: {
      number: "01",
      eyebrow: "ISTANBUL ATLAS",
      title: "39 districts, one atlas.",
      description:
        "Istanbul’s 39 districts on the European and Asian sides, drawn as a schematic tile map. Each tile opens that district’s guide; guides are published with their sources and data dates.",
      allDistricts: "All districts (in Turkish)",
      caption: "District guides are published in Turkish.",
      featuredHeading: "Featured guide",
      featuredEmpty: "No district guide has been published yet.",
      featuredEmptyNote:
        "Once guides are published, the featured district and its summary appear here; the tiles on the map open the district pages.",
      guideCta: "Open the guide",
      summaryLanguageNote: "Guide and summary in Turkish.",
    },
    articles: {
      number: "02",
      eyebrow: "ARTICLES",
      empty: "No articles have been published yet.",
    },
    books: {
      number: "03",
      eyebrow: "BOOKS",
      empty: "No book reviews have been published yet.",
    },
    photos: {
      number: "04",
      eyebrow: "PHOTOGRAPHY",
      empty: "No photographs have been published yet.",
    },
    workspaces: { number: "05" },
    about: { portraitCaption: "Şaban Durali" },
    licence: "Licence",
  },
} as const satisfies Record<SiteLocale, HomeCopy>;
