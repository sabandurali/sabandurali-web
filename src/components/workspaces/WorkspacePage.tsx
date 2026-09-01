import type { Metadata } from "next";
import Link from "next/link";
import ArticleCard from "@/components/articles/ArticleCard";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import PhotoCard from "@/components/photos/PhotoCard";
import { AreaIcon } from "@/components/sections/FocusAreas";
import { getAbsoluteUrl } from "@/config/site";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { articlePageContent } from "@/content/articles/article-page-content";
import { homeContent } from "@/content/homeContent";
import { getAllPublishedPhotos } from "@/content/photos/photo-data-source";
import type { Workspace, WorkspaceEntry, WorkspaceKey } from "@/content/workspaces";
import { workspacePath, workspaces } from "@/content/workspaces";

const workspaceThemes: Record<WorkspaceKey, { background: string; surface: string }> = {
  "gayrimenkul-ve-istanbul": { background: "bg-[#16324A]", surface: "bg-[#1E405B]" },
  "satis-ve-muzakere": { background: "bg-[#3A2E2B]", surface: "bg-[#4A3A35]" },
  "arastirma-ve-analiz": { background: "bg-[#2B3448]", surface: "bg-[#354159]" },
  "yapay-zeka-ve-teknoloji": { background: "bg-[#242E46]", surface: "bg-[#303D5B]" },
  "kitaplar-ve-ogrenme": { background: "bg-[#352B3D]", surface: "bg-[#44354D]" },
  fotograf: { background: "bg-[#173A38]", surface: "bg-[#204947]" },
};

function EntryCard({ entry, surfaceClassName }: { entry: WorkspaceEntry; surfaceClassName: string }) {
  return <Link href={entry.href} className={`group flex min-h-48 flex-col border border-border p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent-border-hover)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)] sm:p-6 ${surfaceClassName}`}><h2 className="text-2xl leading-tight text-ivory">{entry.title}</h2><p className="mt-3 text-sm leading-6 text-muted">{entry.description}</p><span className="mt-auto pt-6 text-sm font-medium text-accent-strong underline decoration-border underline-offset-4 group-hover:text-ivory">Bölümü aç →</span></Link>;
}

export function createWorkspaceMetadata(title: string, description: string, path: string): Metadata {
  return { title: `${title} | Şaban Durali`, description, alternates: { canonical: getAbsoluteUrl(path) } };
}

export async function WorkspaceLandingPage({ workspace, path }: { workspace: Workspace; path: string }) {
  const home = homeContent.tr;
  const theme = workspaceThemes[workspace.key];
  return <div id="top" lang="tr"><Header locale="tr" anchors={home.anchors} content={home.header} homeHref="/" anchorPrefix="/" languageHrefs={{ tr: path, en: "/en" }} /><main className={`px-4 py-10 sm:px-6 sm:py-14 lg:py-18 ${theme.background}`}><div className="mx-auto max-w-[1440px]"><nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/calisma-alanlari" className="text-accent-strong hover:text-ivory">Çalışma Alanları</Link><span aria-hidden="true"> / </span><span>{workspace.title}</span></nav><header className="border-b border-border py-9 sm:py-12"><div className={`flex size-12 items-center justify-center border border-accent text-accent-soft ${theme.surface}`}><AreaIcon icon={workspace.icon} className="size-6" /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">{workspace.eyebrow}</p><h1 className="mt-3 text-4xl leading-[1.04] text-ivory sm:text-6xl">{workspace.title}</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{workspace.description}</p></header><section className="grid gap-4 py-8 sm:py-10 md:grid-cols-2 lg:grid-cols-3">{workspace.entries.map((entry) => <EntryCard key={entry.slug} entry={entry} surfaceClassName={theme.surface} />)}</section></div></main><Footer id={home.anchors.contact} content={home.footer} /><BackToTop label={home.backToTopLabel} /></div>;
}

