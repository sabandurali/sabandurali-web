import type { MetadataRoute } from "next";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { getAllPublishedBookReviews } from "@/content/books/book-data-source";
import { getDistrictGuide } from "@/content/districts/district-guide-data-source";
import { districts } from "@/content/districts/district-registry";
import {
  getAllPublishedTurkishStandardPages,
  getEnglishHomePageData,
  getTurkishHomePageData,
} from "@/content/pages/page-data-source";
import { getAllPublishedPhotos } from "@/content/photos/photo-data-source";
import {
  buildSitemap,
  loadSitemapSource,
  loadSitemapSourcesByKey,
} from "@/lib/sitemap-entries";

// Regenerated at most hourly (and on demand when CMS content changes), so
// scheduled publications appear without a request-time scan per crawl.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Each source settles on its own: a failing source is logged and left out
  // instead of turning the whole sitemap into an error.
  const [
    turkishArticles,
    englishArticles,
    turkishBookReviews,
    englishBookReviews,
    turkishPhotos,
    englishPhotos,
    standardPages,
    turkishHome,
    englishHome,
    districtGuides,
  ] = await Promise.all([
    loadSitemapSource(
      "Turkish articles",
      () => getAllPublishedArticles("tr"),
      [],
    ),
    loadSitemapSource(
      "English articles",
      () => getAllPublishedArticles("en"),
      [],
    ),
    loadSitemapSource(
      "Turkish book reviews",
      () => getAllPublishedBookReviews("tr"),
      [],
    ),
    loadSitemapSource(
      "English book reviews",
      () => getAllPublishedBookReviews("en"),
      [],
    ),
    loadSitemapSource("Turkish photos", () => getAllPublishedPhotos("tr"), []),
    loadSitemapSource("English photos", () => getAllPublishedPhotos("en"), []),
    loadSitemapSource(
      "Turkish pages",
      () => getAllPublishedTurkishStandardPages(),
      [],
    ),
    loadSitemapSource(
      "Turkish home page",
      () => getTurkishHomePageData(),
      null,
    ),
    loadSitemapSource(
      "English home page",
      () => getEnglishHomePageData(),
      null,
    ),
    loadSitemapSourcesByKey(
      "district guides",
      districts.map((district) => district.slug),
      (slug) => getDistrictGuide(slug),
    ),
  ]);

  return buildSitemap({
    articles: [...turkishArticles, ...englishArticles],
    bookReviews: [...turkishBookReviews, ...englishBookReviews],
    photos: [...turkishPhotos, ...englishPhotos],
    standardPages,
    homePages: { tr: turkishHome, en: englishHome },
    districtGuides,
  });
}
