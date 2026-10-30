import type { Metadata } from "next";
import {
  createSearchRoute,
  type SearchRouteProps,
} from "@/components/search/search-route";

// The search reads its query from the query string, so it renders per
// request (no revalidate). It is noindex.
const route = createSearchRoute("en");

export const metadata: Metadata = route.metadata;

export default function EnglishSearchPage(props: SearchRouteProps) {
  return <route.Page {...props} />;
}
