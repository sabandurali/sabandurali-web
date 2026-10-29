import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import Breadcrumb, { homeCrumb } from "@/components/ui/Breadcrumb";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Container from "@/components/ui/Container";
import DistrictKeyMap from "@/components/ui/DistrictKeyMap";
import DistrictTileMap from "@/components/ui/DistrictTileMap";
import EmptyState from "@/components/ui/EmptyState";
import FactTable from "@/components/ui/FactTable";
import { Figure } from "@/components/ui/Figure";
import GridRef from "@/components/ui/GridRef";
import { LineChip } from "@/components/ui/LineChip";
import PlateTitle from "@/components/ui/PlateTitle";
import Section, { type SectionTone } from "@/components/ui/Section";
import SectionSign from "@/components/ui/SectionSign";
import { SourceRefList, sourceAnchorId } from "@/components/ui/SourceRef";
import TextLink from "@/components/ui/TextLink";
import {
  getDistrictLabel,
  getDistrictTiles,
} from "@/components/ui/district-tile-grid";
import type { DistrictSection } from "@/content/districts/district-content-policy";
import type { DistrictPageData } from "@/content/districts/district-page-data";
import type { District } from "@/content/districts/district-registry";
import {
  districtGuidePath,
  getDistrictNewsPath,
} from "@/content/districts/district-routes";
import {
  selectDistrictGalleryPhotos,
  selectDistrictHeroPhoto,
} from "@/content/photos/district-photo-selection";
import type { PublicPhoto } from "@/content/photos/types";
import { formatDate, toDateTimeAttribute } from "@/lib/format-date";
import {
  buildDistrictFacts,
  buildSourceRows,
  categoryLabel,
  districtPhotoCaption,
  districtPhotoCredit,
  extractLineCodes,
  getDistrictListSections,
  getVisibleDistrictSections,
  parseNeighbourSlugs,
  planningStatusLabel,
  sourceNumbersFor,
  splitParagraphs,
  type DistrictGuideSectionId,
  type VisibleDistrictSection,
} from "./district-guide-model";

/** Data the guide renders: the page data of getDistrictPageData(slug). */
export type DistrictGuideArticleProps = {
  district: District;
  data: Pick<
    DistrictPageData,
    "guide" | "photos" | "research" | "news" | "unavailableSections"
  >;
};

const missingText = "Bu bölüm için doğrulanmış içerik henüz eklenmedi.";
const unavailableText = (what: string) =>
  `${what} geçici olarak yüklenemedi. Sayfayı biraz sonra yeniden açın.`;

function Prose({
  value,
  empty = missingText,
}: {
  value: string | null | undefined;
  empty?: ReactNode;
}) {
  const paragraphs = splitParagraphs(value);
  if (paragraphs.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className="max-w-measure space-y-5 type-body">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="m-0 whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function GuideSection({
  section,
  total,
  heading,
  tone = "paper",
  wide,
  children,
}: {
  section: VisibleDistrictSection;
  total: number;
  heading?: string;
  tone?: SectionTone;
  /** Full-width content under the two columns (the tile map). */
  wide?: ReactNode;
  children: ReactNode;
}) {
  const headingId = `${section.id}-baslik`;
  return (
    <Section
      id={section.id}
      labelledBy={headingId}
      tone={tone}
      spacing="compact"
      divider
      className="scroll-mt-4"
    >
      {/* Wide screens: the sign and heading stay in a left rail while the
          reading column scrolls; narrow screens stack them. */}
      <div className="lg:grid lg:grid-cols-[minmax(13rem,18rem)_minmax(0,1fr)] lg:gap-x-14">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <SectionSign
            number={section.number}
            total={total}
            label={section.label}
            end={section.number === total}
          />
          <h2 id={headingId} className="mt-5 mb-0 max-w-[24ch] type-h2">
            {heading ?? section.heading}
          </h2>
        </div>
        <div className="mt-7 grid min-w-0 gap-8 lg:mt-0">{children}</div>
      </div>
      {wide ? <div className="mt-10">{wide}</div> : null}
    </Section>
  );
}

function Sources({
  numbers,
  label,
}: {
  numbers: readonly number[];
  label?: string;
}) {
  return <SourceRefList numbers={numbers} label={label} className="-my-2" />;
}

