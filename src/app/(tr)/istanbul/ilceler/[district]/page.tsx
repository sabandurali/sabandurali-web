import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DistrictEditorialGuidePage from "@/components/districts/DistrictEditorialGuidePage";
import { serializeJsonLd } from "@/content/entity-seo";
import { getDistrictPageData } from "@/content/districts/district-page-data";
import { districts, getDistrict } from "@/content/districts/district-registry";
import {
  districtJsonLd,
  districtMetadata,
} from "@/content/districts/district-seo";

type Props = { params: Promise<{ district: string }> };

// Prerendered per district and refreshed at most hourly. CMS writes
// revalidate the page on demand (src/lib/revalidation.ts); the hourly pass
// also re-applies the content policy's source-freshness rules and picks up
// scheduled publications, which no write announces.
export const revalidate = 3600;

export function generateStaticParams() {
  return districts.map((district) => ({ district: district.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { district: slug } = await params;
  const district = getDistrict(slug);
  if (district === null) {
    return {
      title: "İlçe bulunamadı | Şaban Durali",
      robots: { index: false, follow: false },
    };
  }
  const { guide } = await getDistrictPageData(slug);
  return districtMetadata(district, guide);
}

export default async function DistrictPage({ params }: Props) {
  const { district: slug } = await params;
  const district = getDistrict(slug);
  if (district === null) notFound();
  const data = await getDistrictPageData(slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(districtJsonLd(district, data.guide)),
        }}
      />
      <DistrictEditorialGuidePage district={district} data={data} />
    </>
  );
}
