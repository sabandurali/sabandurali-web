import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { districtSectionOptions } from "@/content/districts/district-content-policy";
import type { DistrictGuide } from "@/content/districts/district-guide-data-source";
import type { District } from "@/content/districts/district-registry";
import {
  districtGuidePath,
  getDistrictNewsPath,
  getDistrictPath,
} from "@/content/districts/district-routes";
import { homeContent } from "@/content/homeContent";
import type { PublicPhoto } from "@/content/photos/types";

const sections = [
  ["genel-bakis", "Bir bakışta", "Tek bakışta"],
  ["tarihce", "İlçenin hikâyesi", "Geçmişten bugüne"],
  ["tani", "İlçeyi okumak", "Konum ve kentsel yapı"],
  ["yasam", "Gündelik yaşam ve ulaşım", "Gündelik yaşam nasıl akıyor?"],
  ["mahalleler", "Mahalleler", "Mahalleler"],
  ["gayrimenkul", "Konut ve yapılaşma", "Konut, yapılaşma ve veri"],
  ["imar", "Dönüşüm ve şehircilik", "Değişimi belgeyle izlemek"],
  ["saha", "Görülecek ve fotoğraflanacak yerler", "Sahadan bakış"],
  ["kareler", "İlçeden kareler", "Fotoğrafla kurulan ikinci anlatı"],
  ["kimlik", "İlçeyi özel kılanlar", "İlçenin karakteri"],
  ["arastirmalar", "Araştırmalar ve analizler", "Rehberden daha derine"],
  ["haberler", "İlçeden haberler", "Güncel gelişmeler"],
  ["kaynaklar", "Kaynaklar ve metodoloji", "Kaynağı görünür tutmak"],
  ["guncelleme", "Son güncelleme", "Canlı bir rehber"],
] as const;

const warmPaperTones = ["#F4F0E8", "#F5F1E9", "#F3EEE5", "#F6F2EA", "#F2EDE4", "#F5EFE6", "#F3F0E9", "#F6F1E8"] as const;
const coolPaperTones = ["#F2F1EB", "#F1F2EC", "#F3F2EC", "#EFF1EC", "#F2F0E9", "#F0F2EF", "#F3F1EA", "#EEF1ED"] as const;

function getDistrictPaperTone(district: District): string {
  if (district.slug === "esenler") return "#F4F0E8";
  const tones = district.side === "avrupa" ? warmPaperTones : coolPaperTones;
  const hash = [...district.slug].reduce((sum, character) => sum * 31 + character.charCodeAt(0), 0);
  return tones[(hash >>> 0) % tones.length];
}

const planningStatuses: Record<string, string> = {
  teklif: "Teklif",
  planlama: "Planlama",
  "belediye-meclisi-karari": "Belediye Meclisi Kararı",
  onay: "Onay",
  aski: "Askı",
  ihale: "İhale",
  insaat: "İnşaat",
  uygulama: "Uygulama",
  tamamlandi: "Tamamlandı",
  belirsiz: "Belirsiz — Doğrulama gerekli",
};

const sourceTypes = {
  official: "Resmî",
  academic: "Akademik / kurumsal",
  secondary: "İkincil",
  market: "Piyasa platformu",
  unclassified: "Sınıflandırılmadı",
};

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(date)
    : null;
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="mt-7 text-[15px] italic leading-7 text-[#64707A]">{children}</p>;
}

function Text({ value }: { value?: string | null }) {
  return value ? (
    <div className="mt-8 max-w-[820px] space-y-6 text-[17px] leading-[1.78] text-[#303A43] sm:text-[18px] sm:leading-[1.82]">
      {value
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line">
            {paragraph}
          </p>
        ))}
    </div>
  ) : (
    <EmptyState>Bu bölüm için doğrulanmış içerik henüz eklenmedi.</EmptyState>
  );
}

function Section({ index, children, heading: headingOverride }: { index: number; children: ReactNode; heading?: string }) {
  const [id, label, heading] = sections[index];
  return (
    <section id={id} className="scroll-mt-24 border-t border-[#D5CDC1] py-16 sm:py-20 lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10 lg:py-24">
      <div className="lg:pt-2">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#A8653A]">{String(index + 1).padStart(2, "0")}</p>
        <p className="mt-3 max-w-[200px] text-sm leading-6 text-[#64707A]">{label}</p>
      </div>
      <div className="mt-7 min-w-0 lg:mt-0">
        <h2 className="max-w-[820px] font-serif text-[2.1rem] font-semibold leading-[1.1] text-[#18212A] sm:text-[2.6rem]">{headingOverride ?? heading}</h2>
        {children}
      </div>
    </section>
  );
}

