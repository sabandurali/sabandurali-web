import "server-only";
import { cache } from "react";
import {
  getEnglishHeaderNavigationItems,
  getStaticFooterGroups,
  getStaticHeaderNavigationItems,
  withTurkishHeaderShortcuts,
} from "@/content/navigation/static-navigation";
import { contactPaths, privacyPaths } from "@/config/site";
import { reportContentIssue } from "@/content/content-log";
import { resolveFooterGroups } from "@/content/navigation/navigation-fallback";
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
import { readPublicSource } from "@/content/public-source";

const payloadNavigationRepository = new PayloadPublicNavigationRepository();

const getPayloadNavigation = cache(
  async (locale: Locale): Promise<PublicNavigation | null> => {
    const navigation = await payloadNavigationRepository.findPublished(locale);

    if (navigation === null) {
      reportContentIssue({
        scope: "navigation",
        locale,
        reason: "Navigation global is not published; static navigation is used",
      });
    }

    return navigation;
  },
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

  if (readPublicSource("NAVIGATION_PUBLIC_SOURCE") === "static") {
    return getStaticHeaderNavigationItems({
      locale,
      anchors,
      content,
      anchorPrefix,
    });
  }

  const navigation = await getPayloadNavigation(locale);

  // The Turkish shortcuts always provide home, workspaces, about and contact.
  return withTurkishHeaderShortcuts(navigation?.headerItems ?? []);
}

export async function getFooterNavigation(
  content: FooterContent,
): Promise<PublicFooterGroup[]> {
  const staticGroups = getStaticFooterGroups(content);

  if (readPublicSource("NAVIGATION_PUBLIC_SOURCE") === "static") {
    return staticGroups;
  }

  const navigation = await getPayloadNavigation(content.locale);

  return resolveFooterGroups(navigation?.footerGroups ?? null, staticGroups, [
    privacyPaths[content.locale],
    contactPaths[content.locale],
  ]);
}
