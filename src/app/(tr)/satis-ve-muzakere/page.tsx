import type { Metadata } from "next";
import {
  WorkspaceLandingPage,
  createWorkspaceMetadata,
} from "@/components/workspaces/WorkspacePage";
import { requireWorkspace } from "@/components/workspaces/workspace-routes";

const workspace = requireWorkspace("satis-ve-muzakere");

export const metadata: Metadata = createWorkspaceMetadata(
  workspace.title,
  workspace.description,
  "/satis-ve-muzakere",
);

export default function SalesNegotiationPage() {
  return (
    <WorkspaceLandingPage workspace={workspace} path="/satis-ve-muzakere" />
  );
}