function PhotoCaption({ photo }: { photo: PublicPhoto }) {
  const details = [
    photo.neighborhood ?? photo.locationName,
    formatDate(photo.takenAt),
    photo.photographer,
  ].filter(Boolean);
  return (
    <figcaption className="mt-3 text-xs leading-6 text-[#64707A]">
      <span className="font-semibold text-[#18212A]">{photo.title}</span>
      {details.length > 0 ? ` · ${details.join(" · ")}` : null}
    </figcaption>
  );
}

function EditorialPhoto({ photo, priority = false }: { photo: PublicPhoto; priority?: boolean }) {
  return (
    <figure>
      <Image
        src={photo.image.src}
        alt={photo.image.alt}
        width={photo.image.width ?? 1600}
        height={photo.image.height ?? 900}
        sizes="(max-width: 820px) 100vw, 1180px"
        priority={priority}
        className="aspect-video w-full object-cover"
      />
      <PhotoCaption photo={photo} />
    </figure>
  );
}

export default function DistrictEditorialGuidePage({
  district,
  guide,
  photos,
  research,
  news,
}: {
  district: District;
  guide: DistrictGuide | null;
  photos: PublicPhoto[];
  research: PublicArticleSummary[];
  news: PublicArticleSummary[];
}) {
  const home = homeContent.tr;
  const facts = guide?.facts;
  const neighborhoods = guide?.neighborhoods ?? [];
  const heroPhoto = photos.find((photo) => photo.featured) ?? photos[0];
  const galleryPhotos = heroPhoto ? photos.filter((photo) => photo.id !== heroPhoto.id) : photos;
  const [latitude, longitude] = district.center;
  const neighborhoodCount = facts?.neighborhoodCount ?? (guide ? neighborhoods.length : null);
  const neighborhoodHeading = neighborhoodCount === null ? sections[4][2] : `${neighborhoodCount} mahalle`;
  const factItems = [
    ["Nüfus", facts?.population ?? "—", facts?.populationYear ? `${facts.populationYear} verisi` : null],
    ["Mahalle", neighborhoodCount ?? "—", "mahalle"],
    ["Yüzölçümü", facts?.areaKm2 == null ? "—" : `${facts.areaKm2} km²`, null],
    ["Yaka", district.side === "avrupa" ? "Avrupa Yakası" : "Anadolu Yakası", null],
  ] as const;

  return (
    <div id="top" lang="tr">
      <Header
        locale="tr"
        anchors={home.anchors}
        content={home.header}
        homeHref="/"
        anchorPrefix="/"
        languageHrefs={{ tr: getDistrictPath(district.slug), en: "/en" }}
      />
      <main style={{ backgroundColor: getDistrictPaperTone(district) }} className="px-4 text-[#18212A] [color-scheme:light] sm:px-6">
        <div className="mx-auto max-w-[1180px] min-w-0 break-words pb-20 pt-8 sm:pt-10 lg:pb-28">
          <nav aria-label="Breadcrumb" className="flex flex-wrap gap-x-2 gap-y-1 text-xs leading-6 text-[#64707A]">
            <Link className="hover:text-[#A8653A]" href="/">Ana Sayfa</Link><span aria-hidden="true">/</span>
            <Link className="hover:text-[#A8653A]" href="/gayrimenkul-ve-istanbul">İstanbul</Link><span aria-hidden="true">/</span>
            <Link className="hover:text-[#A8653A]" href={districtGuidePath}>İlçeler</Link><span aria-hidden="true">/</span>
            <span aria-current="page">{district.name}</span>
          </nav>

          <header className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end lg:gap-20 lg:py-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A8653A]">İstanbul · {district.side === "avrupa" ? "Avrupa Yakası" : "Anadolu Yakası"}</p>
              <h1 className="mt-5 font-serif text-[3.25rem] font-medium leading-[0.95] tracking-[-0.045em] text-[#0B1824] sm:text-[4.5rem]">{district.name}</h1>
              <p className="mt-7 max-w-[760px] text-lg leading-8 text-[#3F4A53]">{facts?.locationSummary ?? guide?.summary ?? `${district.name} için doğrulanmış rehber içeriği hazırlanıyor.`}</p>
            </div>
            <p className="border-l border-[#A8653A] pl-6 font-serif text-lg leading-8 text-[#3F4A53]">Bir ilçeyi yalnız sayılarla değil; tarih, gündelik yaşam, ulaşım, yapılaşma ve saha gözlemiyle birlikte okumak gerekir.</p>
          </header>

          {heroPhoto && <EditorialPhoto photo={heroPhoto} priority />}

          <dl className={`${heroPhoto ? "mt-14 sm:mt-16" : "mt-2 sm:mt-4"} grid grid-cols-2 border-y border-[#D5CDC1] lg:grid-cols-4`}>
            {factItems.map(([label, value, detail], index) => (
              <div key={label} className={`min-w-0 py-6 sm:px-6 lg:py-8 ${index % 2 === 1 ? "border-l border-[#D5CDC1]" : ""} ${index > 1 ? "border-t border-[#D5CDC1] lg:border-t-0" : ""} ${index === 2 ? "lg:border-l" : ""}`}>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A8653A]">{label}</dt>
                <dd className="mt-2 font-serif text-xl leading-tight text-[#18212A] sm:text-2xl">{value}</dd>
                {detail && <dd className="mt-1 text-xs text-[#64707A]">{detail}</dd>}
              </div>
            ))}
          </dl>

          <details className="group mt-12 border-b border-[#D5CDC1] pb-5 sm:mt-16">
            <summary className="cursor-pointer list-none py-2 text-sm font-semibold text-[#18212A] marker:hidden">Bu rehberde neler var? <span aria-hidden="true" className="inline-block text-[#A8653A] transition-transform group-open:rotate-180">↓</span></summary>
            <nav aria-label="Rehber bölümleri" className="mt-5 grid gap-x-10 gap-y-3 text-sm text-[#64707A] sm:grid-cols-2 lg:grid-cols-3">
              {sections.map(([id, label], index) => <a key={id} href={`#${id}`} className="py-1 hover:text-[#A8653A]">{String(index + 1).padStart(2, "0")} — {label}</a>)}
            </nav>
          </details>

          <div className="mt-16 sm:mt-20">
            <Section index={0} heading={`${district.name}: tek bakışta`}>
              <Text value={guide?.summary} />
              <p className="mt-9 max-w-[760px] border-l-2 border-[#A8653A] pl-5 text-sm leading-7 text-[#64707A]">Bu rehberde sayısal ve değişken veriler kaynak tarihleriyle birlikte okunur.</p>
            </Section>
            <Section index={1}><Text value={guide?.history} /></Section>
            <Section index={2}><Text value={guide?.geography} /></Section>
            <Section index={3}>
              <Text value={guide?.life} />
              <h3 className="mt-12 font-serif text-2xl text-[#18212A]">İstanbul&apos;a nasıl bağlanıyor?</h3>
              <Text value={guide?.transportation} />
            </Section>
            <section id="mahalleler" className="scroll-mt-24 border-t border-[#D5CDC1] py-16 sm:py-20 lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10 lg:py-24">
              <div className="lg:pt-2"><p className="text-xs font-semibold tracking-[0.2em] text-[#A8653A]">05</p><p className="mt-3 text-sm text-[#64707A]">Mahalleler</p></div>
              <div className="mt-7 min-w-0 lg:mt-0">
                <h2 className="max-w-[820px] font-serif text-[2.1rem] font-semibold leading-[1.1] sm:text-[2.6rem]">{neighborhoodHeading}</h2>
                <p className="mt-8 text-[17px] leading-[1.78] text-[#303A43] sm:text-[18px] sm:leading-[1.82]">İlçenin resmî olarak doğrulanmış mahalle listesi:</p>
                {neighborhoods.length ? (
                  <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3">
                    {neighborhoods.map((item) => <li key={item.id ?? item.name} className="border-b border-[#D5CDC1] py-5 text-base text-[#303A43] sm:mr-8">{item.name}</li>)}
                  </ul>
                ) : <EmptyState>Bu ilçe için resmî kaynaktan kontrol edilmiş tam mahalle listesi henüz eklenmedi.</EmptyState>}
                <div className="mt-12 border-y border-[#D5CDC1] py-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A8653A]">Harita referansı</p>
                  <div className="mt-4 flex flex-wrap gap-x-7 gap-y-3 text-sm">
                    <a href="https://sehirharitasi.ibb.gov.tr/" target="_blank" rel="noreferrer" className="underline decoration-[#A8653A] underline-offset-4">İBB Şehir Haritası ↗</a>
                    <a href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`} target="_blank" rel="noreferrer" className="underline decoration-[#A8653A] underline-offset-4">OpenStreetMap ↗</a>
                  </div>
                  <p className="mt-4 text-xs text-[#64707A]">Konum bağlantısı ilçe merkezini gösterir.</p>
                </div>
              </div>
            </section>
            <Section index={5}>
              <Text value={guide?.housingTexture} />
              {guide?.regionalAssessment && <Text value={guide.regionalAssessment} />}
              {guide?.marketData && (
                <dl className="mt-10 grid gap-x-8 gap-y-6 border-y border-[#D5CDC1] py-7 sm:grid-cols-2">
                  {[
                    ["Ortalama m² satış fiyatı", guide.marketData.salePricePerM2 == null ? null : `${guide.marketData.salePricePerM2.toLocaleString("tr-TR")} TL`],
                    ["Ortalama kira", guide.marketData.averageRent == null ? null : `${guide.marketData.averageRent.toLocaleString("tr-TR")} TL`],
                    ["Veri tarihi", formatDate(guide.marketData.dataDate)],
                    ["Veri kaynağı", guide.marketData.source],
                    ["Not", guide.marketData.description],
                  ].filter((item): item is [string, string] => Boolean(item[1])).map(([label, value]) => <div key={label}><dt className="text-xs uppercase tracking-[0.14em] text-[#A8653A]">{label}</dt><dd className="mt-2 text-sm leading-6 text-[#3F4A53]">{value}</dd></div>)}
                </dl>
              )}
              <p className="mt-9 max-w-[820px] border-l-2 border-[#A8653A] bg-[#ECE5DA]/60 px-5 py-4 text-sm leading-7 text-[#3F4A53]">Bu içerik yatırım tavsiyesi değildir. Gayrimenkul verileri belirtilen veri tarihindeki piyasa göstergelerini yansıtır.</p>
            </Section>
            <Section index={6}>
              {!guide?.planningDevelopments.length ? <EmptyState>Bu ilçe için kaynak ve tarihi doğrulanmış şehircilik gelişmesi henüz eklenmedi.</EmptyState> : (
                <div className="mt-9 border-t border-[#D5CDC1]">
                  {guide.planningDevelopments.map((item) => (
                    <article key={item.id ?? item.title} className="border-b border-[#D5CDC1] py-8">
                      <h3 className="font-serif text-2xl text-[#18212A]">{item.title}</h3>
                      <Text value={item.summary} />
                      <p className="mt-5 text-xs leading-6 text-[#64707A]">{[item.neighborhood, formatDate(item.date), item.status && planningStatuses[item.status], `Son kontrol: ${formatDate(item.checkedAt) ?? "Belirtilmemiş"}`].filter(Boolean).join(" · ")}</p>
                      {item.officialSource && <a href={item.officialSource} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#A8653A] underline underline-offset-4">Kaynak ↗</a>}
                    </article>
                  ))}
                </div>
              )}
              <p className="mt-8 text-sm leading-7 text-[#64707A]">Taşınmaza özgü imar durumu için ilgili kurumun güncel resmî kayıtları esas alınmalıdır.</p>
            </Section>
            <Section index={7}><Text value={guide?.placesGuide} /></Section>
            <Section index={8}>
              {!photos.length ? <EmptyState>Bu ilçeden seçilmiş fotoğraflar henüz eklenmedi.</EmptyState> : (
                <div className="mt-10 grid gap-8 sm:grid-cols-2">
                  {(galleryPhotos.length ? galleryPhotos : photos).map((photo, index) => (
                    <div key={photo.id} className={index === 0 ? "sm:col-span-2" : ""}>
                      <EditorialPhoto photo={photo} />
                      {photo.description && <p className="mt-3 text-sm leading-7 text-[#64707A]">{photo.description}</p>}
                      <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[#A8653A]">{photo.districtPhotoCategory}</p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
            <Section index={9}><Text value={guide?.distinctiveFeatures} /></Section>
            <Section index={10}>
              {guide?.researchTopics && <Text value={guide.researchTopics} />}
              {!research.length ? <EmptyState>Bu ilçeye ilişkin yayımlanmış araştırma ve analiz henüz eklenmedi.</EmptyState> : (
                <div className="mt-10 border-t border-[#D5CDC1]">
                  {research.map((item) => <article key={item.id} className="border-b border-[#D5CDC1] py-8"><h3 className="font-serif text-2xl text-[#18212A]">{item.title}</h3><p className="mt-4 max-w-[760px] text-sm leading-7 text-[#64707A]">{item.summary}</p><Link href={`/makaleler/${item.slug}`} className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[#A8653A]">Araştırmayı oku →</Link></article>)}
                </div>
              )}
            </Section>
            <Section index={11}>
              {!news.length ? <EmptyState>Bu ilçeye ilişkin seçilmiş güncel haberler henüz eklenmedi.</EmptyState> : (
                <div className="mt-10 divide-y divide-[#D5CDC1] border-y border-[#D5CDC1]">
                  {news.slice(0, 3).map((item) => {
                    const source = item.externalSource;
                    return <article key={item.id} className="grid gap-6 py-8 sm:grid-cols-[180px_minmax(0,1fr)]">
                      {item.featuredImage && <Image src={item.featuredImage.src} alt={item.featuredImage.alt} width={item.featuredImage.width ?? 640} height={item.featuredImage.height ?? 360} sizes="(max-width: 640px) 100vw, 180px" className="aspect-video w-full object-cover" />}
                      <div className={item.featuredImage ? "" : "sm:col-span-2"}><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A8653A]">{item.newsCategory?.replaceAll("-", " ") ?? "Yerel gelişme"}</p><h3 className="mt-3 font-serif text-2xl leading-tight">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[#64707A]">{item.summary}</p><p className="mt-4 text-xs text-[#64707A]">{formatDate(item.publishedAt)}{source ? ` · ${source.name}` : ""}</p>{source && <a href={source.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#A8653A]">Kaynağa git ↗</a>}</div>
                    </article>;
                  })}
                </div>
              )}
              <Link href={getDistrictNewsPath(district.slug)} className="mt-7 inline-flex min-h-11 items-center border-b border-[#A8653A] text-sm font-semibold text-[#18212A]">Tüm ilçe haberleri →</Link>
            </Section>
            <Section index={12}>
              <p className="mt-8 max-w-[820px] text-base leading-8 text-[#3F4A53]">Araştırma belgeleri başlangıç kaynağıdır. Nüfus, mahalle ve ulaşım bilgileri kaynak ve veri tarihiyle değerlendirilir. Piyasa ve proje durumları son doğrulama tarihine göre yeniden incelenir; doğrulanmamış bilgiler yayımlanmaz. Kaynak listesinde veriyi barındıran gerçek yayıncı gösterilir. Tarihsiz mahalle dizinlerinde veri tarihi, listenin gözlendiği gündür; kurumun yayın tarihi olarak yorumlanmamalıdır. Resmî sayfalardaki her iddia otomatik olarak onaylanmaz.</p>
              {!guide?.sources.length ? <EmptyState>Yayımlanan içerikleri destekleyen kontrol edilmiş kaynaklar burada listelenecek. Son kontrol bilgisi kaynak eklendiğinde gösterilecek.</EmptyState> : (
                <div className="mt-9 border-t border-[#D5CDC1]">
                  {guide.sources.map((source, index) => (
                    <details key={`${source.url}-${index}`} className="group min-w-0 border-b border-[#D5CDC1] py-6">
                      <summary className="cursor-pointer list-none break-words pr-8 font-serif text-xl text-[#18212A] marker:hidden">{source.title} <span aria-hidden="true" className="float-right text-[#A8653A] group-open:rotate-45">+</span></summary>
                      <div className="mt-6 min-w-0 space-y-3 break-words text-[15px] leading-7 text-[#4D5861]"><p>{source.publisher} · {sourceTypes[source.sourceType]} · {source.primary ? "Birincil kaynak" : "İkincil aktarım"}</p><p>Veri/gözlem tarihi: {formatDate(source.dataDate) ?? "Belirtilmemiş"}</p><p>Son kontrol: {formatDate(source.checkedAt) ?? "Belirtilmemiş"}</p><p>İlgili bölümler: {source.sections?.map((section) => districtSectionOptions.find(({ value }) => value === section)?.label).filter(Boolean).join(", ") || "Belirtilmemiş"}</p><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-[#A8653A] underline underline-offset-4">Kaynak bağlantısı ↗</a></div>
                    </details>
                  ))}
                </div>
              )}
            </Section>
            <Section index={13}>
              <p className="mt-7 text-[15px] leading-7 text-[#64707A]">{guide?.updatedAt ? `İçerik güncellemesi: ${formatDate(guide.updatedAt)}. Verilerin kontrol tarihleri kaynak listesinde ayrı gösterilir.` : "İçerik güncellemesi: Bu rehberin doğrulanmış içerik yayını henüz tamamlanmadı."}</p>
            </Section>
          </div>
        </div>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
