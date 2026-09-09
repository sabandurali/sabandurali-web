import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import DistrictMap from "@/components/districts/DistrictMap";
import DistrictNewsCard from "@/components/districts/DistrictNewsCard";
import {
  districtGuidePath,
  getDistrictNewsPath,
  getDistrictPath,
} from "@/content/districts/district-routes";
import type { District } from "@/content/districts/district-registry";
import type { DistrictGuide } from "@/content/districts/district-guide-data-source";
import { districtSectionOptions } from "@/content/districts/district-content-policy";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { PublicPhoto } from "@/content/photos/types";
import { homeContent } from "@/content/homeContent";

const sections = [
  ["genel-bakis", "İlçeye Genel Bakış"],
  ["tarihce", "Tarihçe"],
  ["tani", "İlçeyi Tanı"],
  ["yasam", "Yaşam ve Ulaşım"],
  ["mahalleler", "Mahalleler"],
  ["gayrimenkul", "Gayrimenkul ve Yapı Dokusu"],
  ["imar", "Şehircilik, İmar ve Kentsel Dönüşüm"],
  ["saha", "Görülecek ve Fotoğraflanacak Yerler"],
  ["kareler", "İlçeden Kareler"],
  ["kimlik", "İlçeyi Özel Kılan Şeyler"],
  ["arastirmalar", "Araştırmalar ve Analizler"],
  ["haberler", "İlçeden Haberler"],
  ["kaynaklar", "Kaynaklar ve Metodoloji"],
  ["guncelleme", "Son Güncelleme"],
] as const;
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
function EmptyState({
  children = "Bu bölüm için doğrulanmış içerik henüz eklenmedi.",
}: {
  children?: string;
}) {
  return (
    <p className="mt-5 border border-border bg-surface p-5 text-sm leading-7 text-muted">
      {children}
    </p>
  );
}
function Text({ value }: { value?: string | null }) {
  return value ? (
    <div className="mt-5 max-w-4xl space-y-4 text-base leading-8 text-muted">
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
    <EmptyState />
  );
}
function Section({ index, children }: { index: number; children: ReactNode }) {
  const [id, title] = sections[index];
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-border py-10 sm:py-14"
    >
      <p className="text-xs tracking-[0.18em] text-accent-soft">
        {String(index + 1).padStart(2, "0")}
      </p>
      <h2 className="mt-3 text-3xl text-ivory">{title}</h2>
      {children}
    </section>
  );
}

