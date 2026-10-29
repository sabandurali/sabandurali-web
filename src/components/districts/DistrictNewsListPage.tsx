import BackToTop from "@/components/layout/BackToTop";
import DistrictNewsCard from "@/components/districts/DistrictNewsCard";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { homeCrumb } from "@/components/ui/Breadcrumb";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import PageIntro from "@/components/ui/PageIntro";
import Pagination from "@/components/ui/Pagination";
import TextLink from "@/components/ui/TextLink";
import type { PublicArticleSummaryPage } from "@/content/articles/public-types";
import type { District } from "@/content/districts/district-registry";
import {
  districtGuidePath,
  getDistrictPath,
} from "@/content/districts/district-routes";
import { homeContent } from "@/content/homeContent";
import { getDistrictNewsPagePath } from "./district-news-pages";

export default function DistrictNewsListPage({
  district,
  news,
}: {
  district: District;
  /** One page of news, paginated in the database (`getDistrictNewsPage`). */
  news: PublicArticleSummaryPage;
}) {
  const home = homeContent.tr;
  const { items, currentPage, totalPages } = news;
  const href = (target: number) =>
    getDistrictNewsPagePath(district.slug, target);

  return (
    <div id="top" lang="tr">
      <Header
        locale="tr"
        anchors={home.anchors}
        content={home.header}
        anchorPrefix="/"
        languageHrefs={{ tr: href(currentPage), en: "/en" }}
      />
      <main id="main" className="bg-paper text-ink scheme-light">
        <PageIntro
          layout="page"
          breadcrumb={[
            homeCrumb("tr"),
            { label: "İstanbul", href: "/gayrimenkul-ve-istanbul" },
            { label: "İlçeler", href: districtGuidePath },
            { label: district.name, href: getDistrictPath(district.slug) },
            { label: "Haberler" },
          ]}
          eyebrow="İLÇEDEN HABERLER"
          title={`${district.name} haberleri`}
          lead="Başlık, özgün kısa özet, tarih ve kaynak bağlantısıyla yerel gelişmeler."
        />
        <Container className="pb-section">
          <div className="border-t-2 border-ink pt-8">
            {items.length === 0 ? (
              <EmptyState
                note={
                  <TextLink
                    href={getDistrictPath(district.slug)}
                    variant="standalone"
                  >
                    {district.name} rehberine dön
                  </TextLink>
                }
              >
                Bu ilçe için yayımlanmış haber bulunmuyor.
              </EmptyState>
            ) : (
              <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <li key={item.id} className="flex [&>article]:w-full">
                    <DistrictNewsCard news={item} />
                  </li>
                ))}
              </ul>
            )}
            <Pagination
              current={currentPage}
              total={totalPages}
              getHref={href}
              className="mt-10"
            />
          </div>
        </Container>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
