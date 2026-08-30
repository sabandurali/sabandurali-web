import type { Metadata } from "next";
import { WorkspaceIndexPage, createWorkspaceMetadata } from "@/components/workspaces/WorkspacePage";
import { workspacePath } from "@/content/workspaces";

export const metadata: Metadata = createWorkspaceMetadata("Çalışma Alanları", "Şaban Durali platformunun altı ana çalışma alanı.", workspacePath);

export default function WorkspacesPage() {
  return <WorkspaceIndexPage />;
}
