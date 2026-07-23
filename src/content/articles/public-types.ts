import type { Article } from "@/content/articles/types";
import type { Article as PayloadArticle } from "@/payload-types";

export type PublicArticleCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type PublicArticleImage = {
  source: "static" | "payload";
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type PublicArticleSeo = {
  title: string;
  description: string;
  canonical?: string;
  index: boolean;
  follow: boolean;
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphImage?: string;
};

export type PublicArticleSummary = {
  id: string;
  title: string;
  slug: string;
  language: Article["language"];
  translationKey: string | null;
  summary: string;
  categories: ReadonlyArray<PublicArticleCategory>;
  featuredImage: PublicArticleImage | null;
  featured: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  seo: PublicArticleSeo;
};

export type PublicArticleTranslation = Pick<
  PublicArticleSummary,
  "id" | "language" | "slug" | "title"
>;

export type PublicArticleContent =
  | {
      source: "static";
      blocks: Article["content"];
      details: Pick<
        Article,
        "author" | "faq" | "legalNotice" | "sources"
      >;
    }
  | {
      source: "lexical";
      data: PayloadArticle["content"];
    };

export type PublicArticle = PublicArticleSummary & {
  content: PublicArticleContent;
};
