import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { PublicNavigationLink } from "@/content/navigation/public-types";
import type { PublicPhoto } from "@/content/photos/public-types";
import {
  sectionHasContent,
  workspaces,
  type PublishedWorkspaceFeeds,
} from "@/content/workspaces";

/** Serializable form of {@link PublishedWorkspaceFeeds} (cache entries). */
export type PublishedWorkspaceFeedSlugs = {
  articleCategories: string[];
  photoCategories: string[];
};

/**
 * The feeds that have published Turkish content: the category slugs of the
 * Turkish articles and the collection and tag slugs of the Turkish photos,
 * exactly what `getWorkspaceEntryItems` filters a section by.
 */
export function collectPublishedWorkspaceFeeds(
  articles: readonly Pick<PublicArticleSummary, "language" | "categories">[],
  photos: readonly Pick<PublicPhoto, "language" | "collections" | "tags">[],
): PublishedWorkspaceFeedSlugs {
  const articleCategories = new Set(
    articles
      .filter((article) => article.language === "tr")
      .flatMap((article) => article.categories.map(({ slug }) => slug)),
  );
  const photoCategories = new Set(
    photos
      .filter((photo) => photo.language === "tr")
      .flatMap((photo) => [
        ...photo.collections.map(({ slug }) => slug),
        ...photo.tags.map(({ slug }) => slug),
      ]),
  );
  return {
    articleCategories: [...articleCategories].sort(),
    photoCategories: [...photoCategories].sort(),
  };
}

export function toPublishedWorkspaceFeeds(
  slugs: PublishedWorkspaceFeedSlugs,
): PublishedWorkspaceFeeds {
  return {
    articleCategories: new Set(slugs.articleCategories),
    photoCategories: new Set(slugs.photoCategories),
  };
}

/** Paths of the workspace sections that have nothing to show yet. */
export function getEmptyWorkspaceSectionPaths(
  feeds: PublishedWorkspaceFeeds,
): Set<string> {
  return new Set(
    workspaces.flatMap((workspace) =>
      workspace.entries
        .filter((entry) => !sectionHasContent(workspace.key, entry, feeds))
        .map((entry) => entry.href),
    ),
  );
}

/**
 * The header without links to empty workspace sections (NAV-EMPTY-SECTIONS):
 * such a page answers 200 but is noindex and shows only its empty state, so
 * the menu does not offer it. The workspace page itself stays; a section
 * comes back to the menu once its first item is published.
 */
export function withoutEmptyWorkspaceSections(
  items: readonly PublicNavigationLink[],
  feeds: PublishedWorkspaceFeeds,
): PublicNavigationLink[] {
  const empty = getEmptyWorkspaceSectionPaths(feeds);
  const prune = (
    links: readonly PublicNavigationLink[],
  ): PublicNavigationLink[] =>
    links
      .filter(
        (link) => link.external || link.href === null || !empty.has(link.href),
      )
      .map((link) => ({ ...link, children: prune(link.children) }));
  return prune(items);
}
