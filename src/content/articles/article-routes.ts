import type { ArticleLanguage } from "@/content/articles/types";
import { createPublicationRoutes } from "@/content/publication-routes";

export const articleListPaths = {
  tr: "/makaleler",
  en: "/en/articles",
} as const satisfies Record<ArticleLanguage, string>;

const articleRoutes = createPublicationRoutes(articleListPaths);

export const getArticlePath = articleRoutes.getPath;
export const getArticleUrl = articleRoutes.getUrl;
export const getArticleLanguagePaths = articleRoutes.getLanguagePaths;
