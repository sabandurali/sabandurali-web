import type { Metadata } from "next";
import PhotoListPage from "@/components/photos/PhotoListPage";
import {
  isIndexablePhotoList,
  parsePhotoListParams,
  type PhotoListSearchParams,
} from "@/components/photos/photo-list-params";
import { getPublishedPhotos } from "@/content/photos/photo-data-source";
import { photoListPaths } from "@/content/photos/photo-routes";
import { createPageMetadata } from "@/lib/metadata";

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

  return createPageMetadata({
    title: "Photography | Şaban Durali",
    description: "Photographs from city, human and animal stories.",
    locale,
    path: photoListPaths[locale],
    translations: photoListPaths,
    index: isIndexablePhotoList(filters),
    follow: true,
  });
}

export default async function EnglishPhotographyPage({
  searchParams,
}: PhotoListRouteProps) {
  const filters = parsePhotoListParams(await searchParams);
  const result = await getPublishedPhotos(locale, filters);

  return <PhotoListPage locale={locale} filters={filters} result={result} />;
}
