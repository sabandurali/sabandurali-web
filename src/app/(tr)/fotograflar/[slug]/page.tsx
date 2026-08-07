import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PhotoDetailPage from "@/components/photos/PhotoDetailPage";
import {
  getAllPublishedPhotos,
  getPublishedPhotoPageData,
  getRelatedPublishedPhotos,
} from "@/content/photos/photo-data-source";
import { createPhotoMetadata } from "@/content/photos/photo-seo";

export async function generateStaticParams() {
  const photos = await getAllPublishedPhotos("tr");
  return photos.map((photo) => ({ slug: photo.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { photo, translation } = await getPublishedPhotoPageData(slug, "tr");
  return photo === null
    ? { title: "Fotoğraf bulunamadı | Şaban Durali", robots: { index: false, follow: false } }
    : createPhotoMetadata(photo, translation);
}

export default async function TurkishPhotographyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { photo, translation } = await getPublishedPhotoPageData(slug, "tr");
  if (photo === null) notFound();
  const related = await getRelatedPublishedPhotos(photo);
  return <PhotoDetailPage photo={photo} translation={translation} related={related} />;
}
