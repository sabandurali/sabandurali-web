import type { Metadata } from "next";
import {
  WorkspaceLandingPage,
  createWorkspaceMetadata,
} from "@/components/workspaces/WorkspacePage";
import { requireWorkspace } from "@/components/workspaces/workspace-routes";

const workspace = requireWorkspace("gayrimenkul-ve-istanbul");

export const metadata: Metadata = createWorkspaceMetadata(
  workspace.title,
  workspace.description,
  "/gayrimenkul-ve-istanbul",
);

export default function RealEstatePage() {
  return (
    <WorkspaceLandingPage
      workspace={workspace}
      path="/gayrimenkul-ve-istanbul"
    />
  );
}
