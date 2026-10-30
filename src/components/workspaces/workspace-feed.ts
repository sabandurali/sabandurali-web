import { getPublishedArticlesByCategory } from "@/content/articles/article-data-source";
import { getPublishedPhotosByCollectionOrTag } from "@/content/photos/photo-data-source";
import type { WorkspaceEntry } from "@/content/workspaces";
import {
  selectWorkspaceEntryFeed,
  type WorkspaceEntryFeed,
} from "./workspace-routes";

/**
 * Published Turkish content of a section (FE-V1): articles by category and
 * photos by collection or tag, filtered in the database. The lists shown are
 * exactly the items `getWorkspaceEntryItems` counts for the sitemap, so the
 * section page, the hub count, the robots tag and the sitemap always agree.
 */
export async function getWorkspaceEntryFeed(
  entry: WorkspaceEntry,
): Promise<WorkspaceEntryFeed> {
  const [articles, photos] = await Promise.all([
    entry.articleCategory === undefined
      ? Promise.resolve([])
      : getPublishedArticlesByCategory(entry.articleCategory, "tr"),
    entry.photoCategory === undefined
      ? Promise.resolve([])
      : getPublishedPhotosByCollectionOrTag(entry.photoCategory, "tr"),
  ]);
  return selectWorkspaceEntryFeed(entry, articles, photos);
}
