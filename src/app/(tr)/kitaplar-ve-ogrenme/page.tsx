import type { Metadata } from "next";
import { WorkspaceLandingPage, createWorkspaceMetadata } from "@/components/workspaces/WorkspacePage";
import { getWorkspace } from "@/content/workspaces";

const workspace = getWorkspace("kitaplar-ve-ogrenme")!;
export const metadata: Metadata = createWorkspaceMetadata(workspace.title, workspace.description, "/kitaplar-ve-ogrenme");
export default function BooksLearningPage() { return <WorkspaceLandingPage workspace={workspace} path="/kitaplar-ve-ogrenme" />; }
