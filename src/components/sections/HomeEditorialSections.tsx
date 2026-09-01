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

const plannedTools = ["Kira Çarpanı", "ROI", "İlçe Karşılaştır"] as const;

export function SectionMark({ children }: { children: string }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-soft">{children}</p>;
}

export function IstanbulDiscovery() {
  const featuredImages = {
    esenler: "/workspaces/gayrimenkul-istanbul.jpg",
    arnavutkoy: "/brand/hero-istanbul-bogaz.jpg",
    kadikoy: "/workspaces/fotograf.jpg",
  } as const;
  const featured = ["esenler", "arnavutkoy", "kadikoy"].map((slug) => districts.find((district) => district.slug === slug)).filter((district): district is (typeof districts)[number] => district !== undefined);
  const european = getDistrictsBySide("avrupa").length;
  const asian = getDistrictsBySide("anadolu").length;

  return <section id="istanbul" className="scroll-mt-16 bg-background text-ivory"><div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
    <div className="grid gap-7 border-y border-border py-7 lg:grid-cols-[0.72fr_0.5fr_1fr] lg:items-stretch lg:gap-8">
      <div className="flex flex-col justify-between"><div><SectionMark>01 / İstanbul’u Keşfet</SectionMark><h2 className="mt-3 text-[2.25rem] font-semibold leading-[.96] sm:text-5xl">39 İlçe.<br />Derinlemesine rehberler.</h2></div><p className="mt-6 max-w-lg text-sm leading-6 text-muted sm:text-base sm:leading-7">İstanbul’u ilçe ölçeğinde, doğrulanmış kaynaklar ve yayınlanan içeriklerle incelemek için bir başlangıç noktası.</p></div>
      <div className="flex min-h-40 flex-col justify-between border border-border bg-surface p-4 sm:p-5">
        <svg aria-hidden="true" viewBox="0 0 320 150" className="h-auto w-full text-accent-soft"><path d="M8 82C34 63 64 66 86 48c21-17 42-12 61-30 9 24 4 42-13 55-26 19-59 18-82 38-14 12-28 13-44 8Z" fill="currentColor" opacity=".14"/><path d="M178 30c26 10 49 5 72 20 20 13 37 15 62 16-8 24-30 27-50 28-31 2-45 25-76 25-16 0-29-6-41-17 19-20 29-42 33-72Z" fill="currentColor" opacity=".14"/><path d="M151 18c8 26 9 48-2 67-8 14-7 32 8 51" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M23 96c35-4 59-16 82-36m89 45c27-15 55-21 88-20" fill="none" stroke="currentColor" strokeDasharray="4 8" opacity=".6"/></svg>
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs"><div><dt className="font-serif text-2xl text-ivory">{european}</dt><dd className="mt-1 text-muted">Avrupa Yakası</dd></div><div><dt className="font-serif text-2xl text-ivory">{asian}</dt><dd className="mt-1 text-muted">Anadolu Yakası</dd></div></dl>
      </div>
      <div className="flex flex-col"><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-muted">Öne çıkan ilçe rehberleri</p><div className="mt-3 grid flex-1 grid-cols-3 gap-2 sm:gap-3">
        {featured.map((district) => <Link key={district.slug} href={getDistrictPath(district.slug)} className="group relative min-h-36 overflow-hidden border border-border bg-surface"><Image src={featuredImages[district.slug as keyof typeof featuredImages]} alt="" fill sizes="(min-width: 1024px) 14vw, 30vw" className="object-cover opacity-55 transition-transform duration-300 group-hover:scale-[1.03]" /><span className="absolute inset-0 bg-background/45" /><span className="absolute inset-x-0 bottom-0 p-3 sm:p-4"><span className="block text-[9px] font-semibold uppercase tracking-[.18em] text-accent-soft sm:text-[10px]">İlçe rehberi</span><span className="mt-1 block font-serif text-base leading-tight text-ivory sm:text-xl">{district.name}</span><span className="mt-2 block text-[9px] font-semibold leading-tight text-ivory group-hover:text-accent-soft sm:text-[11px]">Detaylı Rehber →</span></span></Link>)}
      </div><Link href={districtGuidePath} className="mt-3 inline-flex min-h-9 items-center self-start text-sm font-semibold text-accent-soft underline decoration-border underline-offset-4 hover:text-ivory">Tüm İlçeler →</Link></div>
    </div>
  </div></section>;
}

