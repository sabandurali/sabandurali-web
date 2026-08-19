import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrototypePageView from "@/components/prototype/PrototypePageView";
import {
  findPrototypePage,
  getPrototypeHref,
  prototypePages,
} from "@/content/sitePrototypeContent";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return prototypePages.map((page) => ({ slug: [...page.paths.en] }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  const page = findPrototypePage("en", slug);
  if (!page) return {};

  return {
    title: `${page.title.en} | Site Decision Prototype`,
    description: page.description.en,
    alternates: {
      languages: {
        tr: getPrototypeHref(page, "tr"),
        en: getPrototypeHref(page, "en"),
      },
    },
    robots: { index: false, follow: false },
  };
}

export default async function EnglishPrototypePage({ params }: PageProps) {
  const { slug = [] } = await params;
  const page = findPrototypePage("en", slug);
  if (!page) notFound();

  return <PrototypePageView page={page} locale="en" />;
}
