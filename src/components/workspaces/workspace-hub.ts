import type { PublicPhoto } from "@/content/photos/types";
import type { WorkspaceEntry } from "@/content/workspaces";
import type { WorkspaceEntryFeed } from "./workspace-routes";

/**
 * A section card of a workspace hub with what it holds. `count` is the
 * number of published items the section lists (or, for the district guide,
 * the published guides); `null` when it is not counted here (an archive
 * the section points to, or a count that could not be read).
 */
export type WorkspaceHubEntry = {
  entry: WorkspaceEntry;
  count: number | null;
  /** What `count` counts. */
  unit: "item" | "guide";
};

function rank(count: number | null): number {
  if (count === null) return 1;
  return count > 0 ? 0 : 2;
}

/**
 * Hub order (UX-09): sections with published content first, then the ones
 * not counted here (archives the section points to), then the empty ones.
 * The registry order is kept inside each group, so the page stays stable.
 */
export function orderWorkspaceHubEntries(
  entries: readonly WorkspaceHubEntry[],
): WorkspaceHubEntry[] {
  return entries
    .map((item, index) => ({ item, index }))
    .toSorted(
      (left, right) =>
        rank(left.item.count) - rank(right.item.count) ||
        left.index - right.index,
    )
    .map(({ item }) => item);
}

/**
 * Count line of a section card: "3 yayın", "12 ilçe rehberi", or "Henüz
 * yayın yok" for an empty section; null when the section is not counted.
 */
export function workspaceHubCountLabel(
  item: Pick<WorkspaceHubEntry, "count" | "unit">,
): string | null {
  if (item.count === null) return null;
  if (item.count === 0) {
    return item.unit === "guide"
      ? "Henüz yayımlanmış rehber yok"
      : "Henüz yayın yok";
  }
  return item.unit === "guide"
    ? `${item.count} ilçe rehberi`
    : `${item.count} yayın`;
}

/**
 * Published count of a section from its own feed (the one its page and the
 * sitemap use): null when the feed could not be read, never a guess. A
 * section without a feed counts 0, as its page shows its empty state.
 */
export function workspaceHubFeedCount(
  feed: Pick<WorkspaceEntryFeed, "items"> | null,
): number | null {
  if (feed === null) return null;
  return feed.items === null ? 0 : feed.items.length;
}

/** How many photographs the photography hub features. */
export const WORKSPACE_HUB_PHOTO_LIMIT = 4;

/** The newest photographs the photography hub features (none: no slot). */
export function selectWorkspaceHubPhotos(
  list: { photos: readonly PublicPhoto[] } | null,
): PublicPhoto[] {
  return list === null ? [] : list.photos.slice(0, WORKSPACE_HUB_PHOTO_LIMIT);
}
