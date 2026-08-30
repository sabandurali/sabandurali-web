import type { Metadata } from "next";
import Link from "next/link";
import ArticleCard from "@/components/articles/ArticleCard";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { AreaIcon } from "@/components/sections/FocusAreas";
import { getAbsoluteUrl } from "@/config/site";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { articlePageContent } from "@/content/articles/article-page-content";
import { homeContent } from "@/content/homeContent";
import PhotoCard from "@/components/photos/PhotoCard";
import { getAllPublishedPhotos } from "@/content/photos/photo-data-source";
import type { Workspace, WorkspaceEntry } from "@/content/workspaces";

function EntryCard({ entry }: { entry: WorkspaceEntry }) {
  return <Link href={entry.href} className="group flex min-h-52 flex-col border border-border bg-surface p-5 transition-colors hover:border-accent sm:p-6"><h2 className="text-2xl text-ivory">{entry.title}</h2><p className="mt-3 text-sm leading-6 text-muted">{entry.description}</p><span className="mt-auto pt-6 text-sm font-medium text-accent-soft group-hover:text-accent">Bölümü aç →</span></Link>;
}

export function createWorkspaceMetadata(title: string, description: string, path: string): Metadata {
  return { title: `${title} | Şaban Durali`, description, alternates: { canonical: getAbsoluteUrl(path) } };
}

export async function WorkspaceLandingPage({ workspace, path }: { workspace: Workspace; path: string }) {
  const home = homeContent.tr;
  return <div id="top" lang="tr"><Header locale="tr" anchors={home.anchors} content={home.header} homeHref="/" anchorPrefix="/" languageHrefs={{ tr: path, en: "/en" }} /><main className="px-4 py-10 sm:px-6 sm:py-14 lg:py-18"><div className="mx-auto max-w-6xl"><nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/calisma-alanlari" className="text-accent-soft hover:text-ivory">Çalışma Alanları</Link><span aria-hidden="true"> / </span><span>{workspace.title}</span></nav><header className="border-b border-border py-10 sm:py-14"><div className="flex size-14 items-center justify-center border border-accent bg-surface text-accent-soft"><AreaIcon icon={workspace.icon} className="size-7" /></div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">{workspace.eyebrow}</p><h1 className="mt-4 text-5xl text-ivory sm:text-6xl">{workspace.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{workspace.description}</p></header><section className="grid gap-5 py-10 sm:py-14 md:grid-cols-2 lg:grid-cols-3">{workspace.entries.map((entry) => <EntryCard key={entry.slug} entry={entry} />)}</section></div></main><Footer id={home.anchors.contact} content={home.footer} /><BackToTop label={home.backToTopLabel} /></div>;
}

export async function WorkspaceEntryPage({ workspace, entry }: { workspace: Workspace; entry: WorkspaceEntry }) {
  const home = homeContent.tr;
  const articles = entry.articleCategory === undefined ? [] : (await getAllPublishedArticles("tr")).filter((article) => article.categories.some((category) => category.slug === entry.articleCategory));
  const photos = entry.photoCategory === undefined ? [] : (await getAllPublishedPhotos("tr")).filter((photo) => photo.collections.some((collection) => collection.slug === entry.photoCategory) || photo.tags.some((tag) => tag.slug === entry.photoCategory));
  const hasFeed = entry.articleCategory !== undefined || entry.photoCategory !== undefined;
  return <div id="top" lang="tr"><Header locale="tr" anchors={home.anchors} content={home.header} homeHref="/" anchorPrefix="/" languageHrefs={{ tr: entry.href, en: "/en" }} /><main className="px-4 py-10 sm:px-6 sm:py-14 lg:py-18"><div className="mx-auto max-w-6xl"><nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/calisma-alanlari" className="text-accent-soft hover:text-ivory">Çalışma Alanları</Link><span aria-hidden="true"> / </span><Link href={`/${workspace.key}`} className="text-accent-soft hover:text-ivory">{workspace.title}</Link><span aria-hidden="true"> / </span><span>{entry.title}</span></nav><header className="border-b border-border py-10 sm:py-14"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">{workspace.title}</p><h1 className="mt-4 text-5xl text-ivory sm:text-6xl">{entry.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{entry.description}</p></header>{!hasFeed ? <section className="py-10 sm:py-14"><p className="max-w-3xl border border-border bg-surface p-6 leading-7 text-muted">Bu bölüm için yayınlanmış içerik ve araçlar eklendikçe burada erişilebilir olacak.</p></section> : <section className="py-10 sm:py-14">{articles.length === 0 && photos.length === 0 ? <p className="max-w-3xl border border-border bg-surface p-6 leading-7 text-muted">Bu başlıkta henüz yayınlanmış içerik bulunmuyor.</p> : <><div className="grid gap-6 lg:grid-cols-2">{articles.map((article) => <ArticleCard key={article.id} article={article} content={articlePageContent.tr} />)}</div><div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo) => <PhotoCard key={photo.id} photo={photo} />)}</div></>}</section>}</div></main><Footer id={home.anchors.contact} content={home.footer} /><BackToTop label={home.backToTopLabel} /></div>;
}
