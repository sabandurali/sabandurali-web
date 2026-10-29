import { createBookReviewDetailRoute } from "@/components/pages/publication-routes";

const route = createBookReviewDetailRoute("tr");

// Prerendered and refreshed at most hourly; CMS writes revalidate this path
// on demand (src/lib/revalidation.ts), the hour is the time-based safety net
// for scheduled publishing, which no write announces.
export const revalidate = 3600;

export const generateStaticParams = route.generateStaticParams;

export const generateMetadata = route.generateMetadata;

export default function TurkishBookReviewPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return <route.Page {...props} />;
}
