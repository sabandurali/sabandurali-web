import Link from "next/link";
import BackToTop from "@/components/layout/BackToTop";
import DistrictNewsCard from "@/components/districts/DistrictNewsCard";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { districtGuidePath, getDistrictPath } from "@/content/districts/district-routes";
import type { District } from "@/content/districts/district-registry";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { homeContent } from "@/content/homeContent";

const pageSize = 12;

export default function DistrictNewsListPage({ district, news, page }: { district: District; news: PublicArticleSummary[]; page: number }) {
  const home = homeContent.tr;
  const totalPages = Math.max(1, Math.ceil(news.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const visibleNews = news.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const href = (target: number) => `${getDistrictPath(district.slug)}/haberler${target === 1 ? "" : `?sayfa=${target}`}`;
  return <div id="top" lang="tr">
    <Header locale="tr" anchors={home.anchors} content={home.header} homeHref="/" anchorPrefix="/" languageHrefs={{ tr: href(currentPage), en: "/en" }} />
    <main className="bg-[#11273A] px-4 py-10 [--surface:#1D3D55] sm:px-6 sm:py-14 lg:py-18"><div className="mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link className="text-accent-soft hover:text-ivory" href={districtGuidePath}>İstanbul İlçe Rehberi</Link><span aria-hidden="true"> / </span><Link className="text-accent-soft hover:text-ivory" href={getDistrictPath(district.slug)}>{district.name}</Link><span aria-hidden="true"> / </span><span>İlçeden Haberler</span></nav>
      <header className="border-b border-border py-10 sm:py-14"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">07 — İLÇEDEN HABERLER</p><h1 className="mt-4 text-5xl text-ivory">{district.name} Haberleri</h1><p className="mt-4 max-w-3xl text-muted">Başlık, özgün kısa özet, tarih ve kaynak bağlantılarıyla yerel gelişmeler.</p></header>
      {visibleNews.length === 0 ? <p className="mt-8 border border-border bg-surface p-5 text-muted">Bu ilçe için yayımlanmış haber bulunmuyor.</p> : <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visibleNews.map((item) => <DistrictNewsCard key={item.id} news={item} />)}</div>}
      {totalPages > 1 && <nav aria-label="Sayfalar" className="mt-8 flex gap-3">{currentPage > 1 && <Link className="border border-border px-4 py-2 text-accent-soft" href={href(currentPage - 1)}>← Önceki</Link>}{currentPage < totalPages && <Link className="border border-border px-4 py-2 text-accent-soft" href={href(currentPage + 1)}>Sonraki →</Link>}</nav>}
    </div></main><Footer id={home.anchors.contact} content={home.footer} /><BackToTop label={home.backToTopLabel} />
  </div>;
}
