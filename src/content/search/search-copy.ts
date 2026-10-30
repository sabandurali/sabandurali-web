import type { SiteLocale } from "@/content/locales";
import type { SearchDocumentKind, SearchSourceName } from "./site-search";

export type SearchCopy = {
  metaTitle: string;
  metaDescription: string;
  crumb: string;
  eyebrow: string;
  title: string;
  lead: string;
  fieldLabel: string;
  fieldHint: string;
  submit: string;
  resultsHeading: (query: string, total: number) => string;
  noResults: (query: string) => string;
  noResultsNote: string;
  emptyQuery: string;
  groups: Record<SearchDocumentKind, string>;
  /** Shown next to a Turkish page on the English search. */
  inTurkish: string;
  unavailable: (sources: readonly SearchSourceName[]) => string;
  sourceNames: Record<SearchSourceName, string>;
};

/** "a", "a and b", "a, b and c", starting with a capital letter. */
function sentenceList(
  items: readonly string[],
  conjunction: string,
  locale: SiteLocale,
): string {
  const text =
    items.length <= 1
      ? items.join("")
      : `${items.slice(0, -1).join(", ")} ${conjunction} ${items.at(-1)}`;
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

export const searchCopy: Record<SiteLocale, SearchCopy> = {
  tr: {
    metaTitle: "Arama | Şaban Durali",
    metaDescription:
      "sabandurali.com'da ilçe rehberleri, makaleler, kitap incelemeleri ve fotoğraflar arasında arama yapın.",
    crumb: "Arama",
    eyebrow: "SİTE İÇİ ARAMA",
    title: "Sitede ara",
    lead: "İlçe rehberleri, makaleler, kitap incelemeleri, fotoğraflar ve çalışma alanları arasında arayın. Türkçe karakterli ya da karaktersiz yazabilirsiniz: “kadıköy” ve “kadikoy” aynı sonucu verir.",
    fieldLabel: "Aranacak kelimeler",
    fieldHint: "Örneğin bir ilçe adı, kitap ya da konu.",
    submit: "Ara",
    resultsHeading: (query, total) => `“${query}” için ${total} sonuç`,
    noResults: (query) => `“${query}” için sonuç bulunamadı.`,
    noResultsNote:
      "Daha kısa ya da farklı bir kelimeyle yeniden deneyin; ilçe adları ve kitap başlıkları en iyi sonucu verir.",
    emptyQuery: "Aramak için yukarıya bir kelime yazın.",
    groups: {
      district: "İlçe rehberleri",
      article: "Makaleler",
      "book-review": "Kitap incelemeleri",
      photo: "Fotoğraflar",
      workspace: "Çalışma alanları",
    },
    inTurkish: "Türkçe",
    unavailable: (sources) =>
      `${sentenceList(
        sources.map((source) => searchCopy.tr.sourceNames[source]),
        "ve",
        "tr",
      )} şu an aranamıyor; sonuçlar bunlar olmadan gösteriliyor.`,
    sourceNames: {
      articles: "makaleler",
      bookReviews: "kitap incelemeleri",
      photos: "fotoğraflar",
      districts: "ilçe rehberi özetleri",
    },
  },
  en: {
    metaTitle: "Search | Şaban Durali",
    metaDescription:
      "Search the district guides, articles, book reviews and photographs on sabandurali.com.",
    crumb: "Search",
    eyebrow: "SITE SEARCH",
    title: "Search the site",
    lead: "Search the articles, book reviews and photographs in English, and the Istanbul district guides (in Turkish). Turkish letters are optional: “kadıköy” and “kadikoy” find the same page.",
    fieldLabel: "Search terms",
    fieldHint: "For example a district, a book or a topic.",
    submit: "Search",
    resultsHeading: (query, total) =>
      `${total} ${total === 1 ? "result" : "results"} for “${query}”`,
    noResults: (query) => `No results for “${query}”.`,
    noResultsNote:
      "Try a shorter or different word; district names and book titles work best.",
    emptyQuery: "Type a word above to search.",
    groups: {
      district: "District guides (in Turkish)",
      article: "Articles",
      "book-review": "Book reviews",
      photo: "Photographs",
      workspace: "Work areas (in Turkish)",
    },
    inTurkish: "Turkish",
    unavailable: (sources) =>
      `${sentenceList(
        sources.map((source) => searchCopy.en.sourceNames[source]),
        "and",
        "en",
      )} cannot be searched right now; the results are shown without them.`,
    sourceNames: {
      articles: "articles",
      bookReviews: "book reviews",
      photos: "photographs",
      districts: "district guide summaries",
    },
  },
};