export async function WorkspaceIndexPage() {
  const home = homeContent.tr;
  return <div id="top" lang="tr"><Header locale="tr" anchors={home.anchors} content={home.header} homeHref="/" anchorPrefix="/" languageHrefs={{ tr: workspacePath, en: "/en" }} /><main className="bg-background px-4 py-10 sm:px-6 sm:py-14 lg:py-18"><div className="mx-auto max-w-[1440px]"><header className="border-b border-border py-9 sm:py-12"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">Platform yapısı</p><h1 className="mt-3 text-4xl leading-[1.04] text-ivory sm:text-6xl">Çalışma Alanları</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg sm:leading-8">Şaban Durali platformunun altı ana çalışma alanını ve bu alanların yayın girişlerini inceleyin.</p></header><section className="grid gap-4 py-8 sm:py-10 md:grid-cols-2">{workspaces.map((workspace) => <article key={workspace.key} className={`flex flex-col border border-border p-5 transition-colors hover:border-[var(--accent-border-hover)] sm:p-6 ${workspaceThemes[workspace.key].surface}`}><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">{workspace.eyebrow}</p><h2 className="mt-3 text-3xl leading-tight text-ivory"><Link href={`/${workspace.key}`} className="hover:text-accent-strong">{workspace.title}</Link></h2><p className="mt-3 text-sm leading-6 text-muted">{workspace.description}</p><ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">{workspace.entries.slice(0, 4).map((entry) => <li key={entry.slug}><Link href={entry.href} className="text-sm text-accent-strong underline decoration-border underline-offset-4 hover:text-ivory">{entry.title}</Link></li>)}</ul><Link href={`/${workspace.key}`} className="mt-auto inline-flex min-h-11 items-end pt-6 text-sm font-semibold text-accent-strong underline decoration-border underline-offset-4 hover:text-ivory">Alanı keşfet →</Link></article>)}</section></div></main><Footer id={home.anchors.contact} content={home.footer} /><BackToTop label={home.backToTopLabel} /></div>;
}

export async function WorkspaceEntryPage({ workspace, entry }: { workspace: Workspace; entry: WorkspaceEntry }) {
  const home = homeContent.tr;
  const theme = workspaceThemes[workspace.key];
  const articles = entry.articleCategory === undefined ? [] : (await getAllPublishedArticles("tr")).filter((article) => article.categories.some((category) => category.slug === entry.articleCategory));
  const photos = entry.photoCategory === undefined ? [] : (await getAllPublishedPhotos("tr")).filter((photo) => photo.collections.some((collection) => collection.slug === entry.photoCategory) || photo.tags.some((tag) => tag.slug === entry.photoCategory));
  const hasFeed = entry.articleCategory !== undefined || entry.photoCategory !== undefined;
  return <div id="top" lang="tr"><Header locale="tr" anchors={home.anchors} content={home.header} homeHref="/" anchorPrefix="/" languageHrefs={{ tr: entry.href, en: "/en" }} /><main className={`px-4 py-10 sm:px-6 sm:py-14 lg:py-18 ${theme.background}`}><div className="mx-auto max-w-6xl"><nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/calisma-alanlari" className="text-accent-strong hover:text-ivory">Çalışma Alanları</Link><span aria-hidden="true"> / </span><Link href={`/${workspace.key}`} className="text-accent-strong hover:text-ivory">{workspace.title}</Link><span aria-hidden="true"> / </span><span>{entry.title}</span></nav><header className="border-b border-border py-10 sm:py-14"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-strong">{workspace.title}</p><h1 className="mt-4 text-5xl text-ivory sm:text-6xl">{entry.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{entry.description}</p></header>{!hasFeed ? <section className="py-10 sm:py-14"><p className={`max-w-3xl border border-border p-6 leading-7 text-muted ${theme.surface}`}>Bu bölüm için yayınlanmış içerik ve araçlar eklendikçe burada erişilebilir olacak.</p></section> : <section className="py-10 sm:py-14">{articles.length === 0 && photos.length === 0 ? <p className={`max-w-3xl border border-border p-6 leading-7 text-muted ${theme.surface}`}>Bu başlıkta henüz yayınlanmış içerik bulunmuyor.</p> : <><div className="grid gap-6 lg:grid-cols-2">{articles.map((article) => <ArticleCard key={article.id} article={article} content={articlePageContent.tr} />)}</div><div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo) => <PhotoCard key={photo.id} photo={photo} />)}</div></>}</section>}</div></main><Footer id={home.anchors.contact} content={home.footer} /><BackToTop label={home.backToTopLabel} /></div>;
}
