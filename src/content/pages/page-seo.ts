import type { Metadata } from "next";
import type { PublicPage } from "@/content/pages/public-types";
import { createPageMetadata, createSocialImage } from "@/lib/metadata";

export const homePagePaths = {
  tr: "/",
  en: "/en",
} as const;

export function getPublicPagePath(page: PublicPage): string {
  const localePrefix = page.language === "en" ? "/en" : "";

  return page.pageType === "home"
    ? localePrefix || "/"
    : `${localePrefix}/${page.slug}`;
}

export function createPublicPageMetadata(page: PublicPage): Metadata {
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
      page.pageType === "home"
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
