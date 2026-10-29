import { SITE_TIME_ZONE } from "@/lib/format-date";

/** The calendar year of `now` in Istanbul (31 Dec 22:00 UTC is already 1 Jan). */
export function istanbulYear(now: Date): number {
  const year = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
  }).format(now);
  return Number(year);
}

/**
 * The footer copyright line with the current Istanbul year. The content
 * keeps a sample year ("© 2026 …"); the year after "©" is replaced at
 * render time, so the line never goes stale. Pages are regenerated at least
 * hourly (ISR), which carries the new year over on 1 January. A line
 * without "© <year>" is returned unchanged.
 */
export function withCurrentYear(copyright: string, now: Date): string {
  return copyright.replace(/©\s*\d{4}/, `© ${istanbulYear(now)}`);
}
