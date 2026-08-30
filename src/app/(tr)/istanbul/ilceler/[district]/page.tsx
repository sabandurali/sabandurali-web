import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DistrictGuidePage from "@/components/districts/DistrictGuidePage";
import { getDistrictGuide } from "@/content/districts/district-guide-data-source";
import { districts, getDistrict } from "@/content/districts/district-registry";
import { districtGuidePath, getDistrictUrl } from "@/content/districts/district-routes";
import { getAbsoluteUrl } from "@/config/site";
import { getDistrictNews, getDistrictResearch } from "@/content/articles/article-data-source";
import { getDistrictPhotos } from "@/content/photos/photo-data-source";
import { serializeJsonLd } from "@/content/entity-seo";

type Props = { params: Promise<{ district: string }> };
export function generateStaticParams() { return districts.map((district) => ({ district: district.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { district: slug } = await params; const district = getDistrict(slug); if (district === null) return { title: "İlçe bulunamadı | Şaban Durali", robots: { index: false, follow: false } }; return { title: `${district.name} İlçe Rehberi | Şaban Durali`, description: `${district.name} için kaynak temelli ilçe rehberi.`, alternates: { canonical: getDistrictUrl(slug) } }; }
export default async function DistrictPage({ params }: Props) { const { district: slug } = await params; const district = getDistrict(slug); if (district === null) notFound(); const [guide, photos, research, news] = await Promise.all([getDistrictGuide(slug), getDistrictPhotos(slug, "tr"), getDistrictResearch(slug, "tr"), getDistrictNews(slug, "tr")]); const jsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "İstanbul İlçe Rehberi", item: getAbsoluteUrl(districtGuidePath) }, { "@type": "ListItem", position: 2, name: district.name, item: getDistrictUrl(slug) }] }; return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} /><DistrictGuidePage district={district} guide={guide} photos={photos} research={research} news={news} /></>; }
