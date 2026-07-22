import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDetailPage from "@/components/articles/ArticleDetailPage";
import {
  getAllPublishedArticles,
  getPublishedArticlePageData,
} from "@/content/articles/article-data-source";
import { createArticleMetadata } from "@/content/articles/article-seo";

type EnglishArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articles = await getAllPublishedArticles("en");
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: EnglishArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { article, translation } = await getPublishedArticlePageData(slug, "en");

  if (article === null) {
    return {
      title: "Article not found | Şaban Durali",
      robots: { index: false, follow: false },
    };
  }

  return createArticleMetadata(article, translation);
}

export default async function EnglishArticlePage({
  params,
}: EnglishArticlePageProps) {
  const { slug } = await params;
  const { article, translation } = await getPublishedArticlePageData(slug, "en");

  if (article === null) {
    notFound();
  }

  return <ArticleDetailPage article={article} translation={translation} />;
}
