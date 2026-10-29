import type { SiteLocale } from "@/content/locales";
import { getSafePayloadMediaPath } from "@/content/articles/article-images";
import { getPositiveNumber, getText, isRecord } from "@/content/guards";

export type MediaLocale = SiteLocale;

export type MappedMediaImage = {
  src: string;
  alt: string;
  /**
   * Language of `alt`. The media document's own alt text is written in
   * Turkish (the CMS is Turkish); a localized alt or the fallback is in the
   * requested locale. English pages mark a Turkish alt with lang="tr".
   */
  altLanguage: MediaLocale;
  width: number | null;
  height: number | null;
  /** Media "Açıklama"; Turkish content only (the CMS field is Turkish). */
  caption: string | null;
  /** Media "Kaynak / telif"; every language (attribution is a licence term). */
  credit: string | null;
};

/**
 * Maps a populated Payload media document to public image data, or null when
 * it is not a safe, servable image (unpopulated relation, PDF, foreign URL).
 */
export function mapMediaImage(
  value: unknown,
  options: { alt?: unknown; fallbackAlt: string; locale: MediaLocale },
): MappedMediaImage | null {
  if (!isRecord(value)) return null;

  const mimeType = getText(value.mimeType);
  const src = getSafePayloadMediaPath(value.url);

  if (mimeType === null || !mimeType.startsWith("image/") || src === null) {
    return null;
  }

  const localizedAlt = getText(options.alt);
  const mediaAlt = localizedAlt === null ? getText(value.alt) : null;

  return {
    src,
    alt: localizedAlt ?? mediaAlt ?? options.fallbackAlt,
    altLanguage: mediaAlt === null ? options.locale : "tr",
    width: getPositiveNumber(value.width),
    height: getPositiveNumber(value.height),
    caption: options.locale === "tr" ? getText(value.description) : null,
    credit: getText(value.sourceCopyright),
  };
}

/** Credit line for a cover image: explicit credit, else owner/source + licence. */
export function getImageCredit(image: {
  credit?: string;
  copyrightOwner?: string;
  source?: string;
  license?: string;
}): string | null {
  const explicit = getText(image.credit);
  if (explicit !== null) return explicit;

  const parts = [
    getText(image.copyrightOwner) ?? getText(image.source),
    getText(image.license),
  ].filter((part): part is string => part !== null);

  return parts.length === 0 ? null : parts.join(" · ");
}
