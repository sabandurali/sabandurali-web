/**
 * One builder for page metadata.
 *
 * Every indexable page should get its `Metadata` from `createPageMetadata` so
 * that the canonical URL, the hreflang pairs, Open Graph and the Twitter card
 * are always emitted together and stay consistent with the sitemap, which uses
 * the same `createLanguageAlternates` helper.
 *
 * Social images:
 * - Without an image the site-wide 1200×630 image is used.
 * - An image an editor prepared for sharing (a "social image" field) is used
 *   as uploaded: `createSocialImage`.
 * - A content image reused for sharing (a photo, a district photo, an
 *   article's featured image) can be several megabytes and too large for
 *   WhatsApp, LinkedIn or X previews, so it is served through the Next.js
 *   image optimizer at 1200 px wide: `createOptimizedSocialImage`.
 */
import type { Metadata } from "next";
import { getAbsoluteUrl, siteSocialImage } from "@/config/site";

export const siteName = "Şaban Durali";

/** Search engines show about 60 title and 160 description characters. */
export const metaTitleMaxLength = 60;
export const metaDescriptionMaxLength = 160;

export type SiteLocale = "tr" | "en";

/** Locales in hreflang order; the first available one is `x-default`. */
export const siteLocales = [
  "tr",
  "en",
] as const satisfies readonly SiteLocale[];

export type LocalizedPaths = Partial<Record<SiteLocale, string>>;

const hreflangByLocale = {
  tr: "tr-TR",
  en: "en",
} as const satisfies Record<SiteLocale, string>;

const openGraphLocaleByLocale = {
  tr: "tr_TR",
  en: "en_US",
} as const satisfies Record<SiteLocale, string>;

export function getHreflang(locale: SiteLocale): string {
  return hreflangByLocale[locale];
}

export function getOpenGraphLocale(locale: SiteLocale): string {
  return openGraphLocaleByLocale[locale];
}

/** A site path ("/iletisim") or an absolute URL, returned as an absolute URL. */
export function toAbsoluteUrl(pathOrUrl: string): string {
  return getAbsoluteUrl(pathOrUrl);
}

/**
 * hreflang pairs for the published language versions of one page.
 *
 * Every version lists itself and its siblings (`tr-TR`, `en`). `x-default`
 * points to the Turkish version and is added only when more than one
 * language version exists.
 */
export function createLanguageAlternates(
  paths: LocalizedPaths,
): Record<string, string> {
  const languages: Record<string, string> = {};
  const available = siteLocales.filter((locale) => paths[locale] !== undefined);

  for (const locale of available) {
    const path = paths[locale];
    if (path !== undefined) {
      languages[getHreflang(locale)] = toAbsoluteUrl(path);
    }
  }

  const defaultLocale = available[0];
  if (available.length > 1 && defaultLocale !== undefined) {
    languages["x-default"] = languages[getHreflang(defaultLocale)];
  }

  return languages;
}

