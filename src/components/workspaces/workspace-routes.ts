import type { Metadata } from "next";
import {
  getWorkspace,
  getWorkspaceEntry,
  type Workspace,
  type WorkspaceEntry,
  type WorkspaceKey,
} from "@/content/workspaces";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { PublicPhoto } from "@/content/photos/types";
import { createPageMetadata } from "@/lib/metadata";
import { getWorkspaceEntryItems } from "@/lib/sitemap-entries";

export type WorkspaceEntryFeed = {
  articles: PublicArticleSummary[];
  photos: PublicPhoto[];
  /** Same value the sitemap uses; null when the section has no feed. */
  items: Array<PublicArticleSummary | PublicPhoto> | null;
};

/**
 * Published Turkish content of a section (FE-V1). The lists shown are
 * exactly the items `getWorkspaceEntryItems` counts for the sitemap, so the
 * page, its robots tag and the sitemap always agree.
 */
export function selectWorkspaceEntryFeed(
  entry: WorkspaceEntry,
  articles: readonly PublicArticleSummary[],
  photos: readonly PublicPhoto[],
): WorkspaceEntryFeed {
  const items = getWorkspaceEntryItems(entry, articles, photos);
  const shown = new Set<unknown>(items ?? []);

  return {
    articles: articles.filter((article) => shown.has(article)),
    photos: photos.filter((photo) => shown.has(photo)),
    items,
  };
}

/** A workspace that must exist (the six route folders name them). */
export function requireWorkspace(key: WorkspaceKey): Workspace {
  const workspace = getWorkspace(key);
  if (workspace === null) {
    throw new Error(`Unknown workspace "${key}".`);
  }
  return workspace;
}

/** Path of a workspace section page served by the `[section]` route. */
export function getWorkspaceSectionPath(key: string, slug: string): string {
  return `/${key}/${slug}`;
}

export type WorkspaceSectionTarget =
  | { kind: "page"; entry: WorkspaceEntry }
  | { kind: "redirect"; href: string }
  | { kind: "not-found" };

/**
 * What `/<workspace>/<section>` serves: the section page when the entry
 * lives at that path, a permanent redirect when the entry points elsewhere
 * (the district guide, the book or photo archive), otherwise 404.
 */
export function resolveWorkspaceSection(
  key: string,
  slug: string,
): WorkspaceSectionTarget {
  const entry = getWorkspaceEntry(key, slug);
  if (entry === null) return { kind: "not-found" };
  if (entry.href !== getWorkspaceSectionPath(key, slug)) {
    return { kind: "redirect", href: entry.href };
  }
  return { kind: "page", entry };
}

/** Section entries shown on a workspace page (tools not yet published are left out). */
export function getListedWorkspaceEntries(
  workspace: Workspace,
): readonly WorkspaceEntry[] {
  return workspace.entries.filter(
    (entry) => entry.slug !== "hesaplama-araclari",
  );
}

/**
 * A section page is indexable only when it lists published content, the
 * same rule the sitemap applies through `getWorkspaceEntryItems`: `null`
 * (no feed) and an empty list are both noindex, follow.
 */
export function isWorkspaceEntryIndexable(
  items: readonly unknown[] | null,
): boolean {
  return items !== null && items.length > 0;
}

/**
 * Metadata of the workspace index, workspace pages and section pages:
 * Turkish only, through the shared builder (canonical, Open Graph, Twitter).
 */
export function createWorkspaceMetadata(
  title: string,
  description: string,
  path: string,
  options: { index?: boolean } = {},
): Metadata {
  return createPageMetadata({
    title: `${title} | Şaban Durali`,
    description,
    locale: "tr",
    path,
    index: options.index ?? true,
    follow: true,
  });
}

export const workspaceNotFoundMetadata: Metadata = {
  title: "Sayfa bulunamadı | Şaban Durali",
  robots: { index: false, follow: false },
};
