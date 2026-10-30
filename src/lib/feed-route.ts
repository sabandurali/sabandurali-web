import "server-only";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { getAllPublishedBookReviews } from "@/content/books/book-data-source";
import { refuseDegradedCachedRender } from "@/content/degraded-render";
import type { SiteLocale } from "@/content/locales";
import { getAllPublishedPhotos } from "@/content/photos/photo-data-source";
import { buildAtomFeed, collectFeedEntries, feedContentType } from "@/lib/feed";
import {
  createSitemapFailureCollector,
  loadSitemapSource,
} from "@/lib/sitemap-entries";

/**
 * The response of `locale`'s feed route. Each source settles on its own,
 * like the sitemap: a failing source is logged and left out, and on a
 * production server an incomplete feed is not cached over the last
 * complete one (`refuseDegradedCachedRender`).
 */
export async function createFeedResponse(
  locale: SiteLocale,
  now: Date = new Date(),
): Promise<Response> {
  const failures = createSitemapFailureCollector();
  const [articles, bookReviews, photos] = await Promise.all([
    loadSitemapSource(
      `${locale} articles (feed)`,
      () => getAllPublishedArticles(locale),
      [],
      failures.report,
    ),
    loadSitemapSource(
      `${locale} book reviews (feed)`,
      () => getAllPublishedBookReviews(locale),
      [],
      failures.report,
    ),
    loadSitemapSource(
      `${locale} photos (feed)`,
      () => getAllPublishedPhotos(locale),
      [],
      failures.report,
    ),
  ]);

  refuseDegradedCachedRender(`feed ${locale}`, failures.failed);

  const entries = collectFeedEntries(locale, { articles, bookReviews, photos });
  return new Response(buildAtomFeed(locale, entries, now), {
    headers: { "Content-Type": feedContentType },
  });
}
