import type { Metadata } from "next";
import AboutPage from "@/components/about/AboutPage";
import { getHomeContent } from "@/content/pages/page-data-source";
import { createPageMetadata } from "@/lib/metadata";

// The introduction comes from the served home content (CMS "Ana sayfa:
// Hakkımda" and hero blocks). Home page edits revalidate every route on
// demand (src/lib/revalidation.ts); this is the safety net for a scheduled
// home page, like the home route's.
export const revalidate = 300;

export const metadata: Metadata = createPageMetadata({
  title: "Hakkımda | Şaban Durali",
  description:
    "Şaban Durali'nin çalışma alanları, platform yaklaşımı ve profesyonel profili.",
  locale: "tr",
  path: "/hakkimda",
});

export default async function AboutRoute() {
  const { content, page } = await getHomeContent("tr");

  return <AboutPage content={content} page={page} />;
}
