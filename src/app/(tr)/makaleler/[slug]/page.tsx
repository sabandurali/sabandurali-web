import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDetailPage from "@/components/articles/ArticleDetailPage";
import {
  getAllPublishedArticles,
  getPublishedArticlePageData,
} from "@/content/articles/article-data-source";
import { createArticleMetadata } from "@/content/articles/article-seo";

type TurkishArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articles = await getAllPublishedArticles("tr");
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: TurkishArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { article, translation } = await getPublishedArticlePageData(slug, "tr");

  if (article === null) {
    return {
      title: "Makale bulunamadı | Şaban Durali",
      robots: { index: false, follow: false },
    };
  }

  return createArticleMetadata(article, translation);
}

export default async function TurkishArticlePage({
  params,
}: TurkishArticlePageProps) {
  const { slug } = await params;
  const { article, translation } = await getPublishedArticlePageData(slug, "tr");

  if (article === null) {
    notFound();
  }

  return <ArticleDetailPage article={article} translation={translation} />;
}
