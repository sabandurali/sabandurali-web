import Link from "next/link";
import Image from "next/image";
import { AreaIcon } from "./FocusAreas";
import {
  districts,
  getDistrictsBySide,
} from "@/content/districts/district-registry";
import {
  districtGuidePath,
  getDistrictPath,
} from "@/content/districts/district-routes";

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
  return (
    <p className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-accent-soft after:h-px after:w-8 after:bg-accent/70 after:content-[''] sm:text-[10px]">
      {children}
    </p>
  );
}

export function IstanbulDiscovery() {
  const featuredImages = {
    esenler: "/workspaces/gayrimenkul-istanbul.jpg",
    arnavutkoy: "/brand/hero-istanbul-bogaz.jpg",
    kadikoy: "/workspaces/fotograf.jpg",
  } as const;
  const featured = ["esenler", "arnavutkoy", "kadikoy"]
    .map((slug) => districts.find((district) => district.slug === slug))
    .filter(
      (district): district is (typeof districts)[number] =>
        district !== undefined,
    );
  const european = getDistrictsBySide("avrupa").length;
  const asian = getDistrictsBySide("anadolu").length;

  return (
    <section
      id="istanbul"
      className="scroll-mt-14 border-b border-[var(--accent-border-soft)] bg-background text-ivory"
    >
      <div className="mx-auto grid max-w-[1440px] gap-5 px-5 py-7 sm:px-8 md:min-h-[16.5rem] md:grid-cols-[0.74fr_0.78fr_1.48fr] md:items-stretch md:gap-5 md:py-6 lg:gap-7 lg:px-10">
        <div className="flex flex-col justify-between border-l border-accent-soft pl-3">
          <div>
            <SectionMark>01 / İstanbul’u Keşfet</SectionMark>
            <h2 className="mt-3 text-[1.85rem] font-semibold leading-[0.98] md:text-[1.65rem] lg:text-[2rem]">
              39 İlçe.
              <br />
              Derinlemesine rehberler.
            </h2>
          </div>
          <p className="mt-4 max-w-xs text-xs leading-5 text-muted md:text-[11px] lg:text-sm lg:leading-6">
            İstanbul’un Avrupa ve Anadolu yakalarındaki 39 ilçesine dair doğrulanmış rehberler.
          </p>
          <Link
            href={districtGuidePath}
            className="mt-4 inline-flex min-h-8 items-center self-start text-[10px] font-semibold text-accent-soft hover:text-ivory"
          >
            Tüm İlçeler →
          </Link>
        </div>

        <div className="min-w-0 md:border-l md:border-border md:pl-3">
          <div className="grid min-h-48 grid-cols-[1.2fr_0.8fr] items-center border border-border bg-surface px-4 py-5 md:h-full md:min-h-0 md:px-4 md:py-5 lg:px-5">
          <svg
            aria-hidden="true"
            viewBox="0 0 320 150"
            className="h-auto w-full text-accent-soft"
          >
            <path d="M8 82C34 63 64 66 86 48c21-17 42-12 61-30 9 24 4 42-13 55-26 19-59 18-82 38-14 12-28 13-44 8Z" fill="currentColor" opacity=".14" />
            <path d="M178 30c26 10 49 5 72 20 20 13 37 15 62 16-8 24-30 27-50 28-31 2-45 25-76 25-16 0-29-6-41-17 19-20 29-42 33-72Z" fill="currentColor" opacity=".14" />
            <path d="M151 18c8 26 9 48-2 67-8 14-7 32 8 51" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M23 96c35-4 59-16 82-36m89 45c27-15 55-21 88-20" fill="none" stroke="currentColor" strokeDasharray="4 8" opacity=".6" />
          </svg>
            <dl className="grid gap-2 border-l border-border pl-3 text-[9px]">
            <div>
              <dt className="font-serif text-2xl leading-none text-ivory lg:text-3xl">{european}</dt>
              <dd className="mt-1 text-muted">Avrupa Yakası</dd>
            </div>
            <div>
              <dt className="font-serif text-2xl leading-none text-ivory lg:text-3xl">{asian}</dt>
              <dd className="mt-1 text-muted">Anadolu Yakası</dd>
            </div>
            </dl>
          </div>
        </div>

        <div className="min-w-0 md:border-l md:border-border md:pl-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted">
            Öne çıkan ilçe rehberleri
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {featured.map((district) => (
              <Link
                key={district.slug}
                href={getDistrictPath(district.slug)}
                  className="group relative min-h-36 overflow-hidden border border-border bg-surface sm:min-h-44 md:min-h-[11.5rem]"
              >
                <Image
                  src={featuredImages[district.slug as keyof typeof featuredImages]}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 15vw, 30vw"
                  className="object-cover opacity-55 transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,12,22,0.94),rgba(5,12,22,0.06)_72%)]" />
                <span className="absolute inset-x-0 bottom-0 p-3 lg:p-4">
                  <span className="block text-[8px] font-semibold uppercase tracking-[0.16em] text-accent-soft">
                    İlçe rehberi
                  </span>
                  <span className="mt-1 block font-serif text-base leading-tight text-ivory sm:text-lg lg:text-xl">
                    {district.name}
                  </span>
                  <span className="mt-2 block text-[9px] font-semibold text-ivory group-hover:text-accent-soft">
                    Detaylı Rehber →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function RealEstateIntelligence() {
  return (
    <section
      id="gayrimenkul-intelligence"
      className="scroll-mt-14 border-b border-[var(--accent-border-soft)] bg-background"
    >
      <div className="mx-auto grid max-w-[1440px] gap-5 px-5 py-7 sm:px-8 md:min-h-[13rem] md:grid-cols-[0.72fr_2.28fr] md:gap-5 md:py-6 lg:grid-cols-[0.68fr_2.62fr] lg:gap-7 lg:px-10">
        <div className="flex flex-col justify-between border-l border-accent-soft pl-3">
          <div>
            <SectionMark>02 / Gayrimenkul Intelligence</SectionMark>
            <h2 className="mt-3 text-[1.85rem] font-semibold leading-[0.98] text-ivory md:text-[1.65rem] lg:text-[2rem]">
              Veriye dayalı kararlar.
              <br />
              Daha doğru analiz.
            </h2>
          </div>
          <Link
            href="/gayrimenkul-ve-istanbul"
            className="mt-4 inline-flex min-h-8 items-center self-start text-[10px] font-semibold text-accent-soft hover:text-ivory"
          >
            Alanı keşfet →
          </Link>
        </div>

        <div className="min-w-0 md:border-l md:border-border md:pl-3">
          <div className="grid grid-cols-2 gap-px border border-[var(--accent-border-soft)] bg-[var(--accent-border-soft)] sm:grid-cols-3 lg:grid-cols-6">
            {intelligenceItems.map(([title, href, icon]) => {
              const body = (
                <>
                  <span className="flex size-8 items-center justify-center border border-accent/40 text-accent-soft">
                    <AreaIcon icon={icon} className="size-4" />
                  </span>
                  <h3 className="mt-4 font-serif text-sm leading-[1.12] text-ivory sm:text-base">
                    {title}
                  </h3>
                  <span className="mt-2 block text-[9px] text-muted group-hover:text-accent-soft">
                    {href === null ? "Yakında" : "İncele →"}
                  </span>
                </>
              );

              return href === null ? (
                <div key={title} aria-disabled="true" className="group min-h-28 bg-surface p-4 opacity-70">
                  {body}
                </div>
              ) : (
                <Link key={title} href={href} className="group min-h-28 bg-surface p-4 transition-colors hover:bg-surface-soft">
                  {body}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-px border border-[var(--accent-border-soft)] bg-[var(--accent-border-soft)]">
            {plannedTools.map((tool) => (
              <span key={tool} aria-disabled="true" className="bg-surface px-3 py-2.5 text-[8px] font-medium text-muted sm:text-[10px]">
                {tool} <span className="text-accent-soft">· Yakında</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function KnowledgeLibrary() {
  const cards = [
    ["Araştırmalar & Analizler", "Piyasa, şehir ve teknoloji odağında kaynak temelli çalışmalar.", "/arastirma-ve-analiz", "/workspaces/arastirma-analiz.jpg"],
    ["Kitaplar & Öğrenme", "Okuma notları, kitap incelemeleri ve sürekli öğrenme içerikleri.", "/kitaplar-ve-ogrenme", "/workspaces/kitaplar-ogrenme.jpg"],
    ["Yapay Zekâ & Teknoloji", "Dijital dönüşüm, üretken yapay zekâ ve teknoloji notları.", "/yapay-zeka-ve-teknoloji", "/workspaces/yapay-zeka-teknoloji.jpg"],
  ] as const;

  return (
    <section
      id="bilgi-kutuphanesi"
      className="scroll-mt-14 border-b border-[var(--accent-border-soft)] bg-background text-ivory"
    >
      <div className="mx-auto grid max-w-[1440px] gap-4 px-5 py-5 sm:px-8 md:min-h-[14.5rem] md:grid-cols-[0.72fr_2.28fr] md:gap-5 md:py-6 lg:grid-cols-[0.68fr_2.62fr] lg:gap-7 lg:px-10">
        <div className="border-l border-accent-soft pl-3">
          <SectionMark>04 / Bilgi Kütüphanesi</SectionMark>
          <h2 className="mt-3 text-[1.85rem] font-semibold leading-[0.98] md:text-[1.65rem] lg:text-[2rem]">
            Öğren.
            <br />Keşfet.
            <br />Geliştir.
          </h2>
        </div>
        <div className="grid min-w-0 gap-3 md:border-l md:border-border md:pl-5 sm:grid-cols-3">
          {cards.map(([title, description, href, image], index) => (
            <Link
              key={title}
              href={href}
              className="group relative min-h-36 overflow-hidden border border-[var(--accent-border-soft)] bg-surface p-4 sm:min-h-48 sm:p-5 md:min-h-40 lg:p-5"
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 1024px) 24vw, 100vw"
                className="object-cover opacity-40 transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,12,22,0.98),rgba(5,12,22,0.34)_85%)]" />
              <span className="relative flex h-full min-h-28 flex-col justify-between">
                <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-accent-soft">
                  0{index + 1}
                </span>
                <span>
                  <span className="block font-serif text-xl leading-tight text-ivory lg:text-2xl">
                    {title}
                  </span>
                  <span className="mt-3 block max-w-sm text-[10px] leading-4 text-muted lg:text-xs lg:leading-5">
                    {description}
                  </span>
                  <span className="mt-3 block text-[10px] font-semibold text-accent-soft">
                    Alanı aç →
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
