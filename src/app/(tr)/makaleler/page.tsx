import type { Metadata } from "next";
import ArticleListPage from "@/components/articles/ArticleListPage";
import {
  getAllPublishedArticles,
  hasPublishedArticles,
} from "@/content/articles/article-data-source";
import { articleListPaths } from "@/content/articles/article-routes";
import { loadListContent, createListPageMetadata } from "@/content/list-seo";

const locale = "tr" as const;

// Prerendered and refreshed at most hourly; CMS writes revalidate this path
// on demand (src/lib/revalidation.ts), the hour is the time-based safety net
// for scheduled publishing, which no write announces.
export const revalidate = 3600;

// An empty list is noindex and outside the hreflang cluster, like the
// sitemap, which leaves it out (src/content/list-seo.ts).
export async function generateMetadata(): Promise<Metadata> {
  return createListPageMetadata({
    title: "Makaleler | Şaban Durali",
    description:
      "Gayrimenkul, yapay zekâ, satış, müzakere, kitaplar ve araştırma üzerine makaleler.",
    locale,
    paths: articleListPaths,
    content: await loadListContent(hasPublishedArticles),
  });
}

export default async function TurkishArticlesPage() {
  const articles = await getAllPublishedArticles(locale);

  return <ArticleListPage articles={articles} locale={locale} />;
}
