import type { Metadata } from "next";
import { WorkspaceLandingPage, createWorkspaceMetadata } from "@/components/workspaces/WorkspacePage";
import { getWorkspace } from "@/content/workspaces";

const workspace = getWorkspace("yapay-zeka-ve-teknoloji")!;
export const metadata: Metadata = createWorkspaceMetadata(workspace.title, workspace.description, "/yapay-zeka-ve-teknoloji");
export default function TechnologyPage() { return <WorkspaceLandingPage workspace={workspace} path="/yapay-zeka-ve-teknoloji" />; }
