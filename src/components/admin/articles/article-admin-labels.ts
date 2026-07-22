import type {
  ArticleLanguage,
  ArticleStatus,
  ArticleVisibility,
} from "@/content/articles/types";

export const ARTICLE_LANGUAGE_LABELS = {
  tr: "Türkçe",
  en: "İngilizce",
} as const satisfies Record<ArticleLanguage, string>;

export const ARTICLE_STATUS_LABELS = {
  draft: "Taslak",
  in_review: "İncelemede",
  scheduled: "Planlanmış",
  published: "Yayında",
  archived: "Arşivlenmiş",
} as const satisfies Record<ArticleStatus, string>;

export const ARTICLE_VISIBILITY_LABELS = {
  public: "Public",
  private: "Private",
  unlisted: "Liste dışı",
  members_only: "Yalnızca üyeler",
} as const satisfies Record<ArticleVisibility, string>;

const ADMIN_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function formatAdminArticleDate(value: string | null): string {
  if (value === null) {
    return "—";
  }

  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? ADMIN_DATE_FORMATTER.format(date)
    : "Geçersiz tarih";
}
