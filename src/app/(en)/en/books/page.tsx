import { createBookReviewListRoute } from "@/components/pages/publication-list-routes";

const route = createBookReviewListRoute("en");

// Prerendered and refreshed at most hourly; CMS writes revalidate this path
// on demand (src/lib/revalidation.ts), the hour is the time-based safety net
// for scheduled publishing, which no write announces.
export const revalidate = 3600;

export const generateMetadata = route.generateMetadata;

export default function EnglishBooksPage() {
  return <route.Page />;
}
