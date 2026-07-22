import type {
  ArticleLanguage,
  SourceType,
} from "@/content/articles/types";

export type ArticlePageContent = {
  locale: ArticleLanguage;
  dateLocale: string;
  listEyebrow: string;
  listTitle: string;
  listDescription: string;
  emptyList: string;
  readArticle: string;
  backToArticles: string;
  publishedLabel: string;
  updatedLabel: string;
  authorLabel: string;
  categoryFallback: string;
  translationLabel: string;
  translationAriaLabel: string;
  sourcesTitle: string;
  sourceTypeLabel: string;
  sourceAuthorLabel: string;
  sourcePublishedLabel: string;
  sourceAccessedLabel: string;
  sourceLinkLabel: string;
  faqTitle: string;
  legalNoticeTitle: string;
  videoLinkLabel: string;
  downloadLabel: string;
  inlineFaqLabel: string;
  inlineSourcesLabel: string;
  sourceTypeLabels: Record<SourceType, string>;
};

export const articlePageContent = {
  tr: {
    locale: "tr",
    dateLocale: "tr-TR",
    listEyebrow: "YAYINLAR",
    listTitle: "Makaleler",
    listDescription:
      "Gayrimenkul, teknoloji, araştırma ve profesyonel gelişim üzerine güvenilir bilgi ve uygulanabilir analizler.",
    emptyList: "Henüz yayımlanmış bir makale bulunmuyor.",
    readArticle: "Makaleyi oku",
    backToArticles: "Tüm makalelere dön",
    publishedLabel: "Yayınlandı",
    updatedLabel: "Güncellendi",
    authorLabel: "Yazar",
    categoryFallback: "Kategorisiz",
    translationLabel: "Read in English",
    translationAriaLabel: "Bu makalenin İngilizce çevirisini oku",
    sourcesTitle: "Kaynaklar",
    sourceTypeLabel: "Kaynak türü",
    sourceAuthorLabel: "Yazar / kurum",
    sourcePublishedLabel: "Yayın tarihi",
    sourceAccessedLabel: "Erişim tarihi",
    sourceLinkLabel: "Kaynağı aç",
    faqTitle: "Sık Sorulan Sorular",
    legalNoticeTitle: "Önemli Bilgilendirme",
    videoLinkLabel: "Videoyu aç",
    downloadLabel: "Dosyayı indir",
    inlineFaqLabel: "İlgili sorular",
    inlineSourcesLabel: "İlgili kaynaklar",
    sourceTypeLabels: {
      official_institution: "Resmî kurum",
      academic_publication: "Akademik yayın",
      book: "Kitap",
      report: "Rapor",
      news: "Haber",
      website: "Web sitesi",
      legislation: "Mevzuat",
      interview: "Röportaj",
    },
  },
  en: {
    locale: "en",
    dateLocale: "en-GB",
    listEyebrow: "PUBLICATIONS",
    listTitle: "Articles",
    listDescription:
      "Reliable knowledge and actionable analysis on real estate, technology, research and professional development.",
    emptyList: "There are no published articles yet.",
    readArticle: "Read article",
    backToArticles: "Back to all articles",
    publishedLabel: "Published",
    updatedLabel: "Updated",
    authorLabel: "Author",
    categoryFallback: "Uncategorised",
    translationLabel: "Türkçe oku",
    translationAriaLabel: "Read the Turkish translation of this article",
    sourcesTitle: "Sources",
    sourceTypeLabel: "Source type",
    sourceAuthorLabel: "Author / institution",
    sourcePublishedLabel: "Published",
    sourceAccessedLabel: "Accessed",
    sourceLinkLabel: "Open source",
    faqTitle: "Frequently Asked Questions",
    legalNoticeTitle: "Important Notice",
    videoLinkLabel: "Open video",
    downloadLabel: "Download file",
    inlineFaqLabel: "Related questions",
    inlineSourcesLabel: "Related sources",
    sourceTypeLabels: {
      official_institution: "Official institution",
      academic_publication: "Academic publication",
      book: "Book",
      report: "Report",
      news: "News",
      website: "Website",
      legislation: "Legislation",
      interview: "Interview",
    },
  },
} satisfies Record<ArticleLanguage, ArticlePageContent>;

export function formatArticleDate(
  value: string | null | undefined,
  content: ArticlePageContent,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(content.dateLocale, {
    dateStyle: "long",
    timeZone: "Europe/Istanbul",
  }).format(date);
}
