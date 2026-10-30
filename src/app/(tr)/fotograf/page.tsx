import type { Metadata } from "next";
import {
  WorkspaceLandingPage,
  createWorkspaceMetadata,
} from "@/components/workspaces/WorkspacePage";
import { requireWorkspace } from "@/components/workspaces/workspace-routes";

const workspace = requireWorkspace("fotograf");

/* The hub counts and features published content: refreshed hourly like
   its section pages (on-demand revalidation covers the section pages). */
export const revalidate = 3600;

export const metadata: Metadata = createWorkspaceMetadata(
  workspace.title,
  workspace.description,
  "/fotograf",
);

export default function PhotographyWorkspacePage() {
  return <WorkspaceLandingPage workspace={workspace} path="/fotograf" />;
}