export default function DistrictGuidePage({
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
  const factItems = [
    ["Yaka", district.side === "avrupa" ? "Avrupa Yakası" : "Anadolu Yakası"],
    ["Nüfus", facts?.population],
    ["Nüfus veri yılı", facts?.populationYear],
    ["Yüzölçümü", facts?.areaKm2 == null ? null : `${facts.areaKm2} km²`],
    ["Mahalle sayısı", facts?.neighborhoodCount],
    ["Komşu ilçeler", facts?.neighboringDistricts],
    ["Konum", facts?.locationSummary],
  ].filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );
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
      <main className="bg-[#11273A] px-4 py-10 [--surface:#1D3D55] [--surface-soft:#1D3D55] sm:px-6 sm:py-14">
        <div className="mx-auto max-w-[1440px] break-words">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap gap-2 text-sm text-muted"
          >
            <Link href="/">Ana Sayfa</Link>
            <span aria-hidden="true">/</span>
            <Link href="/gayrimenkul-ve-istanbul">İstanbul</Link>
            <span aria-hidden="true">/</span>
            <Link href={districtGuidePath}>İlçeler</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{district.name}</span>
          </nav>
          <header className="py-10 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
              İstanbul ·{" "}
              {district.side === "avrupa" ? "Avrupa Yakası" : "Anadolu Yakası"}
            </p>
            <h1 className="mt-4 text-4xl text-ivory sm:text-6xl">
              {district.name} İlçe Rehberi
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
              {guide?.summary ||
                `${district.name} için tarih, yaşam, ulaşım ve şehir araştırmaları rehberi.`}
            </p>
          </header>
          <nav
            aria-label="Bölümler"
            className="mb-8 flex flex-wrap gap-x-5 gap-y-2 border-y border-border py-4 text-sm text-accent-soft"
          >
            {sections.map(([id, title], index) => (
              <a
                key={id}
                href={`#${id}`}
                className="py-2 underline-offset-4 hover:underline"
              >
                {String(index + 1).padStart(2, "0")} — {title}
              </a>
            ))}
          </nav>
          <Section index={0}>
            <Text value={guide?.summary} />
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {factItems.map(([label, value]) => (
                <div
                  key={label}
                  className="border border-border bg-surface p-4"
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-soft">
                    {label}
                  </dt>
                  <dd className="mt-2 text-sm text-ivory">{value}</dd>
                </div>
              ))}
            </dl>
          </Section>
          <Section index={1}>
            <Text value={guide?.history} />
          </Section>
          <Section index={2}>
            <Text value={guide?.geography} />
          </Section>
          <Section index={3}>
            <h3 className="mt-6 text-xl text-ivory">Günlük yaşam</h3>
            <Text value={guide?.life} />
            <h3 className="mt-8 text-xl text-ivory">Ulaşım</h3>
            <Text value={guide?.transportation} />
          </Section>
          <Section index={4}>
            <div className="mt-5">
              <DistrictMap district={district} />
            </div>
            {!neighborhoods.length ? (
              <EmptyState>
                Bu ilçe için resmî kaynaktan kontrol edilmiş tam mahalle listesi
                henüz eklenmedi.
              </EmptyState>
            ) : (
              <>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {neighborhoods.map((item) => (
                    <li
                      key={item.id ?? item.name}
                      className="border border-border bg-surface px-3 py-2 text-sm text-muted"
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  {neighborhoods
                    .filter((item) => item.featured)
                    .map((item) => (
                      <article
                        key={item.id ?? item.name}
                        className="border border-border bg-surface p-5"
                      >
                        <h3 className="text-2xl text-ivory">{item.name}</h3>
                        <Text value={item.description} />
                      </article>
                    ))}
                </div>
              </>
            )}
          </Section>
          <Section index={5}>
            <Text value={guide?.housingTexture} />
            {guide?.regionalAssessment && (
              <Text value={guide.regionalAssessment} />
            )}
            {guide?.marketData && (
              <dl className="mt-5 grid gap-4 border border-border bg-surface p-5 sm:grid-cols-2">
                {[
                  [
                    "Ortalama m² satış fiyatı",
                    guide.marketData.salePricePerM2 == null
                      ? null
                      : `${guide.marketData.salePricePerM2.toLocaleString("tr-TR")} TL`,
                  ],
                  [
                    "Ortalama kira",
                    guide.marketData.averageRent == null
                      ? null
                      : `${guide.marketData.averageRent.toLocaleString("tr-TR")} TL`,
                  ],
                  ["Veri tarihi", formatDate(guide.marketData.dataDate)],
                  ["Veri kaynağı", guide.marketData.source],
                  ["Not", guide.marketData.description],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-accent-soft">{label}</dt>
                      <dd className="mt-2 text-sm text-ivory">{value}</dd>
                    </div>
                  ))}
              </dl>
            )}
            <p className="mt-5 border-l-4 border-accent-soft bg-surface p-5 text-sm font-semibold leading-7 text-ivory">
              Bu içerik yatırım tavsiyesi değildir. Gayrimenkul verileri
              belirtilen veri tarihindeki piyasa göstergelerini yansıtır.
            </p>
          </Section>
          <Section index={6}>
            {!guide?.planningDevelopments.length ? (
              <EmptyState>
                Bu ilçe için kaynak ve tarihi doğrulanmış şehircilik gelişmesi
                henüz eklenmedi.
              </EmptyState>
            ) : (
              <div className="mt-5 space-y-4">
                {guide.planningDevelopments.map((item) => (
                  <article
                    key={item.id ?? item.title}
                    className="border border-border bg-surface p-5"
                  >
                    <h3 className="text-2xl text-ivory">{item.title}</h3>
                    <Text value={item.summary} />
                    <p className="mt-4 text-sm text-muted">
                      {[
                        item.neighborhood,
                        formatDate(item.date),
                        item.status && planningStatuses[item.status],
                        `Son kontrol: ${formatDate(item.checkedAt)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <a
                      href={item.officialSource!}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex min-h-11 items-center text-sm text-accent-soft underline"
                    >
                      Kaynak ↗
                    </a>
                  </article>
                ))}
              </div>
            )}
            <p className="mt-5 text-sm leading-7 text-muted">
              Taşınmaza özgü imar durumu için ilgili kurumun güncel resmî
              kayıtları esas alınmalıdır.
            </p>
          </Section>
          <Section index={7}>
            <Text value={guide?.placesGuide} />
          </Section>
          <Section index={8}>
            {!photos.length ? (
              <EmptyState>
                Bu ilçeden seçilmiş fotoğraflar henüz eklenmedi.
              </EmptyState>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {photos.slice(0, 6).map((photo) => (
                  <article
                    key={photo.id}
                    className="overflow-hidden border border-border bg-surface"
                  >
                    <Image
                      src={photo.image.src}
                      alt={photo.image.alt}
                      width={photo.image.width ?? 800}
                      height={photo.image.height ?? 600}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-xl text-ivory">{photo.title}</h3>
                      <Text value={photo.description} />
                      <p className="mt-3 text-xs text-muted">
                        {[
                          photo.neighborhood ?? photo.locationName,
                          formatDate(photo.takenAt),
                          photo.dayPeriod === null
                            ? null
                            : photo.dayPeriod === "gece"
                              ? "Gece"
                              : "Gündüz",
                          photo.districtPhotoCategory,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Section>
          <Section index={9}>
            <Text value={guide?.distinctiveFeatures} />
          </Section>
          <Section index={10}>
            {guide?.researchTopics && <Text value={guide.researchTopics} />}
            {!research.length ? (
              <EmptyState>
                Bu ilçeye ilişkin yayımlanmış araştırma ve analiz henüz
                eklenmedi.
              </EmptyState>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {research.map((item) => (
                  <article
                    key={item.id}
                    className="border border-border bg-surface p-5"
                  >
                    <h3 className="text-2xl text-ivory">{item.title}</h3>
                    <Text value={item.summary} />
                    <Link
                      href={`/makaleler/${item.slug}`}
                      className="mt-4 inline-flex min-h-11 items-center text-sm text-accent-soft underline"
                    >
                      Araştırmayı oku →
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </Section>
          <Section index={11}>
            {!news.length ? (
              <EmptyState>
                Bu ilçeye ilişkin seçilmiş güncel haberler henüz eklenmedi.
              </EmptyState>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                {news.slice(0, 3).map((item) => (
                  <DistrictNewsCard key={item.id} news={item} />
                ))}
              </div>
            )}
            <Link
              href={getDistrictNewsPath(district.slug)}
              className="mt-6 inline-flex min-h-11 items-center border border-accent px-5 text-sm text-accent-soft"
            >
              Tüm ilçe haberleri →
            </Link>
          </Section>
          <Section index={12}>
            <p className="mt-5 max-w-4xl text-sm leading-7 text-muted">
              Araştırma belgeleri başlangıç kaynağıdır. Nüfus, mahalle ve ulaşım
              bilgileri kaynak ve veri tarihiyle değerlendirilir. Piyasa ve
              proje durumları son doğrulama tarihine göre yeniden incelenir;
              doğrulanmamış bilgiler yayımlanmaz. Kaynak listesinde veriyi
              barındıran gerçek yayıncı gösterilir. Tarihsiz mahalle
              dizinlerinde veri tarihi, listenin gözlendiği gündür; kurumun
              yayın tarihi olarak yorumlanmamalıdır. Resmî sayfalardaki her
              iddia otomatik olarak onaylanmaz.
            </p>
            {!guide?.sources.length ? (
              <EmptyState>
                Yayımlanan içerikleri destekleyen kontrol edilmiş kaynaklar
                burada listelenecek.
              </EmptyState>
            ) : (
              <ol className="mt-6 space-y-5">
                {guide.sources.map((source, index) => (
                  <li
                    key={`${source.url}-${index}`}
                    className="min-w-0 border border-border bg-surface p-5"
                  >
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base text-accent-soft underline"
                    >
                      {source.title}
                    </a>
                    <p className="mt-2 break-all text-sm text-muted">
                      {source.publisher} · {sourceTypes[source.sourceType]} ·{" "}
                      {source.primary ? "Birincil kaynak" : "İkincil aktarım"}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Veri/gözlem tarihi:{" "}
                      {formatDate(source.dataDate) || "Belirtilmemiş"} · Son
                      kontrol: {formatDate(source.checkedAt)}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      İlgili bölümler:{" "}
                      {source.sections
                        ?.map(
                          (section) =>
                            districtSectionOptions.find(
                              ({ value }) => value === section,
                            )?.label,
                        )
                        .join(", ")}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Section>
          <Section index={13}>
            <p className="mt-5 text-sm text-muted">
              {guide?.updatedAt
                ? `İçerik güncellemesi: ${formatDate(guide.updatedAt)}. Verilerin kontrol tarihleri kaynak listesinde ayrı gösterilir.`
                : "Bu rehberin doğrulanmış içerik yayını henüz tamamlanmadı."}
            </p>
          </Section>
        </div>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
