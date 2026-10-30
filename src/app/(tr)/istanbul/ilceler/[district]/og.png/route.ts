import { districts, getDistrict } from "@/content/districts/district-registry";
import { getDistrictShareCard } from "@/content/districts/district-seo";
import { createOgCard } from "@/lib/og-card";

/*
 * The generated share card of a district page: the district's name and side
 * on the "İstanbul Atlası" colours. The page's metadata names it only when
 * the district has no photograph to share (districtSocialImage). The 39
 * cards depend on the registry alone, so they are built at build time.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return districts.map((district) => ({ district: district.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ district: string }> },
) {
  const { district: slug } = await params;
  const district = getDistrict(slug);
  if (district === null) return new Response("Not found", { status: 404 });
  return createOgCard(getDistrictShareCard(district));
}
