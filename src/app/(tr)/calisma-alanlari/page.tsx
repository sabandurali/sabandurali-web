import type { Metadata } from "next";
import { WorkspaceLandingPage, createWorkspaceMetadata } from "@/components/workspaces/WorkspacePage";
import { workspaces, workspacePath } from "@/content/workspaces";

export const metadata: Metadata = createWorkspaceMetadata("Çalışma Alanları", "Şaban Durali platformunun beş ana çalışma alanı.", workspacePath);

export default function WorkspacesPage() {
  return <WorkspaceLandingPage workspace={{ key: "arastirma-ve-analiz", title: "Çalışma Alanları", eyebrow: "Platform yapısı", description: "Şaban Durali platformunun beş ana çalışma alanına buradan erişin.", icon: "network", entries: workspaces.map((workspace) => ({ slug: workspace.key, title: workspace.title, description: workspace.description, href: `/${workspace.key}` })) }} path={workspacePath} />;
}
