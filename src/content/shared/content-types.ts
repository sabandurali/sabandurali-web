import type { SiteLocale } from "@/content/locales";

/**
 * Types shared by several content types (articles and book reviews today).
 * They live here, not in one type's module, so content types do not depend
 * on each other.
 */

export type TranslationStatus =
  "none" | "pending" | "in_progress" | "completed" | "outdated";

export type CoverImage = {
  src: string;
  alt: string;
  /** Set only when `alt` is not in the content's language (Turkish media alt
   * on an English page); render the image with this `lang`. */
  altLanguage?: SiteLocale;
  caption?: string;
  source?: string;
  copyrightOwner?: string;
  license?: string;
  /** Display credit; see getImageCredit() in src/content/media.ts. */
  credit?: string;
  width: number;
  height: number;
};

export type ContentSeo = {
  title: string;
  description: string;
  canonical?: string;
  index: boolean;
  follow: boolean;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
};

export type ValidationIssue = {
  code: string;
  path: string;
  message: string;
};

export const TRANSLATION_STATUSES = [
  "none",
  "pending",
  "in_progress",
  "completed",
  "outdated",
] as const satisfies ReadonlyArray<TranslationStatus>;

export const SEO_DESCRIPTION_RECOMMENDED_LENGTH = {
  min: 140,
  max: 160,
} as const;
