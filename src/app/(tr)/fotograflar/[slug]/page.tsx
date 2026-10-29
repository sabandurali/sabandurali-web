import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PhotoDetailPage from "@/components/photos/PhotoDetailPage";
import {
  getPublishedPhotoPageData,
  getRelatedPublishedPhotos,
} from "@/content/photos/photo-data-source";
import { createPhotoMetadata } from "@/content/photos/photo-seo";

// Rendered on first visit, then cached and refreshed at most hourly. Every
// photo, photo collection and tag write revalidates all photo detail pages by
// route pattern (src/lib/revalidation.ts), which keeps the related
// photographs current; the hour is the safety net for scheduled publishing.
export const revalidate = 3600;

// No photo is prerendered at build time: pages are generated on demand.
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { photo, translation } = await getPublishedPhotoPageData(slug, "tr");
  return photo === null
    ? {
        title: "Fotoğraf bulunamadı | Şaban Durali",
        robots: { index: false, follow: false },
      }
    : createPhotoMetadata(photo, translation);
}

export default async function TurkishPhotographyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { photo, translation } = await getPublishedPhotoPageData(slug, "tr");
  if (photo === null) notFound();
  const related = await getRelatedPublishedPhotos(photo);
  return (
    <PhotoDetailPage
      photo={photo}
      translation={translation}
      related={related}
    />
  );
}
