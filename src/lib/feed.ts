/**
 * Pure builders of the site's Atom feeds (`/feed.xml`, `/en/feed.xml`).
 *
 * The feed routes load the same published content the sitemap lists and
 * pass it here. Rules:
 *
 * - Only indexable, self-canonical items are entries (the sitemap's rule):
 *   articles and book reviews by `isArticleHreflangEligible` /
 *   `isBookReviewHreflangEligible`, every public photo.
 * - An entry's `published` is its publication date and `updated` its real
 *   last change (`getContentLastModified`). Dates are written as RFC 3339 in
 *   Europe/Istanbul, the time zone of every date the site shows.
 * - The feed's `updated` is its newest entry's; an empty feed uses the
 *   date it is given (the build or regeneration time), never a made-up one.
 * - Every text is XML-escaped; nothing is passed through as markup.
 */
import { getAbsoluteUrl } from "@/config/site";
import { getArticlePath } from "@/content/articles/article-routes";
import { isArticleHreflangEligible } from "@/content/articles/article-seo";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { getBookReviewPath } from "@/content/books/book-routes";
import { isBookReviewHreflangEligible } from "@/content/books/book-seo";
import type { PublicBookReviewSummary } from "@/content/books/public-types";
import { personalBrandName } from "@/content/entity-seo";
import type { SiteLocale } from "@/content/locales";
import { getPhotoPath } from "@/content/photos/photo-routes";
import type { PublicPhoto } from "@/content/photos/types";
import { getContentLastModified, getLatestDate } from "@/lib/content-dates";
import { SITE_TIME_ZONE } from "@/lib/format-date";
import { feedLinks } from "@/lib/metadata";

/** The feed of each language (announced on pages by `feedLinks`). */
export const feedPaths = {
  tr: feedLinks.tr.path,
  en: feedLinks.en.path,
} as const satisfies Record<SiteLocale, string>;

export const feedContentType = "application/atom+xml; charset=utf-8";

/** At most this many newest entries; older items stay in the sitemap. */
export const feedEntryLimit = 50;

export type FeedEntryKind = "article" | "book-review" | "photo";

export type FeedEntry = {
  kind: FeedEntryKind;
  title: string;
  /** Site path of the item. */
  path: string;
  summary: string | null;
  published: Date;
  updated: Date;
  /** Shown only when someone other than the site owner wrote the item. */
  author: string | null;
};

const feedTexts = {
  tr: {
    title: feedLinks.tr.title,
    subtitle:
      "Makaleler, kitap incelemeleri ve fotoğraflar: sabandurali.com'da yeni yayımlananlar.",
    kinds: {
      article: "Makale",
      "book-review": "Kitap incelemesi",
      photo: "Fotoğraf",
    },
  },
  en: {
    title: feedLinks.en.title,
    subtitle:
      "Articles, book reviews and photographs newly published on sabandurali.com.",
    kinds: {
      article: "Article",
      "book-review": "Book review",
      photo: "Photograph",
    },
  },
} as const satisfies Record<
  SiteLocale,
  { title: string; subtitle: string; kinds: Record<FeedEntryKind, string> }
>;

export function getFeedTexts(locale: SiteLocale) {
  return feedTexts[locale];
}

/** Whether XML 1.0 allows a character at all (tab, newlines and text). */
function isXmlCharacter(character: string): boolean {
  const code = character.codePointAt(0) ?? 0;
  return (
    code === 0x09 ||
    code === 0x0a ||
    code === 0x0d ||
    (code >= 0x20 &&
      !(code >= 0xd800 && code <= 0xdfff) &&
      code !== 0xfffe &&
      code !== 0xffff)
  );
}

