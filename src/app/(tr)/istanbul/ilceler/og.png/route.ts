import { getDistrictDirectoryShareCard } from "@/content/districts/district-seo";
import { createOgCard } from "@/lib/og-card";

/*
 * The generated share card of the district directory. It depends on the
 * registry alone, so it is built at build time.
 */
export const dynamic = "force-static";

export function GET() {
  return createOgCard(getDistrictDirectoryShareCard());
}
