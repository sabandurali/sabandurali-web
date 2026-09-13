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

type SectionId =
  | "genel-bakis"
  | "tarihce"
  | "yasam"
  | "mahalleler"
  | "gayrimenkul"
  | "imar"
  | "saha"
  | "kareler"
  | "kimlik"
  | "arastirmalar"
  | "haberler"
  | "kaynaklar"
  | "guncelleme";

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
  belirsiz: "Belirsiz — doğrulama gerekli",
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

function Text({ value }: { value: string }) {
  return (
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
  );
}

function GuideSection({
  id,
  number,
  title,
  children,
}: {
  id: SectionId;
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-t border-border py-10 sm:py-14"
    >
      <p className="text-xs font-semibold tracking-[0.18em] text-accent-soft">
        {String(number).padStart(2, "0")}
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
  const developments = guide?.planningDevelopments ?? [];
  const factItems: Array<[string, string | number]> = [];
  if (facts) {
    factItems.push([
      "Yaka",
      district.side === "avrupa" ? "Avrupa Yakası" : "Anadolu Yakası",
    ]);
    if (facts.population) factItems.push(["Nüfus", facts.population]);
    if (facts.populationYear)
      factItems.push(["Nüfus veri yılı", facts.populationYear]);
    if (facts.areaKm2 != null)
      factItems.push(["Yüzölçümü", `${facts.areaKm2} km²`]);
    if (facts.neighborhoodCount != null)
      factItems.push(["Mahalle sayısı", facts.neighborhoodCount]);
    if (facts.neighboringDistricts)
      factItems.push(["Komşu ilçeler", facts.neighboringDistricts]);
    if (facts.locationSummary) factItems.push(["Konum", facts.locationSummary]);
  }
  const hasOverview = Boolean(guide?.geography || factItems.length);
  const hasLife = Boolean(guide?.life || guide?.transportation);
  const hasRealEstate = Boolean(
    guide?.housingTexture || guide?.regionalAssessment || guide?.marketData,
  );
  const sections = [
    { id: "genel-bakis", label: "Genel Bakış", visible: hasOverview },
    { id: "tarihce", label: "Tarihçe", visible: Boolean(guide?.history) },
    { id: "yasam", label: "Yaşam ve Ulaşım", visible: hasLife },
    {
      id: "mahalleler",
      label: "Mahalleler",
      visible: neighborhoods.length > 0,
    },
    { id: "gayrimenkul", label: "Gayrimenkul", visible: hasRealEstate },
    { id: "imar", label: "Şehir ve İmar", visible: developments.length > 0 },
    {
      id: "saha",
      label: "Görülecek Yerler",
      visible: Boolean(guide?.placesGuide),
    },
    { id: "kareler", label: "İlçeden Kareler", visible: photos.length > 0 },
    {
      id: "kimlik",
      label: "İlçeyi Özel Kılanlar",
      visible: Boolean(guide?.distinctiveFeatures),
    },
    {
      id: "arastirmalar",
      label: "Araştırmalar",
      visible: Boolean(guide?.researchTopics || research.length),
    },
    { id: "haberler", label: "Haberler", visible: news.length > 0 },
    {
      id: "kaynaklar",
      label: "Kaynaklar",
      visible: Boolean(guide?.sources.length),
    },
    {
      id: "guncelleme",
      label: "Son Güncelleme",
      visible: Boolean(guide?.updatedAt),
    },
  ].filter((section) => section.visible) as Array<{
    id: SectionId;
    label: string;
    visible: true;
  }>;
  const sectionNumber = (id: SectionId) =>
    sections.findIndex((section) => section.id === id) + 1;

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
      <main className="bg-[#11273A] px-4 py-10 [--surface:#1D3D55] [--surface-soft:#1D3D55] sm:px-6 sm:py-14 lg:py-18">
        <div className="mx-auto max-w-[1440px]">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link
              href={districtGuidePath}
              className="text-accent-soft hover:text-ivory"
            >
              İstanbul İlçe Rehberi
            </Link>
            <span aria-hidden="true"> / </span>
            <span>{district.name}</span>
          </nav>
          <header className="py-10 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">
              İstanbul ·{" "}
              {district.side === "avrupa" ? "Avrupa Yakası" : "Anadolu Yakası"}
            </p>
            <h1 className="mt-4 text-5xl text-ivory sm:text-6xl">
              {district.name} İlçe Rehberi
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
              {guide?.summary ||
                "İlçeye ilişkin doğrulanmış içerikler ve kaynaklar yayımlandıkça bu rehberde gösterilir."}
            </p>
          </header>
          {sections.length > 0 && (
            <nav
              aria-label="Bölümler"
              className="mb-8 flex flex-wrap gap-x-5 gap-y-2 border-y border-border py-4 text-sm text-accent-soft"
            >
              {sections.map((section, index) => (
                <a key={section.id} href={`#${section.id}`}>
                  {String(index + 1).padStart(2, "0")} — {section.label}
                </a>
              ))}
            </nav>
          )}
          {hasOverview && (
            <GuideSection
              id="genel-bakis"
              number={sectionNumber("genel-bakis")}
              title="İlçeye Genel Bakış"
            >
              {guide?.geography && <Text value={guide.geography} />}
              {factItems.length > 0 && (
                <dl className="mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                  {factItems.map(([label, value]) => (
                    <div key={label} className="bg-surface p-4">
                      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-soft">
                        {label}
                      </dt>
                      <dd className="mt-2 text-sm text-ivory">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </GuideSection>
          )}
          {guide?.history && (
            <GuideSection
              id="tarihce"
              number={sectionNumber("tarihce")}
              title="Tarihçe"
            >
              <Text value={guide.history} />
            </GuideSection>
          )}
          {hasLife && (
            <GuideSection
              id="yasam"
              number={sectionNumber("yasam")}
              title="Yaşam ve Ulaşım"
            >
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {guide?.life && (
                  <article className="border border-border bg-surface p-5">
                    <h3 className="text-2xl text-ivory">Günlük yaşam</h3>
                    <Text value={guide.life} />
                  </article>
                )}
                {guide?.transportation && (
                  <article className="border border-border bg-surface p-5">
                    <h3 className="text-2xl text-ivory">Ulaşım</h3>
                    <Text value={guide.transportation} />
                  </article>
                )}
              </div>
            </GuideSection>
          )}
          {neighborhoods.length > 0 && (
            <GuideSection
              id="mahalleler"
              number={sectionNumber("mahalleler")}
              title="Mahalleler"
            >
              <div className="mt-5">
                <DistrictMap district={district} />
              </div>
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
              {neighborhoods.some(
                (item) => item.featured && item.description,
              ) && (
                <div className="mt-7 grid gap-5 md:grid-cols-2">
                  {neighborhoods
                    .filter((item) => item.featured && item.description)
                    .map((item) => (
                      <article
                        key={item.id ?? item.name}
                        className="border border-border bg-surface p-5"
                      >
                        <h3 className="text-2xl text-ivory">{item.name}</h3>
                        <Text value={item.description!} />
                      </article>
                    ))}
                </div>
              )}
            </GuideSection>
          )}
          {hasRealEstate && (
            <GuideSection
              id="gayrimenkul"
              number={sectionNumber("gayrimenkul")}
              title="Gayrimenkul ve Yapı Dokusu"
            >
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {guide?.housingTexture && (
                  <article className="border border-border bg-surface p-5">
                    <h3 className="text-2xl text-ivory">
                      Konut ve yapı dokusu
                    </h3>
                    <Text value={guide.housingTexture} />
                  </article>
                )}
                {guide?.regionalAssessment && (
                  <article className="border border-border bg-surface p-5">
                    <h3 className="text-2xl text-ivory">
                      Bölgesel değerlendirme
                    </h3>
                    <Text value={guide.regionalAssessment} />
                  </article>
                )}
              </div>
              {guide?.marketData && (
                <dl className="mt-5 grid gap-4 border border-border bg-surface p-5 sm:grid-cols-2">
                  {guide.marketData.salePricePerM2 != null && (
                    <div>
                      <dt className="text-xs text-accent-soft">
                        Ortalama m² satış fiyatı
                      </dt>
                      <dd className="mt-2 text-sm text-ivory">
                        {guide.marketData.salePricePerM2.toLocaleString(
                          "tr-TR",
                        )}{" "}
                        TL
                      </dd>
                    </div>
                  )}
                  {guide.marketData.averageRent != null && (
                    <div>
                      <dt className="text-xs text-accent-soft">
                        Ortalama kira
                      </dt>
                      <dd className="mt-2 text-sm text-ivory">
                        {guide.marketData.averageRent.toLocaleString("tr-TR")}{" "}
                        TL
                      </dd>
                    </div>
                  )}
                  {formatDate(guide.marketData.dataDate) && (
                    <div>
                      <dt className="text-xs text-accent-soft">Veri tarihi</dt>
                      <dd className="mt-2 text-sm text-ivory">
                        {formatDate(guide.marketData.dataDate)}
                      </dd>
                    </div>
                  )}
                  {guide.marketData.source && (
                    <div>
                      <dt className="text-xs text-accent-soft">Veri kaynağı</dt>
                      <dd className="mt-2 text-sm text-ivory">
                        {guide.marketData.source}
                      </dd>
                    </div>
                  )}
                  {guide.marketData.description && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-accent-soft">
                        Metodoloji notu
                      </dt>
                      <dd className="mt-2 text-sm leading-7 text-muted">
                        {guide.marketData.description}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              <p className="mt-5 border-l-4 border-accent-soft bg-surface p-5 text-sm font-semibold leading-7 text-ivory">
                Bu içerik yatırım tavsiyesi değildir. Taşınmaza özgü hukuki ve
                teknik durum ayrıca kontrol edilmelidir.
              </p>
            </GuideSection>
          )}
          {developments.length > 0 && (
            <GuideSection
              id="imar"
              number={sectionNumber("imar")}
              title="Şehircilik, İmar ve Kentsel Dönüşüm"
            >
              <div className="mt-5 space-y-4">
                {developments.map((item) => (
                  <article
                    key={item.id ?? item.title}
                    className="border border-border bg-surface p-5"
                  >
                    <h3 className="text-2xl text-ivory">{item.title}</h3>
                    {item.summary && <Text value={item.summary} />}
                    <p className="mt-4 text-sm text-muted">
                      {[
                        item.neighborhood,
                        formatDate(item.date),
                        item.status &&
                          (planningStatuses[item.status] ?? item.status),
                        formatDate(item.checkedAt) &&
                          `Son kontrol: ${formatDate(item.checkedAt)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {item.officialSource && (
                      <a
                        href={item.officialSource}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex min-h-11 items-center text-sm text-accent-soft underline"
                      >
                        Resmî kaynak ↗
                      </a>
                    )}
                  </article>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-muted">
                Taşınmaza özgü imar durumu için ilgili kurumların güncel resmî
                kayıtları esas alınmalıdır.
              </p>
            </GuideSection>
          )}
          {guide?.placesGuide && (
            <GuideSection
              id="saha"
              number={sectionNumber("saha")}
              title="Görülecek ve Fotoğraflanacak Yerler"
            >
              <Text value={guide.placesGuide} />
            </GuideSection>
          )}
          {photos.length > 0 && (
            <GuideSection
              id="kareler"
              number={sectionNumber("kareler")}
              title={`${district.name}’den Kareler`}
            >
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
                      {photo.description && (
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {photo.description}
                        </p>
                      )}
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
            </GuideSection>
          )}
          {guide?.distinctiveFeatures && (
            <GuideSection
              id="kimlik"
              number={sectionNumber("kimlik")}
              title="İlçeyi Özel Kılan Şeyler"
            >
              <Text value={guide.distinctiveFeatures} />
            </GuideSection>
          )}
          {(guide?.researchTopics || research.length > 0) && (
            <GuideSection
              id="arastirmalar"
              number={sectionNumber("arastirmalar")}
              title="Araştırmalar ve Analizler"
            >
              {guide?.researchTopics && <Text value={guide.researchTopics} />}
              {research.length > 0 && (
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {research.map((item) => (
                    <article
                      key={item.id}
                      className="border border-border bg-surface p-5"
                    >
                      <h3 className="text-2xl text-ivory">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted">
                        {item.summary}
                      </p>
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
            </GuideSection>
          )}
          {news.length > 0 && (
            <GuideSection
              id="haberler"
              number={sectionNumber("haberler")}
              title="İlçeden Haberler"
            >
              <div className="mt-5 grid gap-5 lg:grid-cols-3">
                {news.slice(0, 3).map((item) => (
                  <DistrictNewsCard key={item.id} news={item} />
                ))}
              </div>
              <Link
                href={getDistrictNewsPath(district.slug)}
                className="mt-6 inline-flex min-h-11 items-center border border-accent px-5 text-sm text-accent-soft"
              >
                Tüm ilçe haberleri →
              </Link>
            </GuideSection>
          )}
          {guide && guide.sources.length > 0 && (
            <GuideSection
              id="kaynaklar"
              number={sectionNumber("kaynaklar")}
              title="Kaynaklar ve Metodoloji"
            >
              <p className="mt-5 max-w-4xl text-sm leading-7 text-muted">
                Yalnız bölüm onayı ve kaynak doğrulama koşullarını sağlayan
                içerikler gösterilir. Dinamik veriler, kaynaklarındaki veri ve
                kontrol tarihleriyle birlikte değerlendirilmelidir.
              </p>
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
                      className="break-words text-base text-accent-soft underline"
                    >
                      {source.title}
                    </a>
                    <p className="mt-2 text-sm text-muted">
                      {source.publisher} · {sourceTypes[source.sourceType]} ·{" "}
                      {source.primary ? "Birincil kaynak" : "İkincil aktarım"}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      Veri/gözlem tarihi:{" "}
                      {formatDate(source.dataDate) || "Belirtilmemiş"} · Son
                      kontrol: {formatDate(source.checkedAt)}
                    </p>
                    {source.sections && source.sections.length > 0 && (
                      <p className="mt-2 text-xs text-muted">
                        İlgili bölümler:{" "}
                        {source.sections
                          .map(
                            (section) =>
                              districtSectionOptions.find(
                                ({ value }) => value === section,
                              )?.label,
                          )
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </GuideSection>
          )}
          {guide?.updatedAt && (
            <GuideSection
              id="guncelleme"
              number={sectionNumber("guncelleme")}
              title="Son Güncelleme"
            >
              <p className="mt-5 text-sm text-muted">
                İçerik güncellemesi: {formatDate(guide.updatedAt)}. Verilerin
                kontrol tarihleri kaynak listesinde ayrı gösterilir.
              </p>
            </GuideSection>
          )}
        </div>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
