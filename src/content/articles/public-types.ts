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
  /** Set only when `alt` is not in the article's language (Turkish media alt
   * on an English page); render the image with this `lang`. */
  altLanguage?: Article["language"];
  caption?: string;
  /** Source / copyright line that must be shown with the image. */
  credit?: string;
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

export type DistrictArticleType =
  "article" | "district-research" | "district-news";

export type PublicArticleExternalSource = {
  name: string;
  url: string;
  checkedAt: string | null;
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
  articleType: DistrictArticleType;
  district: string | null;
  districtNeighborhood: string | null;
  newsCategory: string | null;
  externalSource: PublicArticleExternalSource | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  /** A CMS article's guest author; absent when Şaban Durali wrote it. */
  author?: string;
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
      details: Pick<Article, "author" | "faq" | "legalNotice" | "sources">;
    }
  | {
      source: "lexical";
      data: PayloadArticle["content"] | null;
    };

export type PublicArticle = PublicArticleSummary & {
  content: PublicArticleContent;
};