function DistrictPhoto({
  photo,
  preload = false,
  sizes,
}: {
  photo: PublicPhoto;
  preload?: boolean;
  sizes: string;
}) {
  const historical = photo.districtPhotoCategory === "tarih";
  return (
    <Figure
      credit={districtPhotoCredit(photo)}
      caption={
        <>
          {historical ? (
            <Badge tone="neutral" className="mr-2">
              Tarihî arşiv
            </Badge>
          ) : null}
          {districtPhotoCaption(photo)}
        </>
      }
    >
      <div
        className={
          historical
            ? "rounded-card border border-ink bg-land p-3"
            : "overflow-hidden rounded-card bg-band"
        }
      >
        <Image
          src={photo.image.src}
          alt={photo.image.alt}
          width={photo.image.width ?? 1600}
          height={photo.image.height ?? 900}
          sizes={sizes}
          preload={preload}
          className={
            historical
              ? "mx-auto h-auto max-h-[48rem] w-auto max-w-full object-contain"
              : "aspect-video h-auto w-full object-cover"
          }
        />
      </div>
      {photo.description && !historical ? (
        <p className="mt-2 mb-0 max-w-measure type-small text-ink-muted">
          {photo.description}
        </p>
      ) : null}
    </Figure>
  );
}

function MetaLine({ parts: all }: { parts: ReactNode[] }) {
  const parts = all.filter(Boolean);
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 type-caption text-ink-muted">
      {parts.map((part, index) => (
        <span key={index} className="inline-flex items-center gap-2">
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          {part}
        </span>
      ))}
    </p>
  );
}

function TimeText({ value }: { value: string | null | undefined }) {
  const label = formatDate(value);
  const dateTime = toDateTimeAttribute(value);
  if (!label) return null;
  return dateTime ? <time dateTime={dateTime}>{label}</time> : <>{label}</>;
}

/**
 * The district guide in the İstanbul Atlası design: a plate title, the
 * fixed 14-section contract (docs/PROJECT-STATE.md §H) with wayfinding
 * signs, a fact table with dated, numbered sources and the schematic
 * tile map. Only the public projection is rendered; missing content gets
 * an explicit empty state.
 */
