import type { Metadata } from "next";
import {
  WorkspaceLandingPage,
  createWorkspaceMetadata,
} from "@/components/workspaces/WorkspacePage";
import { requireWorkspace } from "@/components/workspaces/workspace-routes";

const workspace = requireWorkspace("arastirma-ve-analiz");

export const metadata: Metadata = createWorkspaceMetadata(
  workspace.title,
  workspace.description,
  "/arastirma-ve-analiz",
);

export default function ResearchPage() {
  return (
    <WorkspaceLandingPage workspace={workspace} path="/arastirma-ve-analiz" />
  );
}
