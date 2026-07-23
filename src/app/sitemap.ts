import type { MetadataRoute } from "next";
import {
  contactUrls,
  getAbsoluteUrl,
  homeUrls,
  privacyUrls,
} from "@/config/site";
import { getAllPublishedArticles } from "@/content/articles/article-data-source";
import {
  getArticleAlternateUrls,
  getArticleUrl,
  articleListUrls,
} from "@/content/articles/article-routes";
import type {
  PublicArticleSummary,
  PublicArticleTranslation,
} from "@/content/articles/public-types";
import { getAllPublishedBookReviews } from "@/content/books/book-data-source";
import {
  bookListUrls,
  getBookReviewAlternateUrls,
  getBookReviewUrl,
} from "@/content/books/book-routes";
import type { BookReview } from "@/content/books/types";
import {
  getAllPublishedTurkishStandardPages,
  getTurkishHomePageData,
} from "@/content/pages/page-data-source";
import { getPublicPagePath } from "@/content/pages/page-seo";
import type { PublicPage } from "@/content/pages/public-types";

function getLastModified(
  entry: Pick<
    PublicArticleSummary | BookReview | PublicPage,
    "updatedAt" | "publishedAt"
  >,
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
    turkishPages,
    turkishHomePageData,
  ] = await Promise.all([
    getAllPublishedArticles("tr"),
    getAllPublishedArticles("en"),
    getAllPublishedBookReviews("tr"),
    getAllPublishedBookReviews("en"),
    getAllPublishedTurkishStandardPages(),
    getTurkishHomePageData(),
  ]);
  const articles = [...turkishArticles, ...englishArticles];
  const bookReviews = [...turkishBookReviews, ...englishBookReviews];
  const pageEntries: MetadataRoute.Sitemap = turkishPages
    .filter((page) => page.seo.index)
    .map((page) => ({
      url: getAbsoluteUrl(getPublicPagePath(page)),
      lastModified: getLastModified(page),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => {
    const translationArticle =
      article.translationKey === null
        ? null
        : articles.find(
            (candidate) =>
              candidate.language !== article.language &&
              candidate.translationKey === article.translationKey,
          ) ?? null;
    const translation: PublicArticleTranslation | null =
      translationArticle === null
        ? null
        : {
            id: translationArticle.id,
            language: translationArticle.language,
            slug: translationArticle.slug,
            title: translationArticle.title,
          };

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
    ...(turkishHomePageData.source === "static" ||
    turkishHomePageData.page?.seo.index === true
      ? [
          {
            url: homeUrls["tr-TR"],
            lastModified:
              turkishHomePageData.source === "payload" &&
              turkishHomePageData.page !== null
                ? getLastModified(turkishHomePageData.page)
                : lastModified,
            changeFrequency: "weekly" as const,
            priority: 1,
            alternates,
          },
        ]
      : []),
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
    ...pageEntries,
  ];
}
