import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceEntryPage, createWorkspaceMetadata } from "@/components/workspaces/WorkspacePage";
import { getWorkspace, getWorkspaceEntry } from "@/content/workspaces";

type Props = { params: Promise<{ section: string }> };
const workspace = getWorkspace("yapay-zeka-ve-teknoloji")!;
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { section } = await params; const entry = getWorkspaceEntry(workspace.key, section); return entry === null ? { title: "Sayfa bulunamadı | Şaban Durali", robots: { index: false, follow: false } } : createWorkspaceMetadata(entry.title, entry.description, entry.href); }
export default async function TechnologySectionPage({ params }: Props) { const { section } = await params; const entry = getWorkspaceEntry(workspace.key, section); if (entry === null) notFound(); return <WorkspaceEntryPage workspace={workspace} entry={entry} />; }
