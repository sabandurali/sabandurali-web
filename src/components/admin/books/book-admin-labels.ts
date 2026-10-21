import type {
  BookReviewLanguage,
  ReadingStatus,
  ReviewStatus,
} from "@/content/books/types";

export const BOOK_REVIEW_LANGUAGE_LABELS = {
  tr: "Türkçe",
  en: "İngilizce",
} as const satisfies Record<BookReviewLanguage, string>;

export const BOOK_READING_STATUS_LABELS = {
  planned: "Planlandı",
  reading: "Okunuyor",
  completed: "Tamamlandı",
  paused: "Ara verildi",
  abandoned: "Yarım bırakıldı",
} as const satisfies Record<ReadingStatus, string>;

export const BOOK_REVIEW_STATUS_LABELS = {
  draft: "Taslak",
  in_review: "İncelemede",
  scheduled: "Planlanmış",
  published: "Yayında",
  archived: "Arşivlenmiş",
} as const satisfies Record<ReviewStatus, string>;

const ADMIN_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function formatAdminBookReviewDate(value: string | null): string {
  if (value === null) {
    return "—";
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? ADMIN_DATE_FORMATTER.format(date)
    : "Geçersiz tarih";
}