export type SocialImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export type SocialImageSource = {
  /** A site path ("/brand/x.jpg", "/api/media/file/x.jpg") or an https URL. */
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

/** The shared 1200×630 JPEG used when a page has no image of its own. */
export const defaultSocialImage: SocialImage = siteSocialImage;

function isPositiveDimension(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value > 0;
}

function getImageSize(
  image: SocialImageSource,
): { width: number; height: number } | null {
  const { width, height } = image;
  return isPositiveDimension(width) && isPositiveDimension(height)
    ? { width, height }
    : null;
}

/** An image prepared for sharing, used exactly as uploaded. */
export function createSocialImage(image: SocialImageSource): SocialImage {
  return {
    url: toAbsoluteUrl(image.src),
    alt: image.alt,
    ...getImageSize(image),
  };
}

/**
 * Width and quality of optimized social images. 1200 is one of the default
 * `images.deviceSizes` and 75 the default `images.qualities` entry, so the
 * optimizer accepts the URL (see metadata.test.ts).
 */
export const socialImageWidth = 1200;
export const socialImageQuality = 75;

/** Path of the Next.js image optimizer for `src` at the social image width. */
export function getOptimizedSocialImagePath(src: string): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${socialImageWidth}&q=${socialImageQuality}`;
}

/**
 * A content image reused for sharing, resized by the Next.js image optimizer
 * to at most 1200 px wide (it never enlarges). Only site paths are optimized:
 * they are covered by `images.localPatterns` in next.config.ts, while remote
 * hosts may be restricted there, so an https source is used as it is.
 */
export function createOptimizedSocialImage(
  image: SocialImageSource,
): SocialImage {
  if (!image.src.startsWith("/") || image.src.startsWith("//")) {
    return createSocialImage(image);
  }

  const source = getImageSize(image);
  const width =
    source === null ? null : Math.min(socialImageWidth, source.width);
  const height =
    source === null || width === null
      ? null
      : Math.max(1, Math.round((width * source.height) / source.width));

  return {
    url: toAbsoluteUrl(getOptimizedSocialImagePath(image.src)),
    alt: image.alt,
    ...(width === null || height === null ? {} : { width, height }),
  };
}

/**
 * Shortens generated text (for example a district summary) to a meta
 * description of at most `maxLength` characters. Whole sentences are kept
 * when at least one fits; otherwise the text is cut at a word boundary and
 * ends with "…". Ordinals ("19. yüzyıl") and regnal numbers ("II. Mahmut")
 * are not treated as sentence ends.
 */
export function truncateMetaDescription(
  text: string,
  maxLength: number = metaDescriptionMaxLength,
): string {
  const value = text.replace(/\s+/g, " ").trim();
  if (value.length <= maxLength) return value;

  const sentenceEnds = [
    ...value.matchAll(/(?<=[\p{Ll})"”’])[.!?…](?=\s+[\p{Lu}\d"“‘(])/gu),
  ].map((match) => match.index + 1);
  const lastFittingEnd = sentenceEnds.filter((end) => end <= maxLength).at(-1);
  if (lastFittingEnd !== undefined) return value.slice(0, lastFittingEnd);

  // Leave room for the ellipsis and never end inside a word.
  const room = value.slice(0, maxLength - 1);
  const endsAtWordBoundary = /[\s,;:.!?…)]/u.test(value.charAt(room.length));
  const lastSpace = room.lastIndexOf(" ");
  const words =
    endsAtWordBoundary || lastSpace <= 0 ? room : room.slice(0, lastSpace);
  return `${words.replace(/[\s,;:–—-]+$/u, "")}…`;
}

export type ArticleOpenGraph = {
  publishedTime?: string | null;
  modifiedTime?: string | null;
  authors?: readonly string[];
};

export type PageMetadataInput = {
  /** The complete document title, brand suffix included. */
  title: string;
  description: string;
  locale: SiteLocale;
  /** Site path (or absolute URL) of this page: canonical and self hreflang. */
  path: string;
  /** Published versions of the same page in the other language(s). */
  translations?: LocalizedPaths;
  /** Overrides the canonical URL; defaults to `path`. */
  canonical?: string;
  /** Defaults to the site-wide social image. */
  images?: readonly SocialImage[];
  index?: boolean;
  follow?: boolean;
  /** Open Graph / Twitter title and description when they differ. */
  socialTitle?: string;
  socialDescription?: string;
  /** Present for articles, reviews and photos: `og:type` becomes `article`. */
  article?: ArticleOpenGraph;
};

/**
 * Metadata for one page: title, description, canonical, hreflang pairs,
 * robots, Open Graph (with a default image) and a large Twitter card.
 */
export function createPageMetadata(input: PageMetadataInput): Metadata {
  const paths: LocalizedPaths = {
    ...input.translations,
    [input.locale]: input.path,
  };
  const canonical = toAbsoluteUrl(input.canonical ?? input.path);
  const images =
    input.images !== undefined && input.images.length > 0
      ? [...input.images]
      : [defaultSocialImage];
  const socialTitle = input.socialTitle ?? input.title;
  const socialDescription = input.socialDescription ?? input.description;
  const alternateLocales = siteLocales
    .filter((locale) => locale !== input.locale && paths[locale] !== undefined)
    .map(getOpenGraphLocale);
  const openGraphBase = {
    title: socialTitle,
    description: socialDescription,
    url: canonical,
    siteName,
    locale: getOpenGraphLocale(input.locale),
    ...(alternateLocales.length > 0
      ? { alternateLocale: alternateLocales }
      : {}),
    images,
  };
  const article = input.article;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: createLanguageAlternates(paths),
    },
    robots: {
      index: input.index ?? true,
      follow: input.follow ?? true,
    },
    openGraph:
      article === undefined
        ? { ...openGraphBase, type: "website" }
        : {
            ...openGraphBase,
            type: "article",
            ...(article.publishedTime
              ? { publishedTime: article.publishedTime }
              : {}),
            ...(article.modifiedTime
              ? { modifiedTime: article.modifiedTime }
              : {}),
            ...(article.authors !== undefined && article.authors.length > 0
              ? { authors: [...article.authors] }
              : {}),
          },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images,
    },
  };
}
