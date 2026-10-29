import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import DistrictTileMap from "@/components/ui/DistrictTileMap";
import EmptyState from "@/components/ui/EmptyState";
import FactTable from "@/components/ui/FactTable";
import { Figure } from "@/components/ui/Figure";
import { LineChip } from "@/components/ui/LineChip";
import { sourceAnchorId } from "@/components/ui/SourceRef";
import TextLink from "@/components/ui/TextLink";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { DistrictSection } from "@/content/districts/district-content-policy";
import type { DistrictGuide } from "@/content/districts/district-guide-projection";
import type { District } from "@/content/districts/district-registry";
import { getDistrictNewsPath } from "@/content/districts/district-routes";
import type { PublicPhoto } from "@/content/photos/types";
import { formatDate } from "@/lib/format-date";
import {
  buildDistrictFacts,
  buildMarketFacts,
  buildSourceRows,
  categoryLabel,
  extractLineCodes,
  planningStatusLabel,
  type VisibleDistrictSection,
} from "./district-guide-model";
import {
  DistrictPhoto,
  GuideSection,
  MetaLine,
  Prose,
  Sources,
  TimeText,
  unavailableText,
} from "./district-guide-parts";

/**
 * One component per section of the fixed guide contract
 * (docs/PROJECT-STATE.md §H). DistrictGuideArticle decides which sections
 * are visible and in which order; each section only renders its content.
 */
export type GuideSectionProps = {
  item: VisibleDistrictSection;
  total: number;
  district: District;
  guide: DistrictGuide | null;
  /** Numbers of the sources that support the given guide sections. */
  refs: (...sections: DistrictSection[]) => number[];
};

/** A section that is one prose field and its sources. */
function ProseSection({
  item,
  total,
  value,
  sources,
}: Pick<GuideSectionProps, "item" | "total"> & {
  value: string | null | undefined;
  sources: readonly number[];
}) {
  return (
    <GuideSection section={item} total={total}>
      <Prose value={value} />
      <Sources numbers={sources} />
    </GuideSection>
  );
}

export function DistrictOverviewSection({
  item,
  total,
  district,
  guide,
  refs,
}: GuideSectionProps) {
  const facts = buildDistrictFacts(district, guide);
  const hasPublishedFacts = facts.some((fact) => fact.id !== "side");
  return (
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
              </>
            }
          />
        ) : (
          <EmptyState>
            Kaynağı ve veri tarihi doğrulanmış temel veriler henüz eklenmedi.
          </EmptyState>
        )}
        <p className="mt-3 mb-0">
          <TextLink href="#kaynaklar" variant="standalone">
            Veri kaynakları ve kontrol tarihleri
          </TextLink>
        </p>
      </div>
    </GuideSection>
  );
}

export function DistrictHistorySection(props: GuideSectionProps) {
  return (
    <ProseSection
      {...props}
      value={props.guide?.history}
      sources={props.refs("history")}
    />
  );
}

export function DistrictGeographySection({
  item,
  total,
  district,
  guide,
  refs,
  neighbours,
}: GuideSectionProps & { neighbours: readonly string[] }) {
  return (
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
  );
}

export function DistrictLifeSection({
  item,
  total,
  guide,
  refs,
}: GuideSectionProps) {
  const lineCodes = extractLineCodes(guide?.transportation);
  return (
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
              istasyonların ilçeye hizmet ettiğini aşağıdaki metin ve kaynaklar
              belirtir.
            </p>
          </div>
        ) : null}
        <Prose value={guide?.transportation} />
        <Sources numbers={refs("transportation")} />
      </div>
    </GuideSection>
  );
}

export function DistrictNeighbourhoodsSection({
  item,
  total,
  guide,
  refs,
}: GuideSectionProps) {
  const neighbourhoods = guide?.neighborhoods ?? [];
  const neighbourhoodCount =
    guide?.facts?.neighborhoodCount ??
    (neighbourhoods.length > 0 ? neighbourhoods.length : null);
  return (
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
          Bu ilçe için resmî kaynaktan kontrol edilmiş tam mahalle listesi henüz
          eklenmedi.
        </EmptyState>
      )}
    </GuideSection>
  );
}

