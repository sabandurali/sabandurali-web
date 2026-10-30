import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DistrictNewsListPage from "@/components/districts/DistrictNewsListPage";
import {
  createDistrictNewsMetadata,
  districtNewsPageSize,
  parseNewsPage,
} from "@/components/districts/district-news-pages";
import { getDistrictNewsPage } from "@/content/articles/article-data-source";
import { getDistrict } from "@/content/districts/district-registry";

// The page reads `?sayfa=`, so it renders per request and needs no
// time-based revalidation. Each request reads one page of news and the
// totals from the database (getDistrictNewsPage), never the whole history;
// the metadata and the page share that read (React cache).
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
  const news = await getDistrictNewsPage(
    slug,
    parseNewsPage(query.sayfa),
    districtNewsPageSize,
  );
  return createDistrictNewsMetadata(district, news);
}

export default async function DistrictNewsPage({
  params,
  searchParams,
}: Props) {
  const [{ district: slug }, query] = await Promise.all([params, searchParams]);
  const district = getDistrict(slug);
  if (district === null) notFound();
  const news = await getDistrictNewsPage(
    slug,
    parseNewsPage(query.sayfa),
    districtNewsPageSize,
  );
  return <DistrictNewsListPage district={district} news={news} />;
}
