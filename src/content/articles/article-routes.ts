import { getAbsoluteUrl } from "@/config/site";
import type {
  PublicArticleSummary,
  PublicArticleTranslation,
} from "@/content/articles/public-types";
import type { ArticleLanguage } from "@/content/articles/types";

type RoutableArticle = Pick<
  PublicArticleSummary | PublicArticleTranslation,
  "language" | "slug"
>;

export const articleListPaths = {
  tr: "/makaleler",
  en: "/en/articles",
} as const satisfies Record<ArticleLanguage, string>;

export const articleListUrls = {
  "tr-TR": getAbsoluteUrl(articleListPaths.tr),
  en: getAbsoluteUrl(articleListPaths.en),
  "x-default": getAbsoluteUrl(articleListPaths.tr),
} as const;

export function getArticlePath(
  slug: string,
  language: ArticleLanguage,
): string {
  return `${articleListPaths[language]}/${slug}`;
}

export function getArticleUrl(
  slug: string,
  language: ArticleLanguage,
): string {
  return getAbsoluteUrl(getArticlePath(slug, language));
}

export function getArticleLanguagePaths(
  article: RoutableArticle,
  translation: PublicArticleTranslation | null,
): Record<ArticleLanguage, string> {
  const paths: Record<ArticleLanguage, string> = {
    tr: articleListPaths.tr,
    en: articleListPaths.en,
  };

  paths[article.language] = getArticlePath(article.slug, article.language);

  if (translation !== null) {
    paths[translation.language] = getArticlePath(
      translation.slug,
      translation.language,
    );
  }

  return paths;
}

export function getArticleAlternateUrls(
  article: RoutableArticle,
  translation: PublicArticleTranslation | null,
): Record<string, string> {
  const currentUrl = getArticleUrl(article.slug, article.language);
  const urls: Record<string, string> = {
    [article.language === "tr" ? "tr-TR" : "en"]: currentUrl,
  };

  if (translation !== null) {
    urls[translation.language === "tr" ? "tr-TR" : "en"] = getArticleUrl(
      translation.slug,
      translation.language,
    );
  }

  urls["x-default"] = urls["tr-TR"] ?? currentUrl;

  return urls;
}
