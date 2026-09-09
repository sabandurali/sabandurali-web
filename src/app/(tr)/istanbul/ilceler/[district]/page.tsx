import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DistrictGuidePage from "@/components/districts/DistrictGuidePage";
import { getDistrictGuide } from "@/content/districts/district-guide-data-source";
import { districts, getDistrict } from "@/content/districts/district-registry";
import {
  districtMetadata,
  districtJsonLd,
} from "@/content/districts/district-seo";
import {
  getDistrictNews,
  getDistrictResearch,
} from "@/content/articles/article-data-source";
import { getDistrictPhotos } from "@/content/photos/photo-data-source";
import { serializeJsonLd } from "@/content/entity-seo";
type Props = { params: Promise<{ district: string }> };
// Re-evaluate source expiry and CMS publication state on every request.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return districts.map((district) => ({ district: district.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district: slug } = await params;
  const district = getDistrict(slug);
  if (district === null)
    return {
      title: "İlçe bulunamadı | Şaban Durali",
      robots: { index: false, follow: false },
    };
  return districtMetadata(district, await getDistrictGuide(slug));
}
export default async function DistrictPage({ params }: Props) {
  const { district: slug } = await params;
  const district = getDistrict(slug);
  if (district === null) notFound();
  const [guide, photos, research, news] = await Promise.all([
    getDistrictGuide(slug),
    getDistrictPhotos(slug, "tr"),
    getDistrictResearch(slug, "tr"),
    getDistrictNews(slug, "tr"),
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(districtJsonLd(district, guide)),
        }}
      />
      <DistrictGuidePage
        district={district}
        guide={guide}
        photos={photos}
        research={research}
        news={news}
      />
    </>
  );
}
