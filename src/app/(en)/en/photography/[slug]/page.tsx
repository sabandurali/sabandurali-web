import { createPhotoDetailRoute } from "@/components/pages/publication-routes";

const route = createPhotoDetailRoute("en");

// Rendered on first visit, then cached and refreshed at most hourly. Every
// photo, photo collection and tag write revalidates all photo detail pages by
// route pattern (src/lib/revalidation.ts), which keeps the related
// photographs current; the hour is the safety net for scheduled publishing.
export const revalidate = 3600;

export const generateStaticParams = route.generateStaticParams;

export const generateMetadata = route.generateMetadata;

export default function EnglishPhotographyDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return <route.Page {...props} />;
}
