import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/config/site";
import type { PublicPage } from "@/content/pages/public-types";

export function getPublicPagePath(page: PublicPage): string {
  return page.pageType === "home" ? "/" : `/${page.slug}`;
}

export function createPublicPageMetadata(page: PublicPage): Metadata {
  const path = getPublicPagePath(page);
  const canonical = getAbsoluteUrl(path);
  const socialImage =
    page.seo.socialImage === null
      ? undefined
      : getAbsoluteUrl(page.seo.socialImage.src);

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
      locale: "tr_TR",
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
