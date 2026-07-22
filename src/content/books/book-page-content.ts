import type {
  BookReviewLanguage,
  ReadingStatus,
} from "@/content/books/types";

export type BookPageContent = {
  dateLocale: string;
  listEyebrow: string;
  listTitle: string;
  listDescription: string;
  emptyList: string;
  readReview: string;
  backToBooks: string;
  originalTitleLabel: string;
  authorsLabel: string;
  translatorLabel: string;
  publisherLabel: string;
  originalPublisherLabel: string;
  publicationYearLabel: string;
  originalPublicationYearLabel: string;
  editionLabel: string;
  pageCountLabel: string;
  isbn10Label: string;
  isbn13Label: string;
  categoryLabel: string;
  categoryFallback: string;
  ratingLabel: string;
  readingStatusLabel: string;
  startedLabel: string;
  completedLabel: string;
  publishedLabel: string;
  keyIdeasTitle: string;
  strengthsTitle: string;
  weaknessesTitle: string;
  whoShouldReadTitle: string;
  whoShouldNotReadTitle: string;
  applicationNotesTitle: string;
  actionLabel: string;
  personalEvaluationTitle: string;
  quotesTitle: string;
  quotePageLabel: string;
  quoteNoteLabel: string;
  translationLabel: string;
  translationAriaLabel: string;
  readingStatusLabels: Record<ReadingStatus, string>;
};

export const bookPageContent = {
  tr: {
    dateLocale: "tr-TR",
    listEyebrow: "KİTAP İNCELEMELERİ",
    listTitle: "Kitaplar",
    listDescription:
      "İş, psikoloji, öğrenme, yapay zekâ, satış, gayrimenkul ve kişisel gelişim alanlarında kitap incelemeleri.",
    emptyList: "Henüz yayımlanmış bir kitap incelemesi bulunmuyor.",
    readReview: "İncelemeyi oku",
    backToBooks: "Tüm kitaplara dön",
    originalTitleLabel: "Orijinal kitap adı",
    authorsLabel: "Yazarlar",
    translatorLabel: "Çevirmen",
    publisherLabel: "Yayınevi",
    originalPublisherLabel: "Orijinal yayınevi",
    publicationYearLabel: "Yayın yılı",
    originalPublicationYearLabel: "İlk yayın yılı",
    editionLabel: "Baskı",
    pageCountLabel: "Sayfa sayısı",
    isbn10Label: "ISBN-10",
    isbn13Label: "ISBN-13",
    categoryLabel: "Kategori",
    categoryFallback: "Kategorisiz",
    ratingLabel: "Puan",
    readingStatusLabel: "Okuma durumu",
    startedLabel: "Başlama tarihi",
    completedLabel: "Bitirme tarihi",
    publishedLabel: "İnceleme tarihi",
    keyIdeasTitle: "Temel fikirler",
    strengthsTitle: "Güçlü yönler",
    weaknessesTitle: "Zayıf yönler",
    whoShouldReadTitle: "Kimler okumalı",
    whoShouldNotReadTitle: "Kimler okumamalı",
    applicationNotesTitle: "Uygulama notları",
    actionLabel: "Uygulama adımı",
    personalEvaluationTitle: "Kişisel değerlendirme",
    quotesTitle: "Alıntılar",
    quotePageLabel: "Sayfa",
    quoteNoteLabel: "Not",
    translationLabel: "Read in English",
    translationAriaLabel: "Bu kitap incelemesinin İngilizce çevirisini oku",
    readingStatusLabels: {
      planned: "Planlandı",
      reading: "Okunuyor",
      completed: "Tamamlandı",
      paused: "Ara verildi",
      abandoned: "Yarım bırakıldı",
    },
  },
  en: {
    dateLocale: "en-GB",
    listEyebrow: "BOOK REVIEWS",
    listTitle: "Books",
    listDescription:
      "Book reviews on business, psychology, learning, artificial intelligence, sales, real estate and personal development.",
    emptyList: "There are no published book reviews yet.",
    readReview: "Read review",
    backToBooks: "Back to all books",
    originalTitleLabel: "Original title",
    authorsLabel: "Authors",
    translatorLabel: "Translator",
    publisherLabel: "Publisher",
    originalPublisherLabel: "Original publisher",
    publicationYearLabel: "Publication year",
    originalPublicationYearLabel: "Original publication year",
    editionLabel: "Edition",
    pageCountLabel: "Page count",
    isbn10Label: "ISBN-10",
    isbn13Label: "ISBN-13",
    categoryLabel: "Category",
    categoryFallback: "Uncategorised",
    ratingLabel: "Rating",
    readingStatusLabel: "Reading status",
    startedLabel: "Started",
    completedLabel: "Completed",
    publishedLabel: "Review date",
    keyIdeasTitle: "Key ideas",
    strengthsTitle: "Strengths",
    weaknessesTitle: "Weaknesses",
    whoShouldReadTitle: "Who should read it",
    whoShouldNotReadTitle: "Who should not read it",
    applicationNotesTitle: "Application notes",
    actionLabel: "Action",
    personalEvaluationTitle: "Personal evaluation",
    quotesTitle: "Quotes",
    quotePageLabel: "Page",
    quoteNoteLabel: "Note",
    translationLabel: "Türkçe oku",
    translationAriaLabel: "Read the Turkish translation of this book review",
    readingStatusLabels: {
      planned: "Planned",
      reading: "Reading",
      completed: "Completed",
      paused: "Paused",
      abandoned: "Abandoned",
    },
  },
} satisfies Record<BookReviewLanguage, BookPageContent>;

export function formatBookReviewDate(
  value: string | null | undefined,
  content: BookPageContent,
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
