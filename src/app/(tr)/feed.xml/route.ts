import { createFeedResponse } from "@/lib/feed-route";

// The Turkish Atom feed. Regenerated at most hourly and on demand when CMS
// content changes (src/lib/revalidation.ts), like the sitemap.
export const revalidate = 3600;

export function GET(): Promise<Response> {
  return createFeedResponse("tr");
}
