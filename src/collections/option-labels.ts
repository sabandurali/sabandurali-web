/**
 * Turkish admin labels of select options whose stored values are ASCII
 * slugs ("ulasim") or English codes ("in_review"). Only the label changes:
 * the stored values, and so the database enums, stay exactly as they are.
 *
 * Editorial codes the admin guide names (`published`, `archived`, …) stay
 * visible in parentheses, so the guide and the panel use the same words.
 */
import {
  BOOK_REVIEW_TRANSLATION_STATUSES,
  READING_STATUSES,
  REVIEW_STATUSES,
} from "@/content/books/constants";

type Option<T extends string> = { label: string; value: T };

function toOptions<T extends string>(
  values: readonly T[],
  labels: Readonly<Record<T, string>>,
): Array<Option<T>> {
  return values.map((value) => ({ label: labels[value], value }));
}

export const ARTICLE_NEWS_CATEGORIES = [
  "ulasim",
  "sehircilik",
  "belediye",
  "kultur",
  "yasam",
  "gayrimenkul",
  "egitim",
  "cevre",
  "onemli-yerel-gelismeler",
] as const;

export const articleNewsCategoryOptions = toOptions(ARTICLE_NEWS_CATEGORIES, {
  ulasim: "Ulaşım",
  sehircilik: "Şehircilik",
  belediye: "Belediye",
  kultur: "Kültür",
  yasam: "Yaşam",
  gayrimenkul: "Gayrimenkul",
  egitim: "Eğitim",
  cevre: "Çevre",
  "onemli-yerel-gelismeler": "Önemli yerel gelişmeler",
});

export const PHOTO_DISTRICT_CATEGORIES = [
  "mimari",
  "sokak",
  "tarih",
  "yasam",
  "ulasim",
  "doga",
  "gece",
] as const;

export const photoDistrictCategoryOptions = toOptions(
  PHOTO_DISTRICT_CATEGORIES,
  {
    mimari: "Mimari",
    sokak: "Sokak",
    tarih: "Tarih",
    yasam: "Yaşam",
    ulasim: "Ulaşım",
    doga: "Doğa",
    gece: "Gece",
  },
);

export const PHOTO_DAY_PERIODS = ["gunduz", "gece"] as const;

export const photoDayPeriodOptions = toOptions(PHOTO_DAY_PERIODS, {
  gunduz: "Gündüz",
  gece: "Gece",
});

export const PLANNING_STATUSES = [
  "teklif",
  "planlama",
  "belediye-meclisi-karari",
  "onay",
  "aski",
  "ihale",
  "insaat",
  "uygulama",
  "tamamlandi",
  "belirsiz",
] as const;

export const planningStatusOptions = toOptions(PLANNING_STATUSES, {
  teklif: "Teklif",
  planlama: "Planlama",
  "belediye-meclisi-karari": "Belediye Meclisi Kararı",
  onay: "Onay",
  aski: "Askı",
  ihale: "İhale",
  insaat: "İnşaat",
  uygulama: "Uygulama",
  tamamlandi: "Tamamlandı",
  belirsiz: "Belirsiz — Doğrulama gerekli",
});

export const readingStatusOptions = toOptions(READING_STATUSES, {
  planned: "Planlandı (planned)",
  reading: "Okunuyor (reading)",
  completed: "Tamamlandı (completed)",
  paused: "Ara verildi (paused)",
  abandoned: "Yarım bırakıldı (abandoned)",
});

export const reviewStatusOptions = toOptions(REVIEW_STATUSES, {
  draft: "Taslak (draft)",
  in_review: "İncelemede (in_review)",
  scheduled: "Planlandı (scheduled)",
  published: "Yayında — sitede görünür (published)",
  archived: "Arşivde — sitede gizli (archived)",
});

export const translationStatusOptions = toOptions(
  BOOK_REVIEW_TRANSLATION_STATUSES,
  {
    none: "Çeviri yok (none)",
    pending: "Bekliyor (pending)",
    in_progress: "Çevriliyor (in_progress)",
    completed: "Tamamlandı (completed)",
    outdated: "Güncel değil (outdated)",
  },
);
