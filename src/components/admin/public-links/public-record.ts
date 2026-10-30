/**
 * Where and when a CMS record appears on the public site (ADM-PUBLIC-LINKS).
 * Pure: the admin sidebar field passes the published document (read with
 * `locale: "all"`, so localized fields arrive as `{ tr, en }`) and the time.
 *
 * Paths come from the same route helpers as the public pages, so the admin
 * never invents a URL the site does not serve.
 */
import { getArticlePath } from "@/content/articles/article-routes";
import { getBookReviewPath } from "@/content/books/book-routes";
import {
  getDistrictNewsPath,
  getDistrictPath,
} from "@/content/districts/district-routes";
import { getDistrict } from "@/content/districts/district-registry";
import { getText, isPublishedBy, isRecord } from "@/content/guards";
import { isSiteLocale, siteLocales, type SiteLocale } from "@/content/locales";
import { isLegacyTurkishHome } from "@/content/pages/legacy-home";
import { getPhotoPath } from "@/content/photos/photo-routes";
import { SITE_TIME_ZONE } from "@/lib/format-date";

export const PUBLIC_RECORD_COLLECTIONS = [
  "articles",
  "books",
  "district-guides",
  "pages",
  "photos",
] as const;

export type PublicRecordCollection = (typeof PUBLIC_RECORD_COLLECTIONS)[number];

export function isPublicRecordCollection(
  value: unknown,
): value is PublicRecordCollection {
  return PUBLIC_RECORD_COLLECTIONS.some((slug) => slug === value);
}

export type PublicRecordState =
  | { kind: "draft" }
  | { kind: "scheduled"; publishedAt: string }
  | { kind: "live"; publishedAt: string }
  /** Published, but a rule of its own keeps it off the site. */
  | { kind: "hidden"; reason: string };

export type PublicRecordLink = Readonly<{
  locale: SiteLocale;
  path: string;
}>;

/** A localized value read with `locale: "all"`, or a plain value. */
function localizedText(value: unknown, locale: SiteLocale): string | null {
  return isRecord(value) ? getText(value[locale]) : getText(value);
}

function hasFutureDate(value: unknown, now: Date): value is string {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > now.getTime();
}

/** Why a published book review stays off the site, if it does. */
function getBookHiddenReason(doc: Record<string, unknown>): string | null {
  if (doc.reviewStatus !== "published") {
    return "İnceleme durumu “Yayında — sitede görünür (published)” değil; inceleme sitede gizli.";
  }
  if (!isRecord(doc.seo) || doc.seo.index !== true) {
    return "“Arama motorlarında indeksle” kapalı; inceleme sitede gizli.";
  }
  return null;
}

/**
 * Public state of the published version: on the site now, scheduled for a
 * later date, hidden by a rule of its own, or not published at all.
 */
export function getPublicRecordState(
  collection: PublicRecordCollection,
  doc: unknown,
  now: Date,
): PublicRecordState {
  if (!isRecord(doc) || doc._status !== "published") return { kind: "draft" };

  if (hasFutureDate(doc.publishedAt, now)) {
    return { kind: "scheduled", publishedAt: doc.publishedAt };
  }
  if (!isPublishedBy(doc.publishedAt, now)) return { kind: "draft" };

  if (collection === "books") {
    const reason = getBookHiddenReason(doc);
    if (reason !== null) return { kind: "hidden", reason };
  }
  if (
    collection === "pages" &&
    doc.pageType === "standard" &&
    doc.language === "en"
  ) {
    return {
      kind: "hidden",
      reason: "İngilizce standart sayfaların henüz bir site adresi yok.",
    };
  }

  return { kind: "live", publishedAt: doc.publishedAt };
}

function getArticleLinks(doc: Record<string, unknown>): PublicRecordLink[] {
  if (doc.articleType === "district-news") {
    // District news have no page of their own; they are listed on the
    // district's news page.
    const district = getText(doc.district);
    return district !== null && getDistrict(district) !== null
      ? [{ locale: "tr", path: getDistrictNewsPath(district) }]
      : [];
  }
  // The public lists need the title, slug and excerpt in a locale.
  return siteLocales.flatMap((locale): PublicRecordLink[] => {
    const slug = localizedText(doc.slug, locale);
    return slug !== null &&
      localizedText(doc.title, locale) !== null &&
      localizedText(doc.excerpt, locale) !== null
      ? [{ locale, path: getArticlePath(slug, locale) }]
      : [];
  });
}

function getPhotoLinks(doc: Record<string, unknown>): PublicRecordLink[] {
  // Same rule as the photo detail page: title and alt text in the locale.
  return siteLocales.flatMap((locale): PublicRecordLink[] => {
    const slug = localizedText(doc.slug, locale);
    return slug !== null &&
      localizedText(doc.title, locale) !== null &&
      localizedText(doc.altText, locale) !== null
      ? [{ locale, path: getPhotoPath(slug, locale) }]
      : [];
  });
}

function getPageLinks(doc: Record<string, unknown>): PublicRecordLink[] {
  const language = doc.language;
  if (!isSiteLocale(language)) return [];
  if (doc.pageType === "home") {
    return [{ locale: language, path: language === "en" ? "/en" : "/" }];
  }
  const slug = getText(doc.slug);
  // Only Turkish standard pages have a public route.
  if (doc.pageType !== "standard" || language !== "tr" || slug === null) {
    return [];
  }
  return [
    {
      locale: "tr",
      path: isLegacyTurkishHome({ language, slug }) ? "/" : `/${slug}`,
    },
  ];
}

/**
 * The public paths of a record, one per locale it can appear in. Empty when
 * the record has no public page of its own.
 */
export function getPublicRecordLinks(
  collection: PublicRecordCollection,
  doc: unknown,
): PublicRecordLink[] {
  if (!isRecord(doc)) return [];

  switch (collection) {
    case "articles":
      return getArticleLinks(doc);
    case "photos":
      return getPhotoLinks(doc);
    case "pages":
      return getPageLinks(doc);
    case "books": {
      const language = doc.language;
      const slug = getText(doc.slug);
      return isSiteLocale(language) && slug !== null
        ? [{ locale: language, path: getBookReviewPath(slug, language) }]
        : [];
    }
    case "district-guides": {
      // District guides are published in Turkish only.
      const district = getText(doc.district);
      return district !== null && getDistrict(district) !== null
        ? [{ locale: "tr", path: getDistrictPath(district) }]
        : [];
    }
  }
}

const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: SITE_TIME_ZONE,
});

/** "12 Kasım 2026 09:30" in Europe/Istanbul, or null for an invalid value. */
export function formatAdminDateTime(value: string): string | null {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? dateTimeFormatter.format(new Date(timestamp))
    : null;
}
