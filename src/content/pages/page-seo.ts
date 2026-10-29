import type { Metadata } from "next";
import { isLegacyTurkishHome } from "@/content/pages/legacy-home";
import type { PublicPage } from "@/content/pages/public-types";
import { createPageMetadata, createSocialImage } from "@/lib/metadata";

export const homePagePaths = {
  tr: "/",
  en: "/en",
} as const;

export function getPublicPagePath(page: PublicPage): string {
  const localePrefix = page.language === "en" ? "/en" : "";

  // `/ana-sayfa` always redirects to `/`, served as home or not.
  return page.pageType === "home" || isLegacyTurkishHome(page)
    ? localePrefix || "/"
    : `${localePrefix}/${page.slug}`;
}

/**
 * Whether a served home page is indexable. Both home pages always render (a
 * missing or invalid CMS home falls back to the static one), so a home page
 * is indexable unless its CMS record opts out. The sitemap and the hreflang
 * pair of the other home page follow this same rule.
 */
export function isHomePageIndexable(page: PublicPage | null): boolean {
  return page?.seo.index !== false;
}

export type PublicPageMetadataOptions = {
  /**
   * Home pages only: whether the other language's home page is indexable.
   * A noindex home page is never named as a hreflang alternate. Defaults to
   * true.
   */
  translationIndexable?: boolean;
};

export function createPublicPageMetadata(
  page: PublicPage,
  { translationIndexable = true }: PublicPageMetadataOptions = {},
): Metadata {
  const socialImage = page.seo.socialImage;
  // Both home pages always exist (a CMS home falls back to the static one);
  // standard CMS pages are published in Turkish only.
  const otherLanguage = page.language === "en" ? "tr" : "en";

  return createPageMetadata({
    title: page.seo.title,
    description: page.seo.description,
    locale: page.language,
    path: getPublicPagePath(page),
    translations:
      page.pageType === "home" && translationIndexable
        ? { [otherLanguage]: homePagePaths[otherLanguage] }
        : undefined,
    images:
      socialImage === null
        ? undefined
        : [
            createSocialImage({
              src: socialImage.src,
              alt: socialImage.alt || page.title,
              width: socialImage.width,
              height: socialImage.height,
            }),
          ],
    index: page.seo.index,
    follow: page.seo.follow,
  });
}
