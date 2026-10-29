import BackToTop from "@/components/layout/BackToTop";
import DistrictNewsCard from "@/components/districts/DistrictNewsCard";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import TextLink from "@/components/ui/TextLink";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { District } from "@/content/districts/district-registry";
import {
  districtGuidePath,
  getDistrictPath,
} from "@/content/districts/district-routes";
import { homeContent } from "@/content/homeContent";
import {
  getDistrictNewsPagePath,
  paginateDistrictNews,
} from "./district-news-pages";

export default function DistrictNewsListPage({
  district,
  news,
  page,
}: {
  district: District;
  news: PublicArticleSummary[];
  page: number;
}) {
  const home = homeContent.tr;
  const { items, currentPage, totalPages } = paginateDistrictNews(news, page);
  const href = (target: number) =>
    getDistrictNewsPagePath(district.slug, target);

  return (
    <div id="top" lang="tr">
      <Header
        locale="tr"
        anchors={home.anchors}
        content={home.header}
        homeHref="/"
        anchorPrefix="/"
        languageHrefs={{ tr: href(currentPage), en: "/en" }}
      />
      <main id="main" className="bg-paper text-ink scheme-light">
        <Container className="pt-6 pb-section">
          <Breadcrumb
            items={[
              { label: "Ana Sayfa", href: "/" },
              { label: "İstanbul", href: "/gayrimenkul-ve-istanbul" },
              { label: "İlçeler", href: districtGuidePath },
              { label: district.name, href: getDistrictPath(district.slug) },
              { label: "Haberler" },
            ]}
          />
          <header className="mt-8 border-b-2 border-ink pb-8">
            <p className="m-0 type-region">İLÇEDEN HABERLER</p>
            <h1 className="mt-3 mb-0 break-words type-display">
              {district.name} haberleri
            </h1>
            <p className="mt-4 mb-0 max-w-measure type-lead">
              Başlık, özgün kısa özet, tarih ve kaynak bağlantısıyla yerel
              gelişmeler.
            </p>
          </header>
          {items.length === 0 ? (
            <EmptyState
              className="mt-8"
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
            <ul className="m-0 mt-8 grid list-none gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
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
        </Container>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
