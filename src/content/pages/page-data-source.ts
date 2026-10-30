import "server-only";
import { cache } from "react";
import { homeContent } from "@/content/homeContent";
import type { SiteLocale } from "@/content/locales";
import {
  resolveHomeContent,
  type HomePageData,
  type ResolvedHomeContent,
} from "@/content/pages/home-page-content";
import { excludeLegacyTurkishHome } from "@/content/pages/legacy-home";
import { PayloadPublicPageRepository } from "@/content/pages/payload-page-repository";
import type { PublicPage } from "@/content/pages/public-types";
import {
  readPublicSource,
  type PublicContentSource,
} from "@/content/public-source";

const payloadPageRepository = new PayloadPublicPageRepository();

export function getPublicPageSource(): PublicContentSource {
  return readPublicSource("PAGE_PUBLIC_SOURCE");
}

/** The CMS home record of one locale, or the static marker. */
const getHomePageData = cache(
  async (locale: SiteLocale): Promise<HomePageData> =>
    getPublicPageSource() === "static"
      ? { source: "static", page: null }
      : {
          source: "payload",
          page: await payloadPageRepository.findHome(locale),
        },
);

/**
 * Home content for one locale: the CMS home page when it is public and
 * complete, otherwise the static home content (never a 404). The page, its
 * metadata, the other locale's hreflang pair and the sitemap all read the
 * served home through this function, so they agree on `page`.
 */
export const getHomeContent = cache(
  async (locale: SiteLocale): Promise<ResolvedHomeContent> =>
    resolveHomeContent(await getHomePageData(locale), homeContent[locale]),
);

export const getPublishedTurkishPageBySlug = cache(
  async (slug: string): Promise<PublicPage | null> => {
    if (getPublicPageSource() === "static") return null;

    return payloadPageRepository.findStandardBySlug(slug, "tr");
  },
);

/**
 * Standard pages served at `/<slug>`. The legacy home record is not one of
 * them: `/ana-sayfa` redirects to `/`, so it never gets a static param or a
 * sitemap entry, even after a real home record replaced it.
 */
export const getAllPublishedTurkishStandardPages = cache(
  async (): Promise<PublicPage[]> =>
    getPublicPageSource() === "static"
      ? []
      : excludeLegacyTurkishHome(
          await payloadPageRepository.listStandards("tr"),
        ),
);
