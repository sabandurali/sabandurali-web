import { pickFeaturedDistrict } from "@/components/sections/home-selection";
import { getDistrictGuideSummaries } from "@/content/districts/district-guide-data-source";
import { districtGuidePath } from "@/content/districts/district-routes";
import { getPublishedPhotos } from "@/content/photos/photo-data-source";
import type { PublicPhoto } from "@/content/photos/types";
import { getVerifiedDistrictImage } from "@/content/photos/verified-district-images";
import { settleSection } from "@/content/settle-section";
import type { Workspace } from "@/content/workspaces";
import { getWorkspaceEntryFeed } from "./workspace-feed";
import {
  orderWorkspaceHubEntries,
  type WorkspaceHubEntry,
} from "./workspace-hub";
import {
  getListedWorkspaceEntries,
  resolveWorkspaceSection,
} from "./workspace-routes";

/** The featured slot of a workspace hub, when it has published content. */
export type WorkspaceHubFeature =
  | { kind: "district"; slug: string; summary: string }
  | { kind: "photos"; photos: PublicPhoto[] };

const unavailable = () => new Set<string>();

/** Published guide summaries; an empty map when they cannot be read. */
function loadGuideSummaries(workspace: Workspace) {
  return settleSection({
    scope: "districts",
    id: workspace.key,
    name: "guide-summaries",
    load: getDistrictGuideSummaries,
    fallback: null,
    unavailable: unavailable(),
  });
}

/**
 * The section cards of a workspace hub with their published counts, in hub
 * order (filled first). Each section page's own feed is counted, so the
 * hub, the section page and the sitemap agree; the district guide counts
 * its published guides. Sections that point to an archive elsewhere are
 * not counted. A count that cannot be read is left out (null), never
 * guessed, and never takes the hub down.
 */
export async function getWorkspaceHubEntries(
  workspace: Workspace,
): Promise<WorkspaceHubEntry[]> {
  const entries = await Promise.all(
    getListedWorkspaceEntries(workspace).map(
      async (entry): Promise<WorkspaceHubEntry> => {
        if (entry.href === districtGuidePath) {
          const summaries = await loadGuideSummaries(workspace);
          return {
            entry,
            unit: "guide",
            count: summaries === null ? null : summaries.size,
          };
        }
        if (resolveWorkspaceSection(workspace.key, entry.slug).kind !== "page")
          return { entry, unit: "item", count: null };

        const feed = await settleSection({
          scope: "pages",
          id: entry.href,
          name: "workspace-feed",
          load: () => getWorkspaceEntryFeed(entry),
          fallback: null,
          unavailable: unavailable(),
        });
        return {
          entry,
          unit: "item",
          count: feed === null ? null : (feed.items?.length ?? 0),
        };
      },
    ),
  );
  return orderWorkspaceHubEntries(entries);
}

/**
 * The featured slot (UX-03): the real-estate hub features the same district
 * guide as the home atlas, the photography hub the four newest photographs
 * (the cached first list page). Nothing published, or a failed read, leaves
 * the slot out.
 */
export async function getWorkspaceHubFeature(
  workspace: Workspace,
): Promise<WorkspaceHubFeature | null> {
  if (workspace.key === "gayrimenkul-ve-istanbul") {
    const summaries = await loadGuideSummaries(workspace);
    if (summaries === null) return null;
    const slug = pickFeaturedDistrict(
      summaries,
      (candidate) => getVerifiedDistrictImage(candidate, "tr") !== null,
    );
    return slug === null
      ? null
      : { kind: "district", slug, summary: summaries.get(slug) ?? "" };
  }
  if (workspace.key === "fotograf") {
    const list = await settleSection({
      scope: "photos",
      id: workspace.key,
      name: "latest-photos",
      load: () => getPublishedPhotos("tr"),
      fallback: null,
      unavailable: unavailable(),
    });
    const photos = list === null ? [] : list.photos.slice(0, 4);
    return photos.length === 0 ? null : { kind: "photos", photos };
  }
  return null;
}
