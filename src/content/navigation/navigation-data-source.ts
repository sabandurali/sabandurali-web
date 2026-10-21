import "server-only";
import { cache } from "react";
import {
  getEnglishHeaderNavigationItems,
  getStaticFooterGroups,
  getStaticHeaderNavigationItems,
  withTurkishHeaderShortcuts,
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
import { assertProductionPayloadInfrastructure } from "@/lib/payloadInfrastructure";

type PublicNavigationSource = "payload" | "static";

const payloadNavigationRepository =
  new PayloadPublicNavigationRepository();

function getPublicNavigationSource(): PublicNavigationSource {
  const source = process.env.NAVIGATION_PUBLIC_SOURCE;

  if (source === undefined || source === "static") {
    return "static";
  }

  if (source === "payload") {
    assertProductionPayloadInfrastructure();
    return "payload";
  }

  throw new Error(
    `Invalid NAVIGATION_PUBLIC_SOURCE value "${source}". Expected "static" or "payload".`,
  );
}

const getPayloadNavigation = cache(
  async (locale: Locale): Promise<PublicNavigation | null> =>
    payloadNavigationRepository.findPublished(locale),
);

export async function getHeaderNavigation(
  locale: Locale,
  anchors: HomeAnchors,
  content: HeaderContent,
  anchorPrefix: string,
): Promise<PublicNavigationLink[]> {
  if (locale === "en") {
    return getEnglishHeaderNavigationItems();
  }

  if (getPublicNavigationSource() === "static") {
    return getStaticHeaderNavigationItems({
      locale,
      anchors,
      content,
      anchorPrefix,
    });
  }

  const navigation = await getPayloadNavigation(locale);

  const items = navigation?.headerItems ?? [];
  return withTurkishHeaderShortcuts(items);
}

export async function getFooterNavigation(
  content: FooterContent,
): Promise<PublicFooterGroup[]> {
  if (
    getPublicNavigationSource() === "static"
  ) {
    return getStaticFooterGroups(content);
  }

  const navigation = await getPayloadNavigation(content.locale);

  if (
    content.locale === "en" &&
    (navigation?.footerGroups.length ?? 0) === 0
  ) {
    return getStaticFooterGroups(content);
  }

  return navigation?.footerGroups ?? [];
}
