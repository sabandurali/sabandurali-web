import "server-only";
import { cache } from "react";
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

export type TurkishHomePageData =
  | {
      source: "static";
      page: null;
    }
  | {
      source: "payload";
      page: PublicPage | null;
    };

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

export const getPublishedTurkishPageBySlug = cache(
  async (slug: string): Promise<PublicPage | null> => {
    if (getPublicPageSource() === "static") return null;

    return payloadPageRepository.findStandardBySlug(slug, "tr");
  },
);

export async function getAllPublishedTurkishStandardPages(): Promise<
  PublicPage[]
> {
  if (getPublicPageSource() === "static") return [];

  return payloadPageRepository.listStandards("tr");
}
