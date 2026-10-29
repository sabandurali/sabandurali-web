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

export function getArticlePath(
  slug: string,
  language: ArticleLanguage,
): string {
  return `${articleListPaths[language]}/${slug}`;
}

export function getArticleUrl(slug: string, language: ArticleLanguage): string {
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
