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

const locale = "tr" as const;

type PhotoListRouteProps = {
  searchParams: Promise<PhotoListSearchParams>;
};

export async function generateMetadata({
  searchParams,
}: PhotoListRouteProps): Promise<Metadata> {
  const filters = parsePhotoListParams(await searchParams);

  return createPageMetadata({
    title: "Fotoğraflar | Şaban Durali",
    description: "Şehir, insan ve hayvan hikâyelerinden fotoğraflar.",
    locale,
    path: photoListPaths[locale],
    translations: photoListPaths,
    index: isIndexablePhotoList(filters),
    follow: true,
  });
}

export default async function TurkishPhotographyPage({
  searchParams,
}: PhotoListRouteProps) {
  const filters = parsePhotoListParams(await searchParams);
  const result = await getPublishedPhotos(locale, filters);

  return <PhotoListPage locale={locale} filters={filters} result={result} />;
}
