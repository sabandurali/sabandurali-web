import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DistrictNewsListPage from "@/components/districts/DistrictNewsListPage";
import {
  getDistrictNewsPagePath,
  paginateDistrictNews,
  parseNewsPage,
} from "@/components/districts/district-news-pages";
import { getDistrictNews } from "@/content/articles/article-data-source";
import { getDistrict } from "@/content/districts/district-registry";
import { createPageMetadata } from "@/lib/metadata";

// The page reads `?sayfa=`, so it renders per request and needs no
// time-based revalidation.
type Props = {
  params: Promise<{ district: string }>;
  searchParams: Promise<{ sayfa?: string | string[] }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ district: slug }, query] = await Promise.all([params, searchParams]);
  const district = getDistrict(slug);
  if (district === null) {
    return {
      title: "İlçe bulunamadı | Şaban Durali",
      robots: { index: false, follow: false },
    };
  }
  const news = await getDistrictNews(slug, "tr");
  // Each page of the list is its own canonical URL (page 1 has no query).
  const { currentPage } = paginateDistrictNews(
    news,
    parseNewsPage(query.sayfa),
  );
  return createPageMetadata({
    title: `${district.name} Haberleri | Şaban Durali`,
    description: `${district.name} ile ilgili yerel gelişmeler ve kaynakları.`,
    locale: "tr",
    path: getDistrictNewsPagePath(slug, currentPage),
    // An empty list is a placeholder, not a page for search results.
    index: news.length > 0,
    follow: true,
  });
}

export default async function DistrictNewsPage({
  params,
  searchParams,
}: Props) {
  const [{ district: slug }, query] = await Promise.all([params, searchParams]);
  const district = getDistrict(slug);
  if (district === null) notFound();
  const news = await getDistrictNews(slug, "tr");
  return (
    <DistrictNewsListPage
      district={district}
      news={news}
      page={parseNewsPage(query.sayfa)}
    />
  );
}
