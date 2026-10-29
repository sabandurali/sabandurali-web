import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublishedArticlesByCategory } from "@/content/articles/article-data-source";
import { getPublishedPhotosByCollectionOrTag } from "@/content/photos/photo-data-source";
import type { WorkspaceEntry, WorkspaceKey } from "@/content/workspaces";
import { WorkspaceEntryPage } from "./WorkspacePage";
import {
  createWorkspaceMetadata,
  isWorkspaceEntryIndexable,
  requireWorkspace,
  resolveWorkspaceSection,
  selectWorkspaceEntryFeed,
  workspaceNotFoundMetadata,
  type WorkspaceEntryFeed,
} from "./workspace-routes";

export type { WorkspaceEntryFeed };

/**
 * Published Turkish content of a section (FE-V1): articles by category and
 * photos by collection or tag, filtered in the database. The lists shown are
 * exactly the items `getWorkspaceEntryItems` counts for the sitemap, so the
 * page, its robots tag and the sitemap always agree.
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

type SectionRouteProps = { params: Promise<{ section: string }> };

/**
 * `generateMetadata` and the page of one workspace's `[section]` route.
 * The route file adds `generateStaticParams` and `revalidate` itself
 * (segment config must be a literal in the route file).
 */
export function createWorkspaceSectionRoute(key: WorkspaceKey) {
  const workspace = requireWorkspace(key);

  async function generateMetadata({
    params,
  }: SectionRouteProps): Promise<Metadata> {
    const { section } = await params;
    const target = resolveWorkspaceSection(key, section);
    if (target.kind !== "page") return workspaceNotFoundMetadata;

    const { entry } = target;
    const feed = await getWorkspaceEntryFeed(entry);
    return createWorkspaceMetadata(entry.title, entry.description, entry.href, {
      index: isWorkspaceEntryIndexable(feed.items),
    });
  }

  async function WorkspaceSectionPage({ params }: SectionRouteProps) {
    const { section } = await params;
    const target = resolveWorkspaceSection(key, section);
    if (target.kind === "not-found") notFound();
    if (target.kind === "redirect") permanentRedirect(target.href);

    const feed = await getWorkspaceEntryFeed(target.entry);
    return (
      <WorkspaceEntryPage
        workspace={workspace}
        entry={target.entry}
        feed={feed}
      />
    );
  }

  return { generateMetadata, WorkspaceSectionPage };
}
