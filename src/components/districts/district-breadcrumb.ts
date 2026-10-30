import type { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import { getWorkspace } from "@/content/workspaces";

const parentWorkspaceKey = "gayrimenkul-ve-istanbul";

function parentWorkspace() {
  const workspace = getWorkspace(parentWorkspaceKey);
  if (workspace === null) {
    throw new Error(`Unknown workspace "${parentWorkspaceKey}".`);
  }
  return workspace;
}

/**
 * The district pages' parent crumb. Its label is the workspace title the
 * header navigation and the workspace page use for the same target, so one
 * link never goes by two names (WCAG 3.2.4).
 */
export const districtWorkspaceCrumb: BreadcrumbItem = {
  label: parentWorkspace().title,
  href: `/${parentWorkspace().key}`,
};
