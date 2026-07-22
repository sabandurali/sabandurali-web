import type { MetadataRoute } from "next";
import { contactUrls, homeUrls, privacyUrls } from "@/config/site";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import {
  getArticleAlternateUrls,
  getArticleUrl,
  articleListUrls,
} from "@/content/articles/article-routes";
import type { Article } from "@/content/articles/types";
import { getAllPublishedBookReviews } from "@/content/books/book-data-source";
import {
  bookListUrls,
  getBookReviewAlternateUrls,
  getBookReviewUrl,
} from "@/content/books/book-routes";
import type { BookReview } from "@/content/books/types";

function getLastModified(
  entry: Pick<Article | BookReview, "updatedAt" | "publishedAt">,
): Date | undefined {
  for (const value of [entry.updatedAt, entry.publishedAt]) {
    if (value === null) continue;

    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date;
  }

  return undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const alternates = {
    languages: homeUrls,
  };
  const contactAlternates = {
    languages: contactUrls,
  };
  const privacyAlternates = {
    languages: privacyUrls,
  };
  const lastModified = new Date();
  const [
    turkishArticles,
    englishArticles,
    turkishBookReviews,
    englishBookReviews,
  ] = await Promise.all([
    getAllPublishedArticles("tr"),
    getAllPublishedArticles("en"),
    getAllPublishedBookReviews("tr"),
    getAllPublishedBookReviews("en"),
  ]);
  const articles = [...turkishArticles, ...englishArticles];
  const bookReviews = [...turkishBookReviews, ...englishBookReviews];
  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => {
    const translation =
      article.translationGroupId === null
        ? null
        : articles.find(
            (candidate) =>
              candidate.id !== article.id &&
              candidate.language !== article.language &&
              candidate.translationGroupId === article.translationGroupId,
          ) ?? null;

    return {
      url: getArticleUrl(article.slug, article.language),
      lastModified: getLastModified(article),
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: getArticleAlternateUrls(article, translation),
      },
    };
  });
  const bookReviewEntries: MetadataRoute.Sitemap = bookReviews.map(
    (bookReview) => {
      const translation =
        bookReview.translationGroupId === null
          ? null
          : bookReviews.find(
              (candidate) =>
                candidate.id !== bookReview.id &&
                candidate.language !== bookReview.language &&
                candidate.translationGroupId ===
                  bookReview.translationGroupId,
            ) ?? null;

      return {
        url: getBookReviewUrl(bookReview.slug, bookReview.language),
        lastModified: getLastModified(bookReview),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: getBookReviewAlternateUrls(bookReview, translation),
        },
      };
    },
  );

  return [
    {
      url: homeUrls["tr-TR"],
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates,
    },
    {
      url: homeUrls.en,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates,
    },
    {
      url: contactUrls.tr,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: contactAlternates,
    },
    {
      url: contactUrls.en,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: contactAlternates,
    },
    {
      url: privacyUrls.tr,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
      alternates: privacyAlternates,
    },
    {
      url: privacyUrls.en,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
      alternates: privacyAlternates,
    },
    {
      url: articleListUrls["tr-TR"],
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: articleListUrls,
      },
    },
    {
      url: articleListUrls.en,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: articleListUrls,
      },
    },
    ...articleEntries,
    {
      url: bookListUrls["tr-TR"],
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: bookListUrls,
      },
    },
    {
      url: bookListUrls.en,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: bookListUrls,
      },
    },
    ...bookReviewEntries,
  ];
}
