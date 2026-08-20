import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import type { PublicPage } from "@/content/pages/public-types";

export function getPublicPagePath(page: PublicPage): string {
  const localePrefix = page.language === "en" ? "/en" : "";

  return page.pageType === "home"
    ? localePrefix || "/"
    : `${localePrefix}/${page.slug}`;
}

export function createPublicPageMetadata(page: PublicPage): Metadata {
  const path = getPublicPagePath(page);
  const canonical = getAbsoluteUrl(path);
  const socialImage =
    page.seo.socialImage === null
      ? undefined
      : getAbsoluteUrl(page.seo.socialImage.src);
  const locale = page.language === "en" ? "en_US" : "tr_TR";
  const alternateLocale = page.language === "en" ? "tr_TR" : "en_US";

  return {
    title: page.seo.title,
    description: page.seo.description,
    alternates: {
      canonical,
    },
    robots: {
      index: page.seo.index,
      follow: page.seo.follow,
    },
    openGraph: {
      title: page.seo.title,
      description: page.seo.description,
      url: canonical,
      locale,
      alternateLocale,
      type: "website",
      siteName: "Şaban Durali",
      ...(socialImage === undefined
        ? {}
        : {
            images: [
              {
                url: socialImage,
                alt: page.seo.socialImage?.alt ?? page.title,
              },
            ],
          }),
    },
  };
}
