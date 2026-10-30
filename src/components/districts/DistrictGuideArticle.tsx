import { Fragment, type ReactNode } from "react";
import Breadcrumb, { homeBreadcrumbItem } from "@/components/ui/Breadcrumb";
import Chip from "@/components/ui/Chip";
import Container from "@/components/ui/Container";
import DistrictKeyMap from "@/components/ui/DistrictKeyMap";
import GridRef from "@/components/ui/GridRef";
import PlateTitle from "@/components/ui/PlateTitle";
import {
  getDistrictLabel,
  getDistrictTiles,
} from "@/components/ui/district-tile-grid";
import type { DistrictSection } from "@/content/districts/district-content-policy";
import type { DistrictPageData } from "@/content/districts/district-page-data";
import type { District } from "@/content/districts/district-registry";
import { districtGuidePath } from "@/content/districts/district-routes";
import {
  selectDistrictGalleryPhotos,
  selectDistrictHeroPhoto,
} from "@/content/photos/district-photo-selection";
import { districtWorkspaceCrumb } from "./district-breadcrumb";
import {
  getDistrictListSections,
  getVisibleDistrictSections,
  parseNeighbourSlugs,
  sourceNumbersFor,
  type DistrictGuideSectionId,
  type VisibleDistrictSection,
} from "./district-guide-model";
import { DistrictPhoto } from "./district-guide-parts";
import {
  DistrictGeographySection,
  DistrictHistorySection,
  DistrictHousingSection,
  DistrictIdentitySection,
  DistrictLifeSection,
  DistrictNeighbourhoodsSection,
  DistrictNewsSection,
  DistrictOverviewSection,
  DistrictPhotosSection,
  DistrictPlacesSection,
  DistrictPlanningSection,
  DistrictResearchSection,
  DistrictSourcesSection,
  DistrictUpdateSection,
  type GuideSectionProps,
} from "./district-guide-sections";

/** Data the guide renders: the page data of getDistrictPageData(slug). */
export type DistrictGuideArticleProps = {
  district: District;
  data: Pick<
    DistrictPageData,
    "guide" | "photos" | "research" | "news" | "unavailableSections"
  >;
};

/**
 * The district guide in the İstanbul Atlası design: a plate title, the
 * fixed 14-section contract (docs/PROJECT-STATE.md §H) with wayfinding
 * signs, a fact table with dated, numbered sources and the schematic
 * tile map. Only the public projection is rendered; missing content gets
 * an explicit empty state. Each section lives in district-guide-sections.
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
  const heroPhoto = selectDistrictHeroPhoto(photos);
  const galleryPhotos = selectDistrictGalleryPhotos(photos, heroPhoto);
  const lead =
    guide?.facts?.locationSummary ??
    guide?.summary ??
    "Bu ilçe için doğrulanmış rehber içeriği henüz yayımlanmadı.";

  const visible = getVisibleDistrictSections(
    getDistrictListSections({ research, news, unavailableSections }),
  );
  const total = visible.length;

  const renderSection = (item: VisibleDistrictSection): ReactNode => {
    const props: GuideSectionProps = { item, total, district, guide, refs };
    const sections: Record<DistrictGuideSectionId, () => ReactNode> = {
      "genel-bakis": () => <DistrictOverviewSection {...props} />,
      tarihce: () => <DistrictHistorySection {...props} />,
      tani: () => (
        <DistrictGeographySection {...props} neighbours={neighbours} />
      ),
      yasam: () => <DistrictLifeSection {...props} />,
      mahalleler: () => <DistrictNeighbourhoodsSection {...props} />,
      gayrimenkul: () => <DistrictHousingSection {...props} />,
      imar: () => <DistrictPlanningSection {...props} />,
      saha: () => <DistrictPlacesSection {...props} />,
      kareler: () => (
        <DistrictPhotosSection
          {...props}
          photos={photos}
          galleryPhotos={galleryPhotos}
          unavailable={unavailable.has("photos")}
        />
      ),
      kimlik: () => <DistrictIdentitySection {...props} />,
      arastirmalar: () => (
        <DistrictResearchSection
          {...props}
          research={research}
          unavailable={unavailable.has("research")}
        />
      ),
      haberler: () => (
        <DistrictNewsSection
          {...props}
          news={news}
          unavailable={unavailable.has("news")}
        />
      ),
      kaynaklar: () => <DistrictSourcesSection {...props} />,
      guncelleme: () => <DistrictUpdateSection {...props} />,
    };
    return sections[item.id]();
  };

  return (
    <>
      <Container as="header" className="pt-6 pb-10 sm:pb-14">
        <Breadcrumb
          items={[
            homeBreadcrumbItem("tr"),
            districtWorkspaceCrumb,
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
            priority
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

      {visible.map((item) => (
        <Fragment key={item.id}>{renderSection(item)}</Fragment>
      ))}
    </>
  );
}
