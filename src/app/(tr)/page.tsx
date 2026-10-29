import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { createHomeMetadata } from "@/components/sections/home-metadata";
import { getHomeContent } from "@/content/pages/page-data-source";

// Safety net for scheduled CMS content (no write announces it); edits
// revalidate on demand through src/lib/revalidation.ts.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  // A missing or incomplete CMS home page falls back to the static content.
  const { page } = await getHomeContent("tr");

  return createHomeMetadata("tr", page);
}

export default async function Home() {
  const { content, page } = await getHomeContent("tr");

  return <HomePage content={content} page={page} />;
}
