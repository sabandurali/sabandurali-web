import DistrictNewsCard from "@/components/districts/DistrictNewsCard";
import { districtWorkspaceCrumb } from "@/components/districts/district-breadcrumb";
import { homeBreadcrumbItem } from "@/components/ui/Breadcrumb";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import PageIntro from "@/components/ui/PageIntro";
import Pagination from "@/components/ui/Pagination";
import TextLink from "@/components/ui/TextLink";
import PageShell from "@/components/workspaces/PageShell";
import type { PublicArticleSummaryPage } from "@/content/articles/public-types";
import type { District } from "@/content/districts/district-registry";
import {
  districtGuidePath,
  getDistrictPath,
} from "@/content/districts/district-routes";
import { getDistrictNewsPagePath } from "./district-news-pages";

export default function DistrictNewsListPage({
  district,
  news,
}: {
  district: District;
  /** One page of news, paginated in the database (`getDistrictNewsPage`). */
  news: PublicArticleSummaryPage;
}) {
  const { items, currentPage, totalPages } = news;
  const href = (target: number) =>
    getDistrictNewsPagePath(district.slug, target);

  return (
    <PageShell locale="tr" languageHrefs={{ tr: href(currentPage), en: "/en" }}>
      <main id="main" className="bg-paper text-ink scheme-light">
        <PageIntro
          layout="page"
          breadcrumb={[
            homeBreadcrumbItem("tr"),
            districtWorkspaceCrumb,
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
    </PageShell>
  );
}
