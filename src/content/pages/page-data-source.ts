import "server-only";
import { cache } from "react";
import { PayloadPublicPageRepository } from "@/content/pages/payload-page-repository";
import type { PublicPage } from "@/content/pages/public-types";

export type PublicPageSource = "payload" | "static";

const payloadPageRepository = new PayloadPublicPageRepository();

export function getPublicPageSource(): PublicPageSource {
  const source = process.env.PAGE_PUBLIC_SOURCE;

  if (source === undefined || source === "static") {
    return "static";
  }

  if (source === "payload") {
    if (process.env.NODE_ENV !== "development") {
      throw new Error(
        "PAGE_PUBLIC_SOURCE=payload is restricted to local development during this project stage.",
      );
    }

    return "payload";
  }

  throw new Error(
    `Invalid PAGE_PUBLIC_SOURCE value "${source}". Expected "static" or "payload".`,
  );
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
