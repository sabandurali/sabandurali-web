import type { Metadata } from "next";
import { WorkspaceLandingPage, createWorkspaceMetadata } from "@/components/workspaces/WorkspacePage";
import { getWorkspace } from "@/content/workspaces";

const workspace = getWorkspace("arastirma-ve-analiz")!;
export const metadata: Metadata = createWorkspaceMetadata(workspace.title, workspace.description, "/arastirma-ve-analiz");
export default function ResearchPage() { return <WorkspaceLandingPage workspace={workspace} path="/arastirma-ve-analiz" />; }
