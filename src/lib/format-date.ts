/**
 * The single date formatter for public pages. Servers render in UTC, so a
 * formatter without a time zone shows the previous calendar day for
 * everything stamped between 00:00 and 03:00 in Istanbul. Every date shown on
 * the site is therefore formatted in Europe/Istanbul.
 */
import type { SiteLocale } from "@/content/locales";
export const SITE_TIME_ZONE = "Europe/Istanbul";

export type DateLanguage = SiteLocale;

/** "tr" and "en" map to the site's date locales; full BCP 47 tags pass through. */
function resolveDateLocale(locale: string): string {
  if (locale === "tr") return "tr-TR";
  if (locale === "en") return "en-GB";
  return locale;
}

export type DateStyle = "long" | "medium" | "short";

const formatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, dateStyle: DateStyle) {
  const key = `${locale}|${dateStyle}`;
  let formatter = formatters.get(key);

  if (formatter === undefined) {
    formatter = new Intl.DateTimeFormat(locale, {
      dateStyle,
      timeZone: SITE_TIME_ZONE,
    });
    formatters.set(key, formatter);
  }

  return formatter;
}

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

/**
 * Formats a date for display in Europe/Istanbul. Returns null for missing or
 * invalid values so callers can render an explicit empty state.
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  locale: DateLanguage | (string & {}) = "tr",
  dateStyle: DateStyle = "long",
): string | null {
  if (value === null || value === undefined || value === "") return null;

  const date = toDate(value);
  if (date === null) return null;

  return getFormatter(resolveDateLocale(locale), dateStyle).format(date);
}

/** Machine-readable value for <time dateTime>, or null when invalid. */
export function toDateTimeAttribute(
  value: string | number | Date | null | undefined,
): string | null {
  if (value === null || value === undefined || value === "") return null;

  return toDate(value)?.toISOString() ?? null;
}
