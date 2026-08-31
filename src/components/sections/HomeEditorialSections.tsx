import Link from "next/link";
import Image from "next/image";
import { AreaIcon } from "./FocusAreas";
import { districts, getDistrictsBySide } from "@/content/districts/district-registry";
import { districtGuidePath, getDistrictPath } from "@/content/districts/district-routes";

const intelligenceItems = [
  ["Değerleme Analizleri", "/gayrimenkul-ve-istanbul/gayrimenkul-rehberleri", "network"],
  ["Yatırım Analizleri", "/gayrimenkul-ve-istanbul/arastirmalar", "research"],
  ["Kira & Getiri Analizleri", null, "network"],
  ["Mahalle Analizleri", districtGuidePath, "city"],
  ["İmar & Plan Bilgileri", "/gayrimenkul-ve-istanbul/sehir-ve-imar", "city"],
  ["Piyasa Araştırmaları", "/arastirma-ve-analiz", "research"],
] as const;

const plannedTools = ["Kira Çarpanı Hesapla", "ROI Hesapla", "İlçe Karşılaştır"] as const;

export function SectionMark({ children }: { children: string }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-soft">{children}</p>;
}

export function IstanbulDiscovery() {
  const featured = ["esenler", "arnavutkoy", "kadikoy"].map((slug) => districts.find((district) => district.slug === slug)).filter((district): district is (typeof districts)[number] => district !== undefined);
  const european = getDistrictsBySide("avrupa").length;
  const asian = getDistrictsBySide("anadolu").length;

  return <section className="bg-ivory text-ink"><div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
    <div className="grid gap-10 border-b border-[var(--accent-border-soft)] pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:pb-14">
      <div><SectionMark>01 / İstanbul’u Keşfet</SectionMark><h2 className="mt-5 text-[2.7rem] font-semibold leading-[.96] sm:text-6xl">39 İlçe.<br />Derinlemesine rehberler.</h2></div>
      <div className="self-end"><p className="max-w-xl text-lg leading-8 text-muted-dark">İstanbul’u ilçe ölçeğinde, doğrulanmış kaynaklar ve yayınlanan içeriklerle incelemek için bir başlangıç noktası.</p><dl className="mt-7 flex gap-8 border-l-2 border-accent pl-5 text-sm"><div><dt className="font-serif text-3xl text-ink">{european}</dt><dd className="mt-1 text-muted-dark">Avrupa Yakası</dd></div><div><dt className="font-serif text-3xl text-ink">{asian}</dt><dd className="mt-1 text-muted-dark">Anadolu Yakası</dd></div></dl></div>
    </div>
    <div className="mt-8 grid gap-px border border-[var(--accent-border-soft)] bg-[var(--accent-border-soft)] sm:grid-cols-3">
      {featured.map((district) => <Link key={district.slug} href={getDistrictPath(district.slug)} className="group bg-ivory p-6 transition-colors hover:bg-ivory-soft sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-accent-deep">İlçe rehberi</p><h3 className="mt-10 font-serif text-3xl text-ink">{district.name}</h3><span className="mt-6 inline-flex text-sm font-semibold text-accent-deep group-hover:text-ink">Rehberi aç <span aria-hidden="true">&nbsp;→</span></span></Link>)}
    </div>
    <Link href={districtGuidePath} className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-accent-deep underline decoration-[var(--accent-border-soft)] underline-offset-4 hover:text-ink">Tüm İlçeler →</Link>
  </div></section>;
}

export function RealEstateIntelligence() {
  return <section className="bg-background"><div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24"><SectionMark>02 / Gayrimenkul Intelligence</SectionMark><div className="mt-5 flex flex-col gap-5 border-b border-border pb-10 sm:flex-row sm:items-end sm:justify-between"><h2 className="max-w-3xl text-[2.7rem] font-semibold leading-[.96] text-ivory sm:text-6xl">Veriye dayalı kararlar.<br />Daha doğru gayrimenkul analizi.</h2><Link href="/gayrimenkul-ve-istanbul" className="min-h-11 text-sm font-semibold text-accent-soft underline decoration-border underline-offset-4 hover:text-ivory">Alanı keşfet →</Link></div><div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">{intelligenceItems.map(([title, href, icon]) => href === null ? <div key={title} aria-disabled="true" className="min-h-40 bg-surface p-5 opacity-70 sm:p-6"><span className="flex size-9 items-center justify-center border border-border text-muted"><AreaIcon icon={icon} className="size-4" /></span><h3 className="mt-6 font-serif text-2xl leading-tight text-ivory">{title}</h3><span className="mt-3 inline-block text-sm text-muted">Yakında</span></div> : <Link key={title} href={href} className="group min-h-40 bg-surface p-5 transition-colors hover:bg-surface-soft sm:p-6"><span className="flex size-9 items-center justify-center border border-accent/50 text-accent-soft"><AreaIcon icon={icon} className="size-4" /></span><h3 className="mt-6 font-serif text-2xl leading-tight text-ivory">{title}</h3><span className="mt-3 inline-block text-sm text-muted group-hover:text-accent-soft">İncele →</span></Link>)}</div><div className="mt-5 flex flex-wrap gap-2">{plannedTools.map((tool) => <span key={tool} aria-disabled="true" className="border border-border px-3 py-2 text-xs font-medium text-muted">{tool} <span className="ml-1 text-accent-soft">Yakında</span></span>)}</div></div></section>;
}

export function KnowledgeLibrary() {
  const cards = [["Araştırmalar & Analizler", "Veriyi, şehirleri ve güncel başlıkları kaynak temelli inceleyen yayın alanı.", "/arastirma-ve-analiz", "/workspaces/arastirma-analiz.jpg"], ["Kitaplar & Öğrenme", "Kitap incelemeleri, öğrenme pratikleri ve düşünme notları.", "/kitaplar-ve-ogrenme", "/workspaces/kitaplar-ogrenme.jpg"], ["Yapay Zekâ & Teknoloji", "Dijital üretim ve teknolojinin pratik kullanımına yönelik yayınlar.", "/yapay-zeka-ve-teknoloji", "/workspaces/yapay-zeka-teknoloji.jpg"]] as const;
  return <section className="bg-ivory-soft text-ink"><div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24"><SectionMark>04 / Bilgi Kütüphanesi</SectionMark><h2 className="mt-5 text-[2.7rem] font-semibold leading-[.96] sm:text-6xl">Öğren.<br />Keşfet.<br />Geliştir.</h2><div className="mt-10 grid gap-5 lg:grid-cols-3">{cards.map(([title, description, href, image], index) => <Link key={title} href={href} className={`group relative flex min-h-72 flex-col overflow-hidden border border-[var(--accent-border-soft)] p-6 transition-transform hover:-translate-y-0.5 sm:p-8 ${index === 1 ? "bg-background text-ivory" : "bg-ivory text-ink"}`}><Image src={image} alt="" fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover opacity-15 transition-transform duration-300 group-hover:scale-[1.02]" /><span className={`relative text-[10px] font-semibold uppercase tracking-[.2em] ${index === 1 ? "text-accent-soft" : "text-accent-deep"}`}>0{index + 1}</span><span className="relative mt-auto"><span className="block font-serif text-3xl leading-tight">{title}</span><span className={index === 1 ? "mt-4 block text-sm leading-6 text-muted" : "mt-4 block text-sm leading-6 text-muted-dark"}>{description}</span><span className={`mt-6 block text-sm font-semibold ${index === 1 ? "text-accent-soft" : "text-accent-deep"}`}>Alanı aç →</span></span></Link>)}</div></div></section>;
}
