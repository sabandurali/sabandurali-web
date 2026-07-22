import type { Metadata } from "next";
import ArticleListPage from "@/components/articles/ArticleListPage";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import { articleListUrls } from "@/content/articles/article-routes";

export const metadata: Metadata = {
  title: "Makaleler | Şaban Durali",
  description:
    "Gayrimenkul, yapay zekâ, satış, müzakere, kitaplar ve araştırma üzerine makaleler.",
  alternates: {
    canonical: articleListUrls["tr-TR"],
    languages: articleListUrls,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function TurkishArticlesPage() {
  const articles = await getAllPublishedArticles("tr");

  return <ArticleListPage articles={articles} locale="tr" />;
}