export default function DistrictGuideArticle({
  district,
  data,
}: DistrictGuideArticleProps) {
  const { guide, photos, research, news, unavailableSections } = data;
  const unavailable = new Set(unavailableSections);
  const sources = guide?.sources ?? [];
  const refs = (...sections: DistrictSection[]) =>
    sourceNumbersFor(sources, sections);
  const tile = getDistrictTiles().find((item) => item.slug === district.slug);
  const label = getDistrictLabel(district.slug) ?? district.name;
  const neighbours = parseNeighbourSlugs(
    guide?.facts?.neighboringDistricts,
    district.slug,
  );
  const neighbourhoods = guide?.neighborhoods ?? [];
  const heroPhoto = selectDistrictHeroPhoto(photos);
  const galleryPhotos = selectDistrictGalleryPhotos(photos, heroPhoto);
  const facts = buildDistrictFacts(district, guide);
  const hasPublishedFacts = facts.some((fact) => fact.id !== "side");
  const lineCodes = extractLineCodes(guide?.transportation);
  const sourceRows = buildSourceRows(sources);
  const neighbourhoodCount =
    guide?.facts?.neighborhoodCount ??
    (neighbourhoods.length > 0 ? neighbourhoods.length : null);
  const lead =
    guide?.facts?.locationSummary ??
    guide?.summary ??
    "Bu ilçe için doğrulanmış rehber içeriği henüz yayımlanmadı.";

  const visible = getVisibleDistrictSections(
    getDistrictListSections({ research, news, unavailableSections }),
  );
  const total = visible.length;
  const section = (id: DistrictGuideSectionId) =>
    visible.find((item) => item.id === id);
  const render = (
    id: DistrictGuideSectionId,
    content: (item: VisibleDistrictSection) => ReactNode,
  ) => {
    const item = section(id);
    return item ? content(item) : null;
  };
  const planningHeading =
    guide?.planningDevelopments.length === 1 &&
    /\bM8\b/i.test(guide.planningDevelopments[0]?.title ?? "")
      ? "Ulaşım gelişmesi: M8"
      : undefined;

  return (
    <>
      <Container as="header" className="pt-6 pb-10 sm:pb-14">
        <Breadcrumb
          items={[
            homeCrumb("tr"),
            { label: "İstanbul", href: "/gayrimenkul-ve-istanbul" },
            { label: "İlçeler", href: districtGuidePath },
            { label: district.name },
          ]}
        />
        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,21rem)] lg:items-end lg:gap-16">
          <div className="min-w-0">
            <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="type-region">
                İSTANBUL ·{" "}
                {district.side === "avrupa"
                  ? "AVRUPA YAKASI"
                  : "ANADOLU YAKASI"}
              </span>
              {tile ? (
                <Chip>
                  Haritada&nbsp;
                  <GridRef value={tile.ref} variant="plain" announce={false} />
                </Chip>
              ) : null}
            </p>
            <PlateTitle className="mt-4">{label}</PlateTitle>
            <p className="mt-6 mb-0 max-w-measure type-lead">{lead}</p>
          </div>
          <figure className="m-0 max-w-[21rem]">
            <DistrictKeyMap
              featuredSlug={district.slug}
              highlightSlugs={neighbours}
              title={`${district.name}, İstanbul'un şematik ilçe haritasında${tile ? ` (${tile.ref})` : ""}`}
            />
            <figcaption className="mt-2 type-caption text-ink-muted">
              Şematik, ölçeksiz. Turuncu kare {district.name}
              {neighbours.length > 0
                ? "; koyu kareler rehberin saydığı komşu ilçeler."
                : "."}
            </figcaption>
          </figure>
        </div>
      </Container>

      {heroPhoto ? (
        <Container className="pb-10 sm:pb-14">
          <DistrictPhoto
            photo={heroPhoto}
            preload
            sizes="(max-width: 1440px) 100vw, 1296px"
          />
        </Container>
      ) : null}

      <div className="border-y border-hairline bg-band text-ink">
        <Container as="nav" aria-label="Rehber bölümleri" className="py-6">
          <p className="m-0 type-h4">Bu rehberde</p>
          <ol className="m-0 mt-3 grid list-none gap-x-8 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="inline-flex min-h-tap items-center gap-3 type-small underline decoration-1 underline-offset-[0.2em] hover:decoration-2"
                >
                  <span aria-hidden="true" className="type-data text-ink-muted">
                    {String(item.number).padStart(2, "0")}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </Container>
      </div>

      {render("genel-bakis", (item) => (
        <GuideSection
          section={item}
          total={total}
          heading={`${district.name}: tek bakışta`}
        >
          <Prose value={guide?.summary} />
          <Sources numbers={refs("summary")} />
          <div className="max-w-[60rem]">
            <h3 className="m-0 mb-4 type-h3">Temel veriler</h3>
            {hasPublishedFacts ? (
              <FactTable
                facts={facts}
                caption={
                  <>
                    Kaynak numaraları, temel verileri destekleyen kaynakları
                    gösterir. Nüfus veri yılı:{" "}
                    {guide?.facts?.populationYear ?? "belirtilmemiş"}. Kaynağın
                    veri/gözlem tarihi, son kontrol tarihi ve rehberin içerik
                    güncellemesi farklı tarihlerdir.
                    {district.slug === "kadikoy" ? (
                      <>
                        {" "}
                        2025 ADNKS nüfusu: 458.573.{" "}
                        <TextLink
                          href="https://www.kadikoyakademi.org/kadikoyun-demografik-donusumu-devam-ediyor/"
                          external
                        >
                          Kadıköy Belediyesi Akademi
                        </TextLink>{" "}
                        aktarımı 18 Ekim 2026’da kontrol edildi; yayın tarihi
                        doğrulanamadı.
                      </>
                    ) : null}
                  </>
                }
              />
            ) : (
              <EmptyState>
                Kaynağı ve veri tarihi doğrulanmış temel veriler henüz
                eklenmedi.
              </EmptyState>
            )}
            <p className="mt-3 mb-0">
              <TextLink href="#kaynaklar" variant="standalone">
                Veri kaynakları ve kontrol tarihleri
              </TextLink>
            </p>
          </div>
        </GuideSection>
      ))}

      {render("tarihce", (item) => (
        <GuideSection section={item} total={total}>
          <Prose value={guide?.history} />
          <Sources numbers={refs("history")} />
        </GuideSection>
      ))}

      {render("tani", (item) => (
        <GuideSection
          section={item}
          total={total}
          wide={
            <DistrictTileMap
              currentSlug={district.slug}
              highlightSlugs={neighbours}
              groupHeadingLevel={3}
              caption={
                neighbours.length > 0
                  ? `${district.name} bu sayfada, bağlantı değildir. Sis renkli kareler rehberin komşu olarak saydığı ilçelerdir.`
                  : `${district.name} bu sayfada, bağlantı değildir.`
              }
            />
          }
        >
          <Prose value={guide?.geography} />
          <Sources numbers={refs("geography")} />

          <div>
            <h3 className="m-0 type-h4">Harita referansı</h3>
            <p className="mt-1 mb-0 flex flex-wrap gap-x-6">
              <TextLink
                href="https://sehirharitasi.ibb.gov.tr/"
                variant="standalone"
                external
              >
                İBB Şehir Haritası
              </TextLink>
              <TextLink
                href={`https://www.openstreetmap.org/?mlat=${district.center[0]}&mlon=${district.center[1]}#map=14/${district.center[0]}/${district.center[1]}`}
                variant="standalone"
                external
              >
                OpenStreetMap
              </TextLink>
            </p>
            <p className="m-0 type-caption text-ink-muted">
              Konum bağlantısı ilçe merkezini gösterir; sınır çizmez.
            </p>
          </div>
        </GuideSection>
      ))}

      {render("yasam", (item) => (
        <GuideSection section={item} total={total}>
          <Prose value={guide?.life} />
          <Sources numbers={refs("life")} />
          <div className="grid gap-5">
            <h3 className="m-0 type-h3">İstanbul’a nasıl bağlanıyor?</h3>
            {lineCodes.length > 0 ? (
              <div className="flex max-w-measure flex-col gap-2 rounded-card border border-ink bg-land p-4">
                <p className="m-0 type-small font-semibold">
                  Ulaşım metninde adı geçen raylı sistem hatları
                </p>
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {lineCodes.map((code) => (
                    <li key={code}>
                      <LineChip code={code} variant="other" />
                    </li>
                  ))}
                </ul>
                <p className="m-0 type-caption text-ink-muted">
                  Adı geçmesi, hattın ilçe içinde durduğu anlamına gelmez; hangi
                  istasyonların ilçeye hizmet ettiğini aşağıdaki metin ve
                  kaynaklar belirtir.
                </p>
              </div>
            ) : null}
            <Prose value={guide?.transportation} />
            <Sources numbers={refs("transportation")} />
          </div>
        </GuideSection>
      ))}

      {render("mahalleler", (item) => (
        <GuideSection
          section={item}
          total={total}
          heading={
            neighbourhoodCount === null
              ? undefined
              : `${neighbourhoodCount} mahalle`
          }
        >
          {neighbourhoods.length > 0 ? (
            <>
              <p className="m-0 max-w-measure type-body">
                İlçenin resmî kaynaktan doğrulanmış mahalle listesi, alfabetik
                sırayla:
              </p>
              <ol className="m-0 grid list-none grid-cols-1 gap-x-8 p-0 min-[30rem]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {neighbourhoods.map((neighbourhood, index) => (
                  <li
                    key={neighbourhood.id ?? neighbourhood.name}
                    className="flex min-h-12 items-center gap-3 border-b border-hairline py-2"
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex h-7 min-w-9 shrink-0 items-center justify-center rounded-tile border border-tile-edge bg-land type-data"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 font-semibold">
                      {neighbourhood.name}
                    </span>
                  </li>
                ))}
              </ol>
              <Sources numbers={refs("neighborhoods")} />
            </>
          ) : (
            <EmptyState>
              Bu ilçe için resmî kaynaktan kontrol edilmiş tam mahalle listesi
              henüz eklenmedi.
            </EmptyState>
          )}
        </GuideSection>
      ))}

      {render("gayrimenkul", (item) => (
        <GuideSection section={item} total={total}>
          <Prose value={guide?.housingTexture} />
          <Sources numbers={refs("housingTexture")} />
          {guide?.regionalAssessment ? (
            <>
              <h3 className="m-0 type-h3">Bölgesel değerlendirme</h3>
              <Prose value={guide.regionalAssessment} />
              <Sources numbers={refs("regionalAssessment")} />
            </>
          ) : null}
          {guide?.marketData ? (
            <div className="max-w-[60rem]">
              <h3 className="m-0 mb-4 type-h3">Piyasa göstergeleri</h3>
              <FactTable
                facts={[
                  ...(guide.marketData.salePricePerM2 == null
                    ? []
                    : [
                        {
                          id: "sale",
                          label: "Ortalama m² satış fiyatı",
                          value:
                            guide.marketData.salePricePerM2.toLocaleString(
                              "tr-TR",
                            ),
                          unit: "TL",
                          date: formatDate(guide.marketData.dataDate) ?? "",
                          sources: refs("marketData"),
                        },
                      ]),
                  ...(guide.marketData.averageRent == null
                    ? []
                    : [
                        {
                          id: "rent",
                          label: "Ortalama kira",
                          value:
                            guide.marketData.averageRent.toLocaleString(
                              "tr-TR",
                            ),
                          unit: "TL",
                          date: formatDate(guide.marketData.dataDate) ?? "",
                          sources: refs("marketData"),
                        },
                      ]),
                ]}
                caption={[
                  guide.marketData.source
                    ? `Veri kaynağı: ${guide.marketData.source}.`
                    : null,
                  `Son kontrol: ${formatDate(guide.marketData.checkedAt) ?? "belirtilmemiş"}.`,
                  guide.marketData.description,
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
            </div>
          ) : (
            <p className="m-0 max-w-measure type-small text-ink-muted">
              Kaynak ve tarihi doğrulanmış ilçe ölçeğinde satış fiyatı, kira ve
              m² göstergesi henüz yayımlanmadı. Konut anlatımı sayısal değerleme
              içermez.
            </p>
          )}
          <p className="m-0 max-w-measure border-l-4 border-signal bg-land px-5 py-4 type-small">
            Bu içerik yatırım tavsiyesi değildir. Konut anlatımı ilçe
            ölçeğindedir; tek bir taşınmazın değerini veya imar durumunu
            belirlemez. Fiyat ve kira göstergeleri yalnız kaynak ve veri tarihi
            doğrulandığında gösterilir.
          </p>
        </GuideSection>
      ))}

      {render("imar", (item) => (
        <GuideSection section={item} total={total} heading={planningHeading}>
          {guide && guide.planningDevelopments.length > 0 ? (
            <ul className="m-0 grid list-none gap-0 border-t-2 border-ink p-0">
              {guide.planningDevelopments.map((development) => {
                const status = planningStatusLabel(development.status);
                return (
                  <li
                    key={development.id ?? development.title}
                    className="grid gap-3 border-b border-hairline py-6"
                  >
                    <h3 className="m-0 type-h3">{development.title}</h3>
                    <MetaLine
                      parts={[
                        status ? (
                          <Badge key="status" tone="neutral">
                            {status}
                          </Badge>
                        ) : null,
                        development.neighborhood,
                        <TimeText key="date" value={development.date} />,
                        <Fragment key="checked">
                          Son kontrol:{" "}
                          <TimeText value={development.checkedAt} />
                        </Fragment>,
                      ]}
                    />
                    <Prose
                      value={development.summary}
                      empty="Özet eklenmedi."
                    />
                    {development.officialSource ? (
                      <p className="m-0">
                        <TextLink
                          href={development.officialSource}
                          variant="standalone"
                          external
                        >
                          Resmî kaynak
                        </TextLink>
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState>
              Bu ilçe için kaynak ve tarihi doğrulanmış şehircilik gelişmesi
              henüz eklenmedi.
            </EmptyState>
          )}
          <p className="m-0 max-w-measure type-small text-ink-muted">
            Taşınmaza özgü imar durumu için ilgili kurumun güncel resmî
            kayıtları esas alınmalıdır.
          </p>
        </GuideSection>
      ))}

      {render("saha", (item) => (
        <GuideSection section={item} total={total}>
          <Prose value={guide?.placesGuide} />
          <Sources numbers={refs("placesGuide")} />
        </GuideSection>
      ))}

      {render("kareler", (item) => (
        <GuideSection section={item} total={total}>
          {unavailable.has("photos") ? (
            <EmptyState>{unavailableText("Fotoğraflar")}</EmptyState>
          ) : photos.length === 0 ? (
            <EmptyState>
              Bu ilçeden seçilmiş fotoğraflar henüz eklenmedi.
            </EmptyState>
          ) : galleryPhotos.length === 0 ? (
            <p className="m-0 max-w-measure type-small text-ink-muted">
              Bu ilçeden yayımlanan tek fotoğraf sayfanın başında yer alıyor.
            </p>
          ) : (
            <ul className="m-0 grid list-none gap-8 p-0 md:grid-cols-2">
              {galleryPhotos.map((photo, index) => (
                <li
                  key={photo.id}
                  className={index === 0 ? "md:col-span-2" : undefined}
                >
                  {categoryLabel(photo.districtPhotoCategory) &&
                  photo.districtPhotoCategory !== "tarih" ? (
                    <p className="m-0 mb-2 type-label text-ink-muted">
                      {categoryLabel(photo.districtPhotoCategory)}
                    </p>
                  ) : null}
                  <DistrictPhoto
                    photo={photo}
                    sizes={
                      index === 0
                        ? "(max-width: 1440px) 100vw, 1296px"
                        : "(max-width: 768px) 100vw, 640px"
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </GuideSection>
      ))}

      {render("kimlik", (item) => (
        <GuideSection section={item} total={total}>
          <Prose value={guide?.distinctiveFeatures} />
          <Sources numbers={refs("distinctiveFeatures")} />
        </GuideSection>
      ))}

      {render("arastirmalar", (item) => (
        <GuideSection section={item} total={total}>
          {guide?.researchTopics ? (
            <>
              <Prose value={guide.researchTopics} />
              <Sources numbers={refs("researchTopics")} />
            </>
          ) : null}
          {unavailable.has("research") ? (
            <EmptyState>{unavailableText("Araştırmalar")}</EmptyState>
          ) : (
            <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
              {research.map((article) => (
                <li key={article.id} className="flex">
                  <Card
                    title={article.title}
                    href={`/makaleler/${article.slug}`}
                    cta="Araştırmayı oku"
                    className="w-full"
                  >
                    <p className="m-0 type-small text-ink-muted">
                      {article.summary}
                    </p>
                    <p className="m-0 type-data text-ink-muted">
                      <TimeText value={article.publishedAt} />
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </GuideSection>
      ))}

      {render("haberler", (item) => (
        <GuideSection section={item} total={total}>
          {unavailable.has("news") ? (
            <EmptyState>{unavailableText("Haberler")}</EmptyState>
          ) : (
            <>
              <ul className="m-0 grid list-none gap-0 border-t-2 border-ink p-0">
                {news.slice(0, 3).map((entry) => (
                  <li
                    key={entry.id}
                    className="grid gap-4 border-b border-hairline py-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6"
                  >
                    {entry.featuredImage ? (
                      <Figure
                        credit={
                          entry.featuredImage.credit
                            ? { collection: entry.featuredImage.credit }
                            : null
                        }
                      >
                        <Image
                          src={entry.featuredImage.src}
                          alt={entry.featuredImage.alt}
                          width={entry.featuredImage.width ?? 640}
                          height={entry.featuredImage.height ?? 360}
                          sizes="(max-width: 640px) 100vw, 176px"
                          className="aspect-video h-auto w-full rounded-card object-cover"
                        />
                      </Figure>
                    ) : null}
                    <div
                      className={
                        entry.featuredImage
                          ? "grid min-w-0 gap-2"
                          : "grid min-w-0 gap-2 sm:col-span-2"
                      }
                    >
                      <p className="m-0 type-label text-ink-muted">
                        {categoryLabel(entry.newsCategory) ?? "Yerel gelişme"}
                      </p>
                      <h3 className="m-0 type-h3">{entry.title}</h3>
                      <p className="m-0 max-w-measure type-small">
                        {entry.summary}
                      </p>
                      <MetaLine
                        parts={[
                          <TimeText key="date" value={entry.publishedAt} />,
                          entry.externalSource?.name,
                        ]}
                      />
                      {entry.externalSource ? (
                        <p className="m-0">
                          <TextLink
                            href={entry.externalSource.url}
                            variant="standalone"
                            external
                          >
                            Kaynağa git
                          </TextLink>
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="m-0">
                <TextLink
                  href={getDistrictNewsPath(district.slug)}
                  variant="standalone"
                >
                  Tüm {district.name} haberleri
                </TextLink>
              </p>
            </>
          )}
        </GuideSection>
      ))}

      {render("kaynaklar", (item) => (
        <GuideSection section={item} total={total} tone="land">
          <p className="m-0 max-w-measure type-body">
            Araştırma belgeleri başlangıç kaynağıdır. Nüfus, mahalle ve ulaşım
            bilgileri kaynak ve veri tarihiyle değerlendirilir. Piyasa ve proje
            durumları son doğrulama tarihine göre yeniden incelenir;
            doğrulanmamış bilgiler yayımlanmaz. Kaynak listesinde veriyi
            barındıran gerçek yayıncı gösterilir. Tarihsiz mahalle dizinlerinde
            veri tarihi, listenin gözlendiği gündür; kurumun yayın tarihi olarak
            yorumlanmamalıdır. Resmî sayfalardaki her iddia otomatik olarak
            onaylanmaz.
          </p>
          {sourceRows.length === 0 ? (
            <EmptyState>
              Yayımlanan içerikleri destekleyen kontrol edilmiş kaynaklar burada
              listelenecek. Son kontrol bilgisi kaynak eklendiğinde
              gösterilecek.
            </EmptyState>
          ) : (
            <ol className="m-0 grid list-none gap-0 border-t-2 border-ink p-0">
              {sourceRows.map((row) => (
                <li
                  key={`${row.number}-${row.url}`}
                  id={sourceAnchorId(row.number)}
                  className="grid scroll-mt-4 gap-x-6 gap-y-2 border-b border-hairline py-5 md:grid-cols-[4rem_minmax(0,1fr)]"
                >
                  <p className="m-0 type-data-lg" aria-hidden="true">
                    [{row.number}]
                  </p>
                  <div className="grid min-w-0 gap-2 break-words">
                    <h3 className="m-0 type-h4">
                      <span className="sr-only">Kaynak {row.number}: </span>
                      {row.title}
                    </h3>
                    <p className="m-0 type-small">
                      {row.publisher} · {row.kind} · {row.role}
                    </p>
                    <dl className="m-0 grid gap-x-6 gap-y-1 type-small sm:grid-cols-[auto_minmax(0,1fr)]">
                      <dt className="text-ink-muted">Veri/gözlem tarihi</dt>
                      <dd className="m-0">
                        {row.dataDateTime ? (
                          <time dateTime={row.dataDateTime}>
                            {row.dataDate}
                          </time>
                        ) : (
                          row.dataDate
                        )}
                      </dd>
                      <dt className="text-ink-muted">Son kontrol</dt>
                      <dd className="m-0">
                        {row.checkedAtDateTime ? (
                          <time dateTime={row.checkedAtDateTime}>
                            {row.checkedAt}
                          </time>
                        ) : (
                          row.checkedAt
                        )}
                      </dd>
                      <dt className="text-ink-muted">İlgili bölümler</dt>
                      <dd className="m-0">{row.sections}</dd>
                    </dl>
                    <p className="m-0">
                      <TextLink
                        href={row.url}
                        variant="standalone"
                        external
                        className="break-all"
                      >
                        Kaynak bağlantısı
                      </TextLink>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </GuideSection>
      ))}

      {render("guncelleme", (item) => (
        <GuideSection section={item} total={total}>
          <p className="m-0 max-w-measure type-body">
            {guide?.updatedAt ? (
              <>
                İçerik güncellemesi: <TimeText value={guide.updatedAt} />.
                Verilerin kontrol tarihleri kaynak listesinde ayrı gösterilir.
              </>
            ) : (
              "İçerik güncellemesi: Bu rehberin doğrulanmış içerik yayını henüz tamamlanmadı."
            )}
          </p>
        </GuideSection>
      ))}
    </>
  );
}
