import type { Metadata } from "next";
import Link from "next/link";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { getAbsoluteUrl } from "@/config/site";
import { getDistrictsBySide } from "@/content/districts/district-registry";
import { getDistrictPath, districtGuidePath } from "@/content/districts/district-routes";
import { homeContent } from "@/content/homeContent";

export const metadata: Metadata = { title: "İstanbul İlçe Rehberi | Şaban Durali", description: "İstanbul’un 39 ilçesi için kaynak temelli ilçe rehberleri.", alternates: { canonical: getAbsoluteUrl(districtGuidePath) } };

function DistrictGroup({ title, slugs }: { title: string; slugs: ReturnType<typeof getDistrictsBySide> }) { return <section><h2 className="text-3xl text-ivory">{title}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{slugs.map((district) => <Link key={district.slug} href={getDistrictPath(district.slug)} className="group border border-border bg-surface p-5 transition-colors hover:border-accent"><p className="text-xs uppercase tracking-[0.16em] text-accent-soft">İlçe Rehberi</p><h3 className="mt-2 text-2xl text-ivory">{district.name}</h3><span className="mt-5 inline-block text-sm text-muted group-hover:text-accent-soft">Rehberi aç →</span></Link>)}</div></section>; }

export default function DistrictIndexPage() { const home = homeContent.tr; return <div id="top" lang="tr"><Header locale="tr" anchors={home.anchors} content={home.header} homeHref="/" anchorPrefix="/" languageHrefs={{ tr: districtGuidePath, en: "/en" }} /><main className="px-4 py-10 sm:px-6 sm:py-14 lg:py-18"><div className="mx-auto max-w-6xl"><header className="border-b border-border pb-10"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">İstanbul</p><h1 className="mt-4 text-5xl text-ivory sm:text-6xl">İstanbul İlçe Rehberi</h1><p className="mt-5 max-w-3xl text-lg text-muted">39 ilçeyi, doğrulanmış içerik ve kaynaklarla takip etmek için sade bir başlangıç noktası.</p></header><div className="space-y-14 py-12"><DistrictGroup title="Avrupa Yakası" slugs={getDistrictsBySide("avrupa")} /><DistrictGroup title="Anadolu Yakası" slugs={getDistrictsBySide("anadolu")} /></div></div></main><Footer id={home.anchors.contact} content={home.footer} /><BackToTop label={home.backToTopLabel} /></div>; }
