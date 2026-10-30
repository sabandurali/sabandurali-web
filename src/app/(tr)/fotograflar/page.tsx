import { createPhotoListRoute } from "@/components/pages/publication-list-routes";
import type { PhotoListSearchParams } from "@/components/photos/photo-list-params";

// The list reads its filters and page from the query string, so it renders
// per request (no revalidate).
const route = createPhotoListRoute("tr");

export const generateMetadata = route.generateMetadata;

export default function TurkishPhotographyPage(props: {
  searchParams: Promise<PhotoListSearchParams>;
}) {
  return <route.Page {...props} />;
}
