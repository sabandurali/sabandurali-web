import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicPageView from "@/components/pages/PublicPageView";
import {
  getAllPublishedTurkishStandardPages,
  getPublishedTurkishPageBySlug,
} from "@/content/pages/page-data-source";
import { createPublicPageMetadata } from "@/content/pages/page-seo";

type TurkishStandardPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const pages = await getAllPublishedTurkishStandardPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: TurkishStandardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedTurkishPageBySlug(slug);

  if (page === null) {
    return {
      title: "Sayfa bulunamadı | Şaban Durali",
      robots: { index: false, follow: false },
    };
  }

  return createPublicPageMetadata(page);
}

export default async function TurkishStandardPage({
  params,
}: TurkishStandardPageProps) {
  const { slug } = await params;
  const page = await getPublishedTurkishPageBySlug(slug);

  if (page === null) notFound();

  return <PublicPageView page={page} />;
}
