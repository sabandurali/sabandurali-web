import "server-only";
import { cache } from "react";
import {
  getStaticFooterGroups,
  getStaticHeaderNavigationItems,
} from "@/components/layout/navigation";
import { PayloadPublicNavigationRepository } from "@/content/navigation/payload-navigation-repository";
import type {
  PublicFooterGroup,
  PublicNavigation,
  PublicNavigationLink,
} from "@/content/navigation/public-types";
import type {
  FooterContent,
  HeaderContent,
  HomeAnchors,
  Locale,
} from "@/content/homeContent";

type PublicNavigationSource = "payload" | "static";

const payloadNavigationRepository =
  new PayloadPublicNavigationRepository();

function getPublicNavigationSource(): PublicNavigationSource {
  const source = process.env.NAVIGATION_PUBLIC_SOURCE;

  if (source === undefined || source === "static") {
    return "static";
  }

  if (source === "payload") {
    if (process.env.NODE_ENV !== "development") {
      throw new Error(
        "NAVIGATION_PUBLIC_SOURCE=payload is restricted to local development during this project stage.",
      );
    }

    return "payload";
  }

  throw new Error(
    `Invalid NAVIGATION_PUBLIC_SOURCE value "${source}". Expected "static" or "payload".`,
  );
}

const getPayloadNavigation = cache(
  async (): Promise<PublicNavigation | null> =>
    payloadNavigationRepository.findPublished(),
);

export async function getHeaderNavigation(
  locale: Locale,
  anchors: HomeAnchors,
  content: HeaderContent,
  anchorPrefix: string,
): Promise<PublicNavigationLink[]> {
  if (locale === "en" || getPublicNavigationSource() === "static") {
    return getStaticHeaderNavigationItems({
      locale,
      anchors,
      content,
      anchorPrefix,
    });
  }

  return (await getPayloadNavigation())?.headerItems ?? [];
}

export async function getFooterNavigation(
  content: FooterContent,
): Promise<PublicFooterGroup[]> {
  if (
    content.locale === "en" ||
    getPublicNavigationSource() === "static"
  ) {
    return getStaticFooterGroups(content);
  }

  return (await getPayloadNavigation())?.footerGroups ?? [];
}
