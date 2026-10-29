import type { SiteLocale } from "@/content/locales";

/** Locale of the built-in texts of the UI primitives: the site's locales. */
export type UiLocale = SiteLocale;

export type UiStrings = {
  skipToContent: string;
  breadcrumb: string;
  /** First breadcrumb item: the home page of the locale. */
  home: string;
  homePath: string;
  pagination: string;
  previousPage: string;
  nextPage: string;
  page: (page: number) => string;
  required: string;
  error: string;
  none: string;
  externalLink: string;
  newTab: string;
  sectionOf: (number: number, total?: number) => string;
  gridRef: string;
  line: string;
  source: (number: number) => string;
  relatedSources: string;
  photo: string;
  licence: string;
  originalSource: string;
  overview: (label: string) => string;
  fact: { indicator: string; value: string; date: string; source: string };
  map: {
    label: string;
    schematic: string;
    caption: string;
    featured: (name: string, ref: string) => string;
    featuredTile: string;
    europeCaps: string;
    asiaCaps: string;
    bosphorus: string;
    bosphorusCaps: string;
    count: (count: number) => string;
    north: string;
    legend: string;
    districtGuide: string;
    featuredLegend: (name: string) => string;
  };
};

const tr: UiStrings = {
  skipToContent: "İçeriğe geç",
  breadcrumb: "Konum",
  home: "Ana sayfa",
  homePath: "/",
  pagination: "Sayfalar",
  previousPage: "Önceki sayfa",
  nextPage: "Sonraki sayfa",
  page: (page) => `Sayfa ${page}`,
  required: "zorunlu",
  error: "Hata:",
  none: "yok",
  externalLink: "(dış bağlantı)",
  newTab: "(yeni sekmede açılır)",
  sectionOf: (number, total) =>
    total ? `Bölüm ${number}, ${total} bölümden` : `Bölüm ${number}`,
  gridRef: "Harita karesi",
  line: "hattı",
  source: (number) => `Kaynak ${number}`,
  relatedSources: "İlgili kaynaklar",
  photo: "Fotoğraf",
  licence: "Lisans",
  originalSource: "Kaynak",
  overview: (label) => `${label}: tümü`,
  fact: {
    indicator: "Gösterge",
    value: "Değer",
    date: "Veri tarihi",
    source: "Kaynak",
  },
  map: {
    label: "İstanbul ilçe haritası",
    schematic: "Şematik, ölçeksiz",
    caption:
      "Şematik, ölçeksiz İstanbul ilçe haritası: kareler ilçelerin yaklaşık yerleşimini gösterir; sınır, alan ve mesafe göstermez. F2 gibi kare adresleri sütun harfi ve satır numarasıdır.",
    featured: (name, ref) => `Öne çıkan rehber: ${name} (${ref}).`,
    featuredTile: "öne çıkan rehber",
    europeCaps: "AVRUPA YAKASI",
    asiaCaps: "ANADOLU YAKASI",
    bosphorus: "İstanbul Boğazı",
    bosphorusCaps: "İSTANBUL BOĞAZI",
    count: (count) => `${count} ilçe`,
    north: "Kuzey",
    legend: "Lejant",
    districtGuide: "İlçe rehberi",
    featuredLegend: (name) => `Öne çıkan: ${name}`,
  },
};

const en: UiStrings = {
  skipToContent: "Skip to content",
  breadcrumb: "Breadcrumb",
  home: "Home",
  homePath: "/en",
  pagination: "Pages",
  previousPage: "Previous page",
  nextPage: "Next page",
  page: (page) => `Page ${page}`,
  required: "required",
  error: "Error:",
  none: "none",
  externalLink: "(external link)",
  newTab: "(opens in a new tab)",
  sectionOf: (number, total) =>
    total ? `Section ${number} of ${total}` : `Section ${number}`,
  gridRef: "Map square",
  line: "line",
  source: (number) => `Source ${number}`,
  relatedSources: "Related sources",
  photo: "Photo",
  licence: "Licence",
  originalSource: "Source",
  overview: (label) => `${label}: overview`,
  fact: {
    indicator: "Indicator",
    value: "Value",
    date: "Data date",
    source: "Source",
  },
  map: {
    label: "Istanbul district map",
    schematic: "Schematic, not to scale",
    caption:
      "Schematic Istanbul district map, not to scale: squares show the approximate arrangement of the districts, not their borders, areas or distances. Square references such as F2 are a column letter and a row number.",
    featured: (name, ref) => `Featured guide: ${name} (${ref}).`,
    featuredTile: "featured guide",
    europeCaps: "EUROPEAN SIDE",
    asiaCaps: "ASIAN SIDE",
    bosphorus: "Bosphorus",
    bosphorusCaps: "BOSPHORUS",
    count: (count) => `${count} districts`,
    north: "North",
    legend: "Key",
    districtGuide: "District guide",
    featuredLegend: (name) => `Featured: ${name}`,
  },
};

const strings: Record<UiLocale, UiStrings> = { tr, en };

export function getUiStrings(locale: UiLocale = "tr"): UiStrings {
  return strings[locale];
}
