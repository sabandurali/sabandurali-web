import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { createHomeMetadata } from "@/components/sections/home-metadata";
import { getHomeContent } from "@/content/pages/page-data-source";

// Safety net for scheduled CMS content (no write announces it); edits
// revalidate on demand through src/lib/revalidation.ts.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  // A missing or incomplete CMS home page falls back to the static content.
  // The other locale's served home decides the hreflang pair (SEO-PERF-4).
  const [{ page }, { page: otherPage }] = await Promise.all([
    getHomeContent("tr"),
    getHomeContent("en"),
  ]);

  return createHomeMetadata("tr", page, otherPage);
}

export default async function Home() {
  const { content, page } = await getHomeContent("tr");

  return <HomePage content={content} page={page} />;
}