/** Escapes text for XML element content and attribute values. */
export function escapeXml(value: string): string {
  return Array.from(value)
    .filter(isXmlCharacter)
    .join("")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const istanbulParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: SITE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

/**
 * An RFC 3339 timestamp of `date` in Europe/Istanbul with its UTC offset,
 * e.g. "2026-05-01T12:00:00+03:00".
 */
export function toIstanbulRfc3339(date: Date): string {
  const parts = Object.fromEntries(
    istanbulParts
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  const year = parts.year ?? 0;
  const month = parts.month ?? 1;
  const day = parts.day ?? 1;
  const hour = parts.hour ?? 0;
  const minute = parts.minute ?? 0;
  const second = parts.second ?? 0;
  const wallClock = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMinutes = Math.round(
    (wallClock - Math.floor(date.getTime() / 1000) * 1000) / 60000,
  );
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

function toDate(value: string | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function entry(
  kind: FeedEntryKind,
  item: { title: string; publishedAt: string | null; updatedAt: string | null },
  path: string,
  summary: string | null,
  author: string | null,
): FeedEntry[] {
  const published = toDate(item.publishedAt);
  if (published === null) return [];
  return [
    {
      kind,
      title: item.title,
      path,
      summary: summary?.trim() || null,
      published,
      updated: getContentLastModified(item) ?? published,
      author: author?.trim() || null,
    },
  ];
}

export type FeedContent = {
  articles: readonly PublicArticleSummary[];
  bookReviews: readonly PublicBookReviewSummary[];
  photos: readonly PublicPhoto[];
};

/**
 * The entries of `locale`'s feed, newest publication first, at most
 * `feedEntryLimit`.
 */
export function collectFeedEntries(
  locale: SiteLocale,
  content: FeedContent,
): FeedEntry[] {
  const entries = [
    ...content.articles
      .filter(
        (article) =>
          article.language === locale && isArticleHreflangEligible(article),
      )
      .flatMap((article) =>
        entry(
          "article",
          article,
          getArticlePath(article.slug, article.language),
          article.summary,
          article.author ?? null,
        ),
      ),
    ...content.bookReviews
      .filter(
        (bookReview) =>
          bookReview.language === locale &&
          isBookReviewHreflangEligible(bookReview),
      )
      .flatMap((bookReview) =>
        entry(
          "book-review",
          bookReview,
          getBookReviewPath(bookReview.slug, bookReview.language),
          bookReview.summary,
          null,
        ),
      ),
    ...content.photos
      .filter((photo) => photo.language === locale)
      .flatMap((photo) =>
        entry(
          "photo",
          photo,
          getPhotoPath(photo.slug, photo.language),
          photo.description ?? photo.seo.description,
          null,
        ),
      ),
  ];

  return entries
    .sort(
      (a, b) =>
        b.published.getTime() - a.published.getTime() ||
        a.path.localeCompare(b.path),
    )
    .slice(0, feedEntryLimit);
}

/**
 * The Atom document of `locale`'s feed. `fallbackUpdated` dates a feed
 * without entries (Atom requires an `updated` element).
 */
export function buildAtomFeed(
  locale: SiteLocale,
  entries: readonly FeedEntry[],
  fallbackUpdated: Date,
): string {
  const texts = feedTexts[locale];
  const selfUrl = getAbsoluteUrl(feedPaths[locale]);
  const homeUrl = getAbsoluteUrl(locale === "tr" ? "/" : "/en");
  const updated =
    getLatestDate(entries.map((item) => item.updated)) ?? fallbackUpdated;
  const language = locale === "tr" ? "tr-TR" : "en";

  const lines = [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${language}">`,
    `  <id>${escapeXml(selfUrl)}</id>`,
    `  <title>${escapeXml(texts.title)}</title>`,
    `  <subtitle>${escapeXml(texts.subtitle)}</subtitle>`,
    `  <link rel="self" type="application/atom+xml" href="${escapeXml(selfUrl)}"/>`,
    `  <link rel="alternate" type="text/html" hreflang="${language}" href="${escapeXml(homeUrl)}"/>`,
    `  <updated>${toIstanbulRfc3339(updated)}</updated>`,
    `  <author><name>${escapeXml(personalBrandName)}</name><uri>${escapeXml(getAbsoluteUrl("/"))}</uri></author>`,
    ...entries.flatMap((item) => {
      const url = getAbsoluteUrl(item.path);
      return [
        `  <entry>`,
        `    <id>${escapeXml(url)}</id>`,
        `    <title>${escapeXml(item.title)}</title>`,
        `    <link rel="alternate" type="text/html" href="${escapeXml(url)}"/>`,
        `    <published>${toIstanbulRfc3339(item.published)}</published>`,
        `    <updated>${toIstanbulRfc3339(item.updated)}</updated>`,
        ...(item.author === null
          ? []
          : [`    <author><name>${escapeXml(item.author)}</name></author>`]),
        `    <category term="${item.kind}" label="${escapeXml(texts.kinds[item.kind])}"/>`,
        ...(item.summary === null
          ? []
          : [`    <summary>${escapeXml(item.summary)}</summary>`]),
        `  </entry>`,
      ];
    }),
    `</feed>`,
    ``,
  ];
  return lines.join("\n");
}
