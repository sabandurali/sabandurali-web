import type { Metadata } from "next";
import DistrictDirectory from "@/components/districts/DistrictDirectory";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { homeCrumb } from "@/components/ui/Breadcrumb";
import DistrictTileMap from "@/components/ui/DistrictTileMap";
import PageIntro from "@/components/ui/PageIntro";
import Section from "@/components/ui/Section";
import { getDistrictTiles } from "@/components/ui/district-tile-grid";
import { getDistrictGuideSummaries } from "@/content/districts/district-guide-data-source";
import {
  districts,
  getDistrictsBySide,
} from "@/content/districts/district-registry";
import { districtGuidePath } from "@/content/districts/district-routes";
import { homeContent } from "@/content/homeContent";
import { createPageMetadata } from "@/lib/metadata";

// Prerendered and refreshed at most hourly; CMS writes to a district guide
// revalidate this path on demand (src/lib/revalidation.ts). The hourly pass
// re-applies the content policy's source-freshness rules to the summaries.
export const revalidate = 3600;

const description =
  "İstanbul’un 39 ilçesi için kaynak temelli ilçe rehberleri.";

export const metadata: Metadata = createPageMetadata({
  title: "İstanbul İlçe Rehberi | Şaban Durali",
  description,
  locale: "tr",
  path: districtGuidePath,
});

export default async function DistrictIndexPage() {
  const summaries = await getDistrictGuideSummaries();
  const tiles = getDistrictTiles();
  const entries = districts.map(({ name, slug, side }) => ({
    name,
    slug,
    side,
    ref: tiles.find((tile) => tile.slug === slug)?.ref ?? "",
    summary: summaries.get(slug) ?? null,
  }));
  const home = homeContent.tr;
  const stats = [
    { label: "Toplam", value: districts.length },
    { label: "Avrupa Yakası", value: getDistrictsBySide("avrupa").length },
    { label: "Anadolu Yakası", value: getDistrictsBySide("anadolu").length },
    { label: "Yayımlanan rehber", value: summaries.size },
  ];

  return (
    <div id="top" lang="tr">
      <Header
        locale="tr"
        anchors={home.anchors}
        content={home.header}
        anchorPrefix="/"
        languageHrefs={{ tr: districtGuidePath, en: "/en" }}
      />
      <main id="main" className="bg-paper text-ink scheme-light">
        <PageIntro
          layout="page"
          breadcrumb={[
            homeCrumb("tr"),
            { label: "İstanbul", href: "/gayrimenkul-ve-istanbul" },
            { label: "İlçeler" },
          ]}
          eyebrow="İSTANBUL ATLASI"
          title="İstanbul İlçe Rehberi"
          lead="39 ilçeyi doğrulanmış içerik ve tarihli kaynaklarla okumak için bir başlangıç noktası. Haritadan ya da listeden bir ilçe seçin."
        >
          <dl className="m-0 grid max-w-[52rem] grid-cols-2 border-t-2 border-ink sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col-reverse gap-1 border-b border-hairline py-3 pr-4"
              >
                <dt className="type-caption text-ink-muted">{stat.label}</dt>
                <dd className="m-0 type-data-lg">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </PageIntro>

        <Section
          id="atlas"
          labelledBy="atlas-baslik"
          tone="paper"
          spacing="compact"
          divider
        >
          <h2 id="atlas-baslik" className="m-0 mb-6 type-h2">
            39 ilçe haritada
          </h2>
          <DistrictTileMap groupHeadingLevel={3} />
        </Section>

        <Section
          id="ilce-listesi"
          labelledBy="ilce-listesi-baslik"
          tone="band"
          spacing="compact"
          divider
        >
          <h2 id="ilce-listesi-baslik" className="m-0 mb-6 type-h2">
            İlçe listesi
          </h2>
          <DistrictDirectory entries={entries} />
        </Section>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
