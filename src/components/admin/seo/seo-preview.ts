/**
 * What search engines and social cards will show for a record
 * (ADM-SEO-PREVIEW). Pure and client-safe: the admin field passes the
 * current form values, and the same fallback helpers as the public mappers
 * (`createFallbackMetaTitle`, `createFallbackMetaDescription`) produce the
 * text, so the preview matches the published page.
 */
import { isSiteCanonicalUrl } from "@/collections/validation";
import { getAbsoluteUrl } from "@/config/site";
import { getArticlePath } from "@/content/articles/article-routes";
import { getText } from "@/content/guards";
import { isSiteLocale, type SiteLocale } from "@/content/locales";
import { isLegacyTurkishHome } from "@/content/pages/legacy-home";
import { getPhotoPath } from "@/content/photos/photo-routes";
import {
  createFallbackMetaDescription,
  createFallbackMetaTitle,
  metaDescriptionMaxLength,
  metaTitleMaxLength,
} from "@/lib/metadata";

export const SEO_PREVIEW_KINDS = ["articles", "pages", "photos"] as const;
export type SeoPreviewKind = (typeof SEO_PREVIEW_KINDS)[number];

export function isSeoPreviewKind(value: unknown): value is SeoPreviewKind {
  return SEO_PREVIEW_KINDS.some((kind) => kind === value);
}

/** Form paths each kind reads; the values arrive in the edited locale. */
export const SEO_PREVIEW_PATHS = {
  articles: {
    canonical: "seo.canonical",
    fallbackDescriptions: ["excerpt"],
    metaDescription: "seo.metaDescription",
    metaTitle: "seo.metaTitle",
    socialImage: "featuredImage",
    title: "title",
  },
  pages: {
    canonical: null,
    fallbackDescriptions: ["summary"],
    metaDescription: "seo.description",
    metaTitle: "seo.title",
    socialImage: "seo.socialImage",
    title: "title",
  },
  photos: {
    canonical: null,
    fallbackDescriptions: ["description", "altText"],
    metaDescription: "seo.metaDescription",
    metaTitle: "seo.metaTitle",
    socialImage: "seo.openGraphImage",
    title: "title",
  },
} as const satisfies Record<
  SeoPreviewKind,
  {
    canonical: string | null;
    fallbackDescriptions: readonly string[];
    metaDescription: string;
    metaTitle: string;
    socialImage: string;
    title: string;
  }
>;

export type SeoPreviewInput = Readonly<{
  canonical?: unknown;
  fallbackDescriptions: readonly unknown[];
  /** The admin locale (localized records) */
  locale: SiteLocale;
  /** Pages only: the record's own language and type. */
  language?: unknown;
  pageType?: unknown;
  metaDescription: unknown;
  metaTitle: unknown;
  slug: unknown;
  socialImage: unknown;
  title: unknown;
}>;

export type SeoPreview = Readonly<{
  title: string | null;
  titleFromSeoField: boolean;
  titleLength: number;
  titleLimit: number;
  description: string | null;
  descriptionFromSeoField: boolean;
  descriptionLength: number;
  descriptionLimit: number;
  /** Absolute canonical URL, or null when the record has no public page. */
  url: string | null;
  /** Which image the share card uses. */
  imageNote: string;
}>;

function hasValue(value: unknown): boolean {
  return (
    getText(value) !== null ||
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "object" && value !== null)
  );
}

function getPath(kind: SeoPreviewKind, input: SeoPreviewInput): string | null {
  const slug = getText(input.slug);
  switch (kind) {
    case "articles":
      return slug === null ? null : getArticlePath(slug, input.locale);
    case "photos":
      return slug === null ? null : getPhotoPath(slug, input.locale);
    case "pages": {
      const language = input.language;
      if (!isSiteLocale(language)) return null;
      if (input.pageType === "home") return language === "en" ? "/en" : "/";
      if (input.pageType !== "standard" || language !== "tr" || slug === null) {
        return null;
      }
      return isLegacyTurkishHome({ language, slug }) ? "/" : `/${slug}`;
    }
  }
}

function getImageNote(kind: SeoPreviewKind, socialImage: unknown): string {
  const selected = hasValue(socialImage);
  switch (kind) {
    case "articles":
      return selected
        ? "Paylaşım görseli: makalenin öne çıkan görseli."
        : "Paylaşım görseli: sitenin varsayılan görseli (öne çıkan görsel seçilmedi).";
    case "photos":
      return selected
        ? "Paylaşım görseli: seçilen sosyal paylaşım görseli."
        : "Paylaşım görseli: fotoğrafın kendisi.";
    case "pages":
      return selected
        ? "Paylaşım görseli: seçilen sosyal paylaşım görseli."
        : "Paylaşım görseli: sitenin varsayılan görseli.";
  }
}

export function buildSeoPreview(
  kind: SeoPreviewKind,
  input: SeoPreviewInput,
): SeoPreview {
  const metaTitle = getText(input.metaTitle);
  const title = getText(input.title);
  const previewTitle =
    metaTitle ?? (title === null ? null : createFallbackMetaTitle(title));

  const metaDescription = getText(input.metaDescription);
  const fallbacks = input.fallbackDescriptions.map(getText);
  const previewDescription =
    metaDescription ??
    createFallbackMetaDescription(...fallbacks) ??
    fallbacks.find((value) => value !== null) ??
    null;

  // Same rule as the article mapper: a canonical outside this site is
  // ignored (and rejected on save), so the record's own address applies.
  const canonicalText = getText(input.canonical);
  const canonical =
    canonicalText !== null && isSiteCanonicalUrl(canonicalText)
      ? canonicalText
      : null;
  const path = getPath(kind, input);

  return {
    description: previewDescription,
    descriptionFromSeoField: metaDescription !== null,
    descriptionLength: previewDescription?.length ?? 0,
    descriptionLimit: metaDescriptionMaxLength,
    imageNote: getImageNote(kind, input.socialImage),
    title: previewTitle,
    titleFromSeoField: metaTitle !== null,
    titleLength: previewTitle?.length ?? 0,
    titleLimit: metaTitleMaxLength,
    url:
      canonical !== null
        ? getAbsoluteUrl(canonical)
        : path === null
          ? null
          : getAbsoluteUrl(path),
  };
}
