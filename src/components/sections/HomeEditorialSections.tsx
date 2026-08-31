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

  return <section className="bg-ivory text-ink"><div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
    <div className="grid gap-6 border-b border-[var(--accent-border-soft)] pb-6 lg:grid-cols-[0.9fr_1.1fr] lg:pb-8">
      <div><SectionMark>01 / İstanbul’u Keşfet</SectionMark><h2 className="mt-3 text-[2.25rem] font-semibold leading-[.96] sm:text-5xl">39 İlçe.<br />Derinlemesine rehberler.</h2></div>
      <div className="self-end"><p className="max-w-xl text-base leading-7 text-muted-dark">İstanbul’u ilçe ölçeğinde, doğrulanmış kaynaklar ve yayınlanan içeriklerle incelemek için bir başlangıç noktası.</p><dl className="mt-5 flex gap-8 border-l-2 border-accent pl-5 text-sm"><div><dt className="font-serif text-2xl text-ink">{european}</dt><dd className="mt-1 text-muted-dark">Avrupa Yakası</dd></div><div><dt className="font-serif text-2xl text-ink">{asian}</dt><dd className="mt-1 text-muted-dark">Anadolu Yakası</dd></div></dl></div>
    </div>
    <div className="mt-6 grid gap-px border border-[var(--accent-border-soft)] bg-[var(--accent-border-soft)] sm:grid-cols-3">
      {featured.map((district) => <Link key={district.slug} href={getDistrictPath(district.slug)} className="group bg-ivory p-4 transition-colors hover:bg-ivory-soft sm:p-5"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-accent-deep">İlçe rehberi</p><h3 className="mt-5 font-serif text-2xl text-ink">{district.name}</h3><span className="mt-4 inline-flex text-xs font-semibold text-accent-deep group-hover:text-ink">Detaylı Rehber <span aria-hidden="true">&nbsp;→</span></span></Link>)}
    </div>
    <Link href={districtGuidePath} className="mt-5 inline-flex min-h-9 items-center text-sm font-semibold text-accent-deep underline decoration-[var(--accent-border-soft)] underline-offset-4 hover:text-ink">Tüm İlçeler →</Link>
  </div></section>;
}

export function RealEstateIntelligence() {
  return <section className="bg-background"><div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14"><SectionMark>02 / Gayrimenkul Intelligence</SectionMark><div className="mt-3 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><h2 className="max-w-3xl text-[2.25rem] font-semibold leading-[.96] text-ivory sm:text-5xl">Veriye dayalı kararlar.<br />Daha doğru gayrimenkul analizi.</h2><Link href="/gayrimenkul-ve-istanbul" className="min-h-9 text-sm font-semibold text-accent-soft underline decoration-border underline-offset-4 hover:text-ivory">Alanı keşfet →</Link></div><div className="mt-6 grid gap-px border border-border bg-border grid-cols-2 lg:grid-cols-3">{intelligenceItems.map(([title, href, icon]) => href === null ? <div key={title} aria-disabled="true" className="min-h-28 bg-surface p-4 opacity-70 sm:p-5"><span className="flex size-7 items-center justify-center border border-border text-muted"><AreaIcon icon={icon} className="size-3.5" /></span><h3 className="mt-4 font-serif text-lg leading-tight text-ivory sm:text-xl">{title}</h3><span className="mt-2 inline-block text-xs text-muted">Yakında</span></div> : <Link key={title} href={href} className="group min-h-28 bg-surface p-4 transition-colors hover:bg-surface-soft sm:p-5"><span className="flex size-7 items-center justify-center border border-accent/50 text-accent-soft"><AreaIcon icon={icon} className="size-3.5" /></span><h3 className="mt-4 font-serif text-lg leading-tight text-ivory sm:text-xl">{title}</h3><span className="mt-2 inline-block text-xs text-muted group-hover:text-accent-soft">İncele →</span></Link>)}</div><div className="mt-3 flex flex-wrap gap-2">{plannedTools.map((tool) => <span key={tool} aria-disabled="true" className="border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted">{tool} <span className="ml-1 text-accent-soft">Yakında</span></span>)}</div></div></section>;
}

export function KnowledgeLibrary() {
  const cards = [["Araştırmalar & Analizler", "Veriyi, şehirleri ve güncel başlıkları kaynak temelli inceleyen yayın alanı.", "/arastirma-ve-analiz", "/workspaces/arastirma-analiz.jpg"], ["Kitaplar & Öğrenme", "Kitap incelemeleri, öğrenme pratikleri ve düşünme notları.", "/kitaplar-ve-ogrenme", "/workspaces/kitaplar-ogrenme.jpg"], ["Yapay Zekâ & Teknoloji", "Dijital üretim ve teknolojinin pratik kullanımına yönelik yayınlar.", "/yapay-zeka-ve-teknoloji", "/workspaces/yapay-zeka-teknoloji.jpg"]] as const;
  return <section className="bg-ivory-soft text-ink"><div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14"><SectionMark>04 / Bilgi Kütüphanesi</SectionMark><div className="mt-3 grid gap-5 lg:grid-cols-[0.44fr_1fr]"><h2 className="text-[2.25rem] font-semibold leading-[.96] sm:text-5xl">Öğren.<br />Keşfet.<br />Geliştir.</h2><div className="grid gap-3 lg:grid-cols-3">{cards.map(([title, description, href, image], index) => <Link key={title} href={href} className={`group relative flex min-h-44 flex-col overflow-hidden border border-[var(--accent-border-soft)] p-4 transition-transform hover:-translate-y-0.5 sm:p-5 ${index === 1 ? "bg-background text-ivory" : "bg-ivory text-ink"}`}><Image src={image} alt="" fill sizes="(min-width: 1024px) 22vw, 100vw" className="object-cover opacity-15 transition-transform duration-300 group-hover:scale-[1.02]" /><span className={`relative text-[10px] font-semibold uppercase tracking-[.2em] ${index === 1 ? "text-accent-soft" : "text-accent-deep"}`}>0{index + 1}</span><span className="relative mt-auto"><span className="block font-serif text-xl leading-tight">{title}</span><span className={index === 1 ? "mt-2 block text-xs leading-5 text-muted" : "mt-2 block text-xs leading-5 text-muted-dark"}>{description}</span><span className={`mt-3 block text-xs font-semibold ${index === 1 ? "text-accent-soft" : "text-accent-deep"}`}>İncele →</span></span></Link>)}</div></div></div></section>;
}
