import type { Metadata } from "next";
import PhotoListPage from "@/components/photos/PhotoListPage";
import { getPublishedPhotos } from "@/content/photos/photo-data-source";
import { photoListUrls } from "@/content/photos/photo-routes";

export const metadata: Metadata = {
  title: "Photography | Şaban Durali",
  description: "Photographs from city, human and animal stories.",
  alternates: { canonical: photoListUrls.en, languages: photoListUrls },
};

function single(value: string | string[] | undefined) {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export default async function EnglishPhotographyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const pageValue = Number(single(query.page));
  const filters = {
    collection: single(query.collection),
    tag: single(query.tag),
    ...(Number.isInteger(pageValue) && pageValue > 0 ? { page: pageValue } : {}),
  };
  const result = await getPublishedPhotos("en", filters);
  return <PhotoListPage locale="en" filters={filters} result={result} />;
}
