import type {
  Article,
  ArticleCategory,
  ArticleContentBlock,
  ArticleLanguage,
  ArticleStatus,
  ArticleVisibility,
} from "@/content/articles/types";

export type ArticleFormState = {
  title: string;
  slug: string;
  language: ArticleLanguage;
  summary: string;
  category: ArticleCategory | "";
  authorName: string;
  coverImageSrc: string;
  coverImageAlt: string;
  heading: string;
  paragraph: string;
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  status: ArticleStatus;
  visibility: ArticleVisibility;
};

export const INITIAL_ARTICLE_FORM_STATE: ArticleFormState = {
  title: "",
  slug: "",
  language: "tr",
  summary: "",
  category: "",
  authorName: "Şaban Durali",
  coverImageSrc: "",
  coverImageAlt: "",
  heading: "",
  paragraph: "",
  seoTitle: "",
  seoDescription: "",
  canonical: "",
  status: "draft",
  visibility: "private",
};

type ArticleMapperOptions = {
  createId?: () => string;
  now?: Date;
};

export function mapArticleFormStateToArticle(
  state: ArticleFormState,
  options: ArticleMapperOptions = {},
): Article {
  const createId = options.createId ?? (() => crypto.randomUUID());
  const now = options.now ?? new Date();
  const timestamp = now.toISOString();
  const prototypeId = createId();
  const content: ArticleContentBlock[] = [];
  const heading = state.heading.trim();
  const paragraph = state.paragraph.trim();
  const coverImageSrc = state.coverImageSrc.trim();
  const authorName = state.authorName.trim();
  const canonical = state.canonical.trim();

  if (heading !== "") {
    content.push({
      id: `prototype-heading-${prototypeId}`,
      type: "heading",
      level: "h2",
      text: heading,
    });
  }

  if (paragraph !== "") {
    content.push({
      id: `prototype-paragraph-${prototypeId}`,
      type: "paragraph",
      text: paragraph,
    });
  }

  return {
    id: `prototype-article-${prototypeId}`,
    title: state.title.trim(),
    slug: state.slug.trim(),
    language: state.language,
    translationGroupId: null,
    translationStatus: "none",
    summary: state.summary.trim(),
    content,
    coverImage:
      coverImageSrc === ""
        ? null
        : {
            src: coverImageSrc,
            alt: state.coverImageAlt.trim(),
            width: 1600,
            height: 900,
          },
    category: state.category === "" ? null : state.category,
    tags: [],
    author:
      authorName === ""
        ? null
        : {
            id: `prototype-author-${prototypeId}`,
            name: authorName,
            role: "Yazar",
          },
    editor: null,
    reviewer: null,
    status: state.status,
    visibility: state.visibility,
    publishedAt: state.status === "published" ? timestamp : null,
    scheduledAt: state.status === "scheduled" ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastVerifiedAt: null,
    nextReviewAt: null,
    freshnessStatus: "not_reviewed",
    featured: false,
    showOnHomepage: false,
    seo: {
      title: state.seoTitle.trim(),
      description: state.seoDescription.trim(),
      ...(canonical === "" ? {} : { canonical }),
      index: false,
      follow: false,
    },
    sources: [],
    faq: [],
    relatedArticles: [],
    legalNotice: null,
    versionHistory: [],
  };
}
