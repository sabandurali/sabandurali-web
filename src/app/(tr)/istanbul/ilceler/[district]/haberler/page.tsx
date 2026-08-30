import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DistrictNewsListPage from "@/components/districts/DistrictNewsListPage";
import { getDistrict } from "@/content/districts/district-registry";
import { getDistrictNewsPath } from "@/content/districts/district-routes";
import { getAbsoluteUrl } from "@/config/site";
import { getDistrictNews } from "@/content/articles/article-data-source";

type Props = { params: Promise<{ district: string }>; searchParams: Promise<{ sayfa?: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { district: slug } = await params; const district = getDistrict(slug); return district === null ? { title: "İlçe bulunamadı | Şaban Durali", robots: { index: false, follow: false } } : { title: `${district.name} Haberleri | Şaban Durali`, description: `${district.name} ile ilgili yerel gelişmeler ve kaynakları.`, alternates: { canonical: getAbsoluteUrl(getDistrictNewsPath(slug)) } }; }
export default async function DistrictNewsPage({ params, searchParams }: Props) { const [{ district: slug }, query] = await Promise.all([params, searchParams]); const district = getDistrict(slug); if (district === null) notFound(); const requested = Number(query.sayfa); const page = Number.isInteger(requested) && requested > 0 ? requested : 1; const news = await getDistrictNews(slug, "tr"); return <DistrictNewsListPage district={district} news={news} page={page} />; }
