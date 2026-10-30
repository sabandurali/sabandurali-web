import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import type { WorkspaceKey } from "@/content/workspaces";
import { WorkspaceEntryPage } from "./WorkspacePage";
import { getWorkspaceEntryFeed } from "./workspace-feed";
import {
  createWorkspaceMetadata,
  isWorkspaceEntryIndexable,
  requireWorkspace,
  resolveWorkspaceSection,
  workspaceNotFoundMetadata,
  type WorkspaceEntryFeed,
} from "./workspace-routes";

export type { WorkspaceEntryFeed };
export { getWorkspaceEntryFeed };

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
    // next.config.ts redirects these entries before routing
    // (src/content/workspace-redirects.ts, kept in sync by its test); this
    // is only a fallback.
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
