import Image from "next/image";
import Card from "@/components/ui/Card";
import DistrictTileMap from "@/components/ui/DistrictTileMap";
import EmptyState from "@/components/ui/EmptyState";
import { Credit, type CreditInfo } from "@/components/ui/Figure";
import GridRef from "@/components/ui/GridRef";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import { getDistrictTiles } from "@/components/ui/district-tile-grid";
import { getDistrict } from "@/content/districts/district-registry";
import {
  districtGuidePath,
  getDistrictPath,
} from "@/content/districts/district-routes";
import type { LocalizedDistrictImage } from "@/content/photos/verified-district-images";
import type { SiteLocale } from "@/lib/metadata";
import HomeSectionHeading from "./HomeSectionHeading";
import { homeCopy } from "./home-copy";
import { excerpt } from "./home-selection";

export type HomeFeaturedGuide = {
  slug: string;
  /** Public summary of the published guide (Turkish). */
  summary: string;
  image: LocalizedDistrictImage | null;
};

type HomeAtlasProps = {
  locale: SiteLocale;
  featured: HomeFeaturedGuide | null;
  /**
   * Shown instead of "no guide published yet" when the guide summaries
   * could not be read (ARCHITECTURE-1): a failed query is not an empty one.
   */
  featuredUnavailable?: string | null;
};

const sideLabel = {
  tr: { avrupa: "Avrupa Yakası", anadolu: "Anadolu Yakası" },
  en: { avrupa: "European side", anadolu: "Asian side" },
} as const;

/**
 * Credit of a verified district photo in the page language: the recorded
 * credit line (author · date · licence · edit note) with links to the
 * licence and the original record.
 */
export function getDistrictImageCredit(
  image: LocalizedDistrictImage,
  locale: SiteLocale,
): CreditInfo {
  return {
    collection: image.credit,
    licence: homeCopy[locale].licence,
    licenceUrl: image.licenseUrl,
    sourceUrl: image.recordUrl,
  };
}

function FeaturedGuideCard({
  locale,
  featured,
}: {
  locale: SiteLocale;
  featured: HomeFeaturedGuide;
}) {
  const copy = homeCopy[locale].atlas;
  const district = getDistrict(featured.slug);
  const tile = getDistrictTiles().find((item) => item.slug === featured.slug);
  if (district === null) return null;

  const image = featured.image;

  return (
    <Card
      title={district.name}
      href={getDistrictPath(featured.slug)}
      hrefLang={locale === "en" ? "tr" : undefined}
      headingLevel={4}
      cta={copy.guideCta}
      media={
        image === null ? undefined : (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        )
      }
      credit={
        image === null ? undefined : (
          <Credit
            locale={locale}
            credit={getDistrictImageCredit(image, locale)}
          />
        )
      }
      eyebrow={
        <>
          {tile ? <GridRef value={tile.ref} locale={locale} /> : null}
          <span>{sideLabel[locale][district.side]}</span>
        </>
      }
    >
      <p lang="tr" className="m-0 type-body text-ink">
        {excerpt(featured.summary, 260)}
      </p>
      {copy.summaryLanguageNote ? (
        <p className="m-0 type-caption text-ink-muted">
          {copy.summaryLanguageNote}
        </p>
      ) : null}
    </Card>
  );
}

/**
 * The 39-district atlas: heading, the full tile map with the featured
 * guide, then the featured guide's card (or an explicit empty state when
 * no guide is published, or a "temporarily unavailable" one when the
 * summaries could not be read).
 */
export default function HomeAtlas({
  locale,
  featured,
  featuredUnavailable = null,
}: HomeAtlasProps) {
  const copy = homeCopy[locale].atlas;
  const headingId = "istanbul-atlasi-baslik";

  return (
    <Section id="istanbul" tone="band" labelledBy={headingId}>
      <HomeSectionHeading
        id={headingId}
        number={copy.number}
        eyebrow={copy.eyebrow}
        title={copy.title}
        action={
          <TextLink
            href={districtGuidePath}
            variant="standalone"
            hrefLang={locale === "en" ? "tr" : undefined}
            locale={locale}
          >
            {copy.allDistricts}
          </TextLink>
        }
      >
        <p className="m-0">{copy.description}</p>
      </HomeSectionHeading>

      <DistrictTileMap
        className="mt-8"
        locale={locale}
        featuredSlug={featured?.slug}
        hrefLang={locale === "en" ? "tr" : undefined}
        groupHeadingLevel={3}
        caption={copy.caption ?? undefined}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start lg:gap-10">
        <h3 className="m-0 type-h3">{copy.featuredHeading}</h3>
        {featured === null && featuredUnavailable !== null ? (
          <EmptyState>{featuredUnavailable}</EmptyState>
        ) : featured === null ? (
          <EmptyState note={copy.featuredEmptyNote}>
            {copy.featuredEmpty}
          </EmptyState>
        ) : (
          <FeaturedGuideCard locale={locale} featured={featured} />
        )}
      </div>
    </Section>
  );
}
