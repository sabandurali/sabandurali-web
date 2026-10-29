import type { Metadata } from "next";
import PhotoListPage from "@/components/photos/PhotoListPage";
import {
  parsePhotoListParams,
  type PhotoListSearchParams,
} from "@/components/photos/photo-list-params";
import { loadListContent } from "@/content/list-seo";
import {
  getPublishedPhotos,
  hasPublishedPhotos,
} from "@/content/photos/photo-data-source";
import { createPhotoListMetadata } from "@/content/photos/photo-list-seo";

// The list reads its filters and page from the query string, so it renders
// per request; one database query serves each page (photo-data-source).

const locale = "en" as const;

type PhotoListRouteProps = {
  searchParams: Promise<PhotoListSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: PhotoListRouteProps): Promise<Metadata> {
  const filters = parsePhotoListParams(await searchParams);
  const [list, content] = await Promise.all([
    getPublishedPhotos(locale, filters),
    loadListContent(hasPublishedPhotos),
  ]);

  return createPhotoListMetadata(locale, filters, list, content);
}

export default async function EnglishPhotographyPage({
  searchParams,
}: PhotoListRouteProps) {
  const filters = parsePhotoListParams(await searchParams);
  const result = await getPublishedPhotos(locale, filters);

  return <PhotoListPage locale={locale} filters={filters} result={result} />;
}