function DistrictMarketIndicators({
  marketData,
  sources,
}: {
  marketData: NonNullable<DistrictGuide["marketData"]>;
  sources: readonly number[];
}) {
  return (
    <div className="max-w-[60rem]">
      <h3 className="m-0 mb-4 type-h3">Piyasa göstergeleri</h3>
      <FactTable
        facts={buildMarketFacts(marketData, sources)}
        caption={[
          marketData.source ? `Veri kaynağı: ${marketData.source}.` : null,
          `Son kontrol: ${formatDate(marketData.checkedAt) ?? "belirtilmemiş"}.`,
          marketData.description,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}

export function DistrictHousingSection({
  item,
  total,
  guide,
  refs,
}: GuideSectionProps) {
  return (
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
        <DistrictMarketIndicators
          marketData={guide.marketData}
          sources={refs("marketData")}
        />
      ) : (
        <p className="m-0 max-w-measure type-small text-ink-muted">
          Kaynak ve tarihi doğrulanmış ilçe ölçeğinde satış fiyatı, kira ve m²
          göstergesi henüz yayımlanmadı. Konut anlatımı sayısal değerleme
          içermez.
        </p>
      )}
      <p className="m-0 max-w-measure border-l-4 border-signal bg-land px-5 py-4 type-small">
        Bu içerik yatırım tavsiyesi değildir. Konut anlatımı ilçe ölçeğindedir;
        tek bir taşınmazın değerini veya imar durumunu belirlemez. Fiyat ve kira
        göstergeleri yalnız kaynak ve veri tarihi doğrulandığında gösterilir.
      </p>
    </GuideSection>
  );
}

export function DistrictPlanningSection({
  item,
  total,
  guide,
}: GuideSectionProps) {
  const developments = guide?.planningDevelopments ?? [];
  const heading =
    developments.length === 1 && /\bM8\b/i.test(developments[0]?.title ?? "")
      ? "Ulaşım gelişmesi: M8"
      : undefined;
  return (
    <GuideSection section={item} total={total} heading={heading}>
      {developments.length > 0 ? (
        <ul className="m-0 grid list-none gap-0 border-t-2 border-ink p-0">
          {developments.map((development) => {
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
                      Son kontrol: <TimeText value={development.checkedAt} />
                    </Fragment>,
                  ]}
                />
                <Prose value={development.summary} empty="Özet eklenmedi." />
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
          Bu ilçe için kaynak ve tarihi doğrulanmış şehircilik gelişmesi henüz
          eklenmedi.
        </EmptyState>
      )}
      <p className="m-0 max-w-measure type-small text-ink-muted">
        Taşınmaza özgü imar durumu için ilgili kurumun güncel resmî kayıtları
        esas alınmalıdır.
      </p>
    </GuideSection>
  );
}

export function DistrictPlacesSection(props: GuideSectionProps) {
  return (
    <ProseSection
      {...props}
      value={props.guide?.placesGuide}
      sources={props.refs("placesGuide")}
    />
  );
}

export function DistrictPhotosSection({
  item,
  total,
  photos,
  galleryPhotos,
  unavailable,
}: Pick<GuideSectionProps, "item" | "total"> & {
  photos: readonly PublicPhoto[];
  galleryPhotos: readonly PublicPhoto[];
  unavailable: boolean;
}) {
  let content: ReactNode;
  if (unavailable) {
    content = <EmptyState>{unavailableText("Fotoğraflar")}</EmptyState>;
  } else if (photos.length === 0) {
    content = (
      <EmptyState>Bu ilçeden seçilmiş fotoğraflar henüz eklenmedi.</EmptyState>
    );
  } else if (galleryPhotos.length === 0) {
    content = (
      <p className="m-0 max-w-measure type-small text-ink-muted">
        Bu ilçeden yayımlanan tek fotoğraf sayfanın başında yer alıyor.
      </p>
    );
  } else {
    content = (
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
    );
  }
  return (
    <GuideSection section={item} total={total}>
      {content}
    </GuideSection>
  );
}

export function DistrictIdentitySection(props: GuideSectionProps) {
  return (
    <ProseSection
      {...props}
      value={props.guide?.distinctiveFeatures}
      sources={props.refs("distinctiveFeatures")}
    />
  );
}

export function DistrictResearchSection({
  item,
  total,
  guide,
  refs,
  research,
  unavailable,
}: GuideSectionProps & {
  research: readonly PublicArticleSummary[];
  unavailable: boolean;
}) {
  return (
    <GuideSection section={item} total={total}>
      {guide?.researchTopics ? (
        <>
          <Prose value={guide.researchTopics} />
          <Sources numbers={refs("researchTopics")} />
        </>
      ) : null}
      {unavailable ? (
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
  );
}

function DistrictNewsItem({ entry }: { entry: PublicArticleSummary }) {
  return (
    <li className="grid gap-4 border-b border-hairline py-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
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
        <p className="m-0 max-w-measure type-small">{entry.summary}</p>
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
  );
}

export function DistrictNewsSection({
  item,
  total,
  district,
  news,
  unavailable,
}: Pick<GuideSectionProps, "item" | "total" | "district"> & {
  news: readonly PublicArticleSummary[];
  unavailable: boolean;
}) {
  return (
    <GuideSection section={item} total={total}>
      {unavailable ? (
        <EmptyState>{unavailableText("Haberler")}</EmptyState>
      ) : (
        <>
          <ul className="m-0 grid list-none gap-0 border-t-2 border-ink p-0">
            {news.slice(0, 3).map((entry) => (
              <DistrictNewsItem key={entry.id} entry={entry} />
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
  );
}

export function DistrictSourcesSection({
  item,
  total,
  guide,
}: GuideSectionProps) {
  const sourceRows = buildSourceRows(guide?.sources ?? []);
  return (
    <GuideSection section={item} total={total} tone="land">
      <p className="m-0 max-w-measure type-body">
        Araştırma belgeleri başlangıç kaynağıdır. Nüfus, mahalle ve ulaşım
        bilgileri kaynak ve veri tarihiyle değerlendirilir. Piyasa ve proje
        durumları son doğrulama tarihine göre yeniden incelenir; doğrulanmamış
        bilgiler yayımlanmaz. Kaynak listesinde veriyi barındıran gerçek yayıncı
        gösterilir. Tarihsiz mahalle dizinlerinde veri tarihi, listenin
        gözlendiği gündür; kurumun yayın tarihi olarak yorumlanmamalıdır. Resmî
        sayfalardaki her iddia otomatik olarak onaylanmaz.
      </p>
      {sourceRows.length === 0 ? (
        <EmptyState>
          Yayımlanan içerikleri destekleyen kontrol edilmiş kaynaklar burada
          listelenecek. Son kontrol bilgisi kaynak eklendiğinde gösterilecek.
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
                      <time dateTime={row.dataDateTime}>{row.dataDate}</time>
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
  );
}

export function DistrictUpdateSection({
  item,
  total,
  guide,
}: GuideSectionProps) {
  return (
    <GuideSection section={item} total={total}>
      <p className="m-0 max-w-measure type-body">
        {guide?.updatedAt ? (
          <>
            İçerik güncellemesi: <TimeText value={guide.updatedAt} />. Verilerin
            kontrol tarihleri kaynak listesinde ayrı gösterilir.
          </>
        ) : (
          "İçerik güncellemesi: Bu rehberin doğrulanmış içerik yayını henüz tamamlanmadı."
        )}
      </p>
    </GuideSection>
  );
}