export function RealEstateIntelligence() {
  return <section id="gayrimenkul-intelligence" className="scroll-mt-16 bg-background"><div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14"><SectionMark>02 / Gayrimenkul Intelligence</SectionMark><div className="mt-3 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><h2 className="max-w-3xl text-[2.25rem] font-semibold leading-[.96] text-ivory sm:text-5xl">Veriye dayalı kararlar.<br />Daha doğru gayrimenkul analizi.</h2><Link href="/gayrimenkul-ve-istanbul" className="min-h-9 text-sm font-semibold text-accent-soft underline decoration-border underline-offset-4 hover:text-ivory">Alanı keşfet →</Link></div><div className="mt-6 grid gap-px border border-border bg-border grid-cols-2 lg:grid-cols-3">{intelligenceItems.map(([title, href, icon]) => href === null ? <div key={title} aria-disabled="true" className="min-h-28 bg-surface p-4 opacity-70 sm:p-5"><span className="flex size-7 items-center justify-center border border-border text-muted"><AreaIcon icon={icon} className="size-3.5" /></span><h3 className="mt-4 font-serif text-lg leading-tight text-ivory sm:text-xl">{title}</h3><span className="mt-2 inline-block text-xs text-muted">Yakında</span></div> : <Link key={title} href={href} className="group min-h-28 bg-surface p-4 transition-colors hover:bg-surface-soft sm:p-5"><span className="flex size-7 items-center justify-center border border-accent/50 text-accent-soft"><AreaIcon icon={icon} className="size-3.5" /></span><h3 className="mt-4 font-serif text-lg leading-tight text-ivory sm:text-xl">{title}</h3><span className="mt-2 inline-block text-xs text-muted group-hover:text-accent-soft">İncele →</span></Link>)}</div><div className="mt-3 flex flex-wrap gap-2">{plannedTools.map((tool) => <span key={tool} aria-disabled="true" className="border border-border px-2.5 py-1.5 text-[11px] font-medium text-muted">{tool} <span className="ml-1 text-accent-soft">Yakında</span></span>)}</div></div></section>;
}

export function KnowledgeLibrary() {
  const cards = [["Araştırmalar & Analizler", "Veriyi, şehirleri ve güncel başlıkları kaynak temelli inceleyen yayın alanı.", "/arastirma-ve-analiz", "/workspaces/arastirma-analiz.jpg"], ["Kitaplar & Öğrenme", "Kitap incelemeleri, öğrenme pratikleri ve düşünme notları.", "/kitaplar-ve-ogrenme", "/workspaces/kitaplar-ogrenme.jpg"], ["Yapay Zekâ & Teknoloji", "Dijital üretim ve teknolojinin pratik kullanımına yönelik yayınlar.", "/yapay-zeka-ve-teknoloji", "/workspaces/yapay-zeka-teknoloji.jpg"]] as const;
  return <section id="bilgi-kutuphanesi" className="scroll-mt-16 bg-ivory-soft text-ink"><div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14"><SectionMark>04 / Bilgi Kütüphanesi</SectionMark><div className="mt-3 grid gap-5 lg:grid-cols-[0.44fr_1fr]"><h2 className="text-[2.25rem] font-semibold leading-[.96] sm:text-5xl">Öğren.<br />Keşfet.<br />Geliştir.</h2><div className="grid gap-3 lg:grid-cols-3">{cards.map(([title, description, href, image], index) => <Link key={title} href={href} className={`group relative flex min-h-44 flex-col overflow-hidden border border-[var(--accent-border-soft)] p-4 transition-transform hover:-translate-y-0.5 sm:p-5 ${index === 1 ? "bg-background text-ivory" : "bg-ivory text-ink"}`}><Image src={image} alt="" fill sizes="(min-width: 1024px) 22vw, 100vw" className="object-cover opacity-15 transition-transform duration-300 group-hover:scale-[1.02]" /><span className={`relative text-[10px] font-semibold uppercase tracking-[.2em] ${index === 1 ? "text-accent-soft" : "text-accent-deep"}`}>0{index + 1}</span><span className="relative mt-auto"><span className="block font-serif text-xl leading-tight">{title}</span><span className={index === 1 ? "mt-2 block text-xs leading-5 text-muted" : "mt-2 block text-xs leading-5 text-muted-dark"}>{description}</span><span className={`mt-3 block text-xs font-semibold ${index === 1 ? "text-accent-soft" : "text-accent-deep"}`}>İncele →</span></span></Link>)}</div></div></div></section>;
}
