/**
 * Slug of the legacy Turkish home: a standard page that `/` falls back to
 * when no "Ana sayfa" record exists. `next.config.ts` redirects
 * `/ana-sayfa` to `/` unconditionally, so whether or not this record is the
 * served home, its public address is `/`: no link, static param or sitemap
 * entry may name `/ana-sayfa`. The Pages collection reserves the same slug
 * (`LEGACY_TURKISH_HOME_SLUG` in `src/collections/Pages.ts`).
 */
export const LEGACY_TURKISH_HOME_SLUG = "ana-sayfa";

/** Whether a page record is the legacy Turkish home record. */
export function isLegacyTurkishHome(page: {
  language: unknown;
  slug: unknown;
}): boolean {
  return page.language === "tr" && page.slug === LEGACY_TURKISH_HOME_SLUG;
}

/** The pages served at `/<slug>`: all but the legacy Turkish home record. */
export function excludeLegacyTurkishHome<
  T extends { language: unknown; slug: unknown },
>(pages: readonly T[]): T[] {
  return pages.filter((page) => !isLegacyTurkishHome(page));
}
