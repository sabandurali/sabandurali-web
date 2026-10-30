import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import {
  getEnglishHeaderNavigationItems,
  getStaticFooterGroups,
  getStaticHeaderNavigationItems,
  withTurkishHeaderShortcuts,
} from "@/content/navigation/static-navigation";
import { contactPaths, privacyPaths } from "@/config/site";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { describeError, reportContentIssue } from "@/content/content-log";
import { NAVIGATION_CACHE_TAG } from "@/content/navigation/navigation-cache-tags";
import { resolveFooterGroups } from "@/content/navigation/navigation-fallback";
import { PayloadPublicNavigationRepository } from "@/content/navigation/payload-navigation-repository";
import {
  collectPublishedWorkspaceFeeds,
  toPublishedWorkspaceFeeds,
  withoutEmptyWorkspaceSections,
} from "@/content/navigation/workspace-sections";
import { getAllPublishedPhotos } from "@/content/photos/photo-data-source";
import { PHOTO_FACETS_CACHE_TAG } from "@/content/photos/photo-cache-tags";
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

/*
 * The header and footer render on every page, including the per-request
 * ones (photo lists, district news, unmatched English URLs), so the
 * published global is cached across requests. A Navigation save and any
 * page write (a linked page can be published or withdrawn) invalidate the
 * tag (`src/lib/revalidation.ts`); the hour covers scheduled pages.
 * `unstable_cache` is used because the app does not enable Cache Components.
 */
const getCachedPayloadNavigation = unstable_cache(
  (locale: Locale) => payloadNavigationRepository.findPublished(locale),
  ["navigation"],
  { tags: [NAVIGATION_CACHE_TAG], revalidate: 3600 },
);

const getPayloadNavigation = cache(
  async (locale: Locale): Promise<PublicNavigation | null> => {
    const navigation = await getCachedPayloadNavigation(locale);

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

/*
 * Which workspace sections have published Turkish content
 * (NAV-EMPTY-SECTIONS). The public data sources read with
 * `overrideAccess: false`; only the slug lists are cached, across requests,
 * like the navigation itself. Photo writes invalidate the photo facets tag
 * and page writes the navigation tag; the hour (also the layouts'
 * `revalidate`) covers article publishing and scheduled content.
 */
const getCachedPublishedWorkspaceFeeds = unstable_cache(
  async () => {
    const [articles, photos] = await Promise.all([
      getAllPublishedArticles("tr"),
      getAllPublishedPhotos("tr"),
    ]);
    return collectPublishedWorkspaceFeeds(articles, photos);
  },
  ["navigation-workspace-feeds"],
  { tags: [NAVIGATION_CACHE_TAG, PHOTO_FACETS_CACHE_TAG], revalidate: 3600 },
);

/**
 * Turkish header items without empty workspace sections. When the content
 * cannot be read, the menu keeps every section (the state before this
 * filter) instead of hiding sections that may have content.
 */
async function withPublishedWorkspaceSections(
  items: PublicNavigationLink[],
): Promise<PublicNavigationLink[]> {
  try {
    const feeds = toPublishedWorkspaceFeeds(
      await getCachedPublishedWorkspaceFeeds(),
    );
    return withoutEmptyWorkspaceSections(items, feeds);
  } catch (error) {
    reportContentIssue({
      scope: "navigation",
      locale: "tr",
      reason: "Workspace section content could not be read; all sections shown",
      detail: describeError(error),
    });
    return items;
  }
}

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
    return withPublishedWorkspaceSections(
      getStaticHeaderNavigationItems({
        locale,
        anchors,
        content,
        anchorPrefix,
      }),
    );
  }

  const navigation = await getPayloadNavigation(locale);

  // The Turkish shortcuts always provide home, workspaces, about and contact.
  return withPublishedWorkspaceSections(
    withTurkishHeaderShortcuts(navigation?.headerItems ?? []),
  );
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
