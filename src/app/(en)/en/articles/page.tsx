import type { Metadata } from "next";
import ArticleListPage from "@/components/articles/ArticleListPage";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { articleListPaths } from "@/content/articles/article-routes";
import { createPageMetadata } from "@/lib/metadata";

const locale = "en" as const;

// Prerendered and refreshed at most hourly; CMS writes revalidate this path
// on demand (src/lib/revalidation.ts), the hour is the time-based safety net
// for scheduled publishing, which no write announces.
export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "Articles | Şaban Durali",
  description:
    "Articles on real estate, artificial intelligence, sales, negotiation, books and research.",
  locale,
  path: articleListPaths[locale],
  translations: articleListPaths,
});

export default async function EnglishArticlesPage() {
  const articles = await getAllPublishedArticles(locale);

  return <ArticleListPage articles={articles} locale={locale} />;
}
