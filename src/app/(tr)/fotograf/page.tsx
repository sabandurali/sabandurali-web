import type { Metadata } from "next";
import { WorkspaceLandingPage, createWorkspaceMetadata } from "@/components/workspaces/WorkspacePage";
import { getWorkspace } from "@/content/workspaces";

const workspace = getWorkspace("fotograf")!;
export const metadata: Metadata = createWorkspaceMetadata(workspace.title, workspace.description, "/fotograf");
export default function PhotographyWorkspacePage() { return <WorkspaceLandingPage workspace={workspace} path="/fotograf" />; }
