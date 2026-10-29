import "server-only";
import { cache } from "react";
import { homeContent } from "@/content/homeContent";
import type { SiteLocale } from "@/content/locales";
import {
  resolveHomeContent,
  type HomePageData,
  type ResolvedHomeContent,
} from "@/content/pages/home-page-content";
import { PayloadPublicPageRepository } from "@/content/pages/payload-page-repository";
import type { PublicPage } from "@/content/pages/public-types";
import {
  readPublicSource,
  type PublicContentSource,
} from "@/content/public-source";

export type PublicPageSource = PublicContentSource;

const payloadPageRepository = new PayloadPublicPageRepository();

export function getPublicPageSource(): PublicPageSource {
  return readPublicSource("PAGE_PUBLIC_SOURCE");
}

export type TurkishHomePageData = HomePageData;

export type EnglishHomePageData = TurkishHomePageData;

export const getTurkishHomePageData = cache(
  async (): Promise<TurkishHomePageData> => {
    if (getPublicPageSource() === "static") {
      return { source: "static", page: null };
    }

    return {
      source: "payload",
      page: await payloadPageRepository.findHome("tr"),
    };
  },
);

export const getEnglishHomePageData = cache(
  async (): Promise<EnglishHomePageData> => {
    if (getPublicPageSource() === "static") {
      return { source: "static", page: null };
    }

    return {
      source: "payload",
      page: await payloadPageRepository.findHome("en"),
    };
  },
);

/**
 * Home content for one locale: the CMS home page when it is public and
 * complete, otherwise the static home content (never a 404).
 */
export const getHomeContent = cache(
  async (locale: SiteLocale): Promise<ResolvedHomeContent> =>
    resolveHomeContent(
      locale === "tr"
        ? await getTurkishHomePageData()
        : await getEnglishHomePageData(),
      homeContent[locale],
    ),
);

export const getPublishedTurkishPageBySlug = cache(
  async (slug: string): Promise<PublicPage | null> => {
    if (getPublicPageSource() === "static") return null;

    return payloadPageRepository.findStandardBySlug(slug, "tr");
  },
);

export const getAllPublishedTurkishStandardPages = cache(
  async (): Promise<PublicPage[]> =>
    getPublicPageSource() === "static"
      ? []
      : payloadPageRepository.listStandards("tr"),
);
