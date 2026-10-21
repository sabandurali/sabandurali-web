import type { Metadata } from "next";
import ArticleListPage from "@/components/articles/ArticleListPage";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { articleListUrls } from "@/content/articles/article-routes";

const locale = "en" as const;

export const metadata: Metadata = {
  title: "Articles | Şaban Durali",
  description:
    "Articles on real estate, artificial intelligence, sales, negotiation, books and research.",
  alternates: {
    canonical: articleListUrls.en,
    languages: articleListUrls,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function EnglishArticlesPage() {
  const articles = await getAllPublishedArticles(locale);

  return <ArticleListPage articles={articles} locale={locale} />;
}
