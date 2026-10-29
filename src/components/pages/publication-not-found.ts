import type { Metadata } from "next";
import { getUiStrings, type UiLocale } from "@/components/ui/strings";

export type PublicationKind = "article" | "bookReview" | "photo";

/**
 * Metadata of a publication detail page whose slug matches nothing: a
 * localized title and no indexing. Shared by the Turkish and English
 * routes (`publication-routes.tsx`), so both languages change together.
 */
export function publicationNotFoundMetadata(
  kind: PublicationKind,
  locale: UiLocale,
): Metadata {
  return {
    title: `${getUiStrings(locale).notFound[kind]} | Şaban Durali`,
    robots: { index: false, follow: false },
  };
}
