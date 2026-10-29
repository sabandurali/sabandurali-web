import type { SiteLocale } from "@/content/locales";
import type { PublicRichText } from "@/content/rich-text/public-rich-text";
import type { FocusAreaIcon } from "@/content/homeContent";

export type PublicPageLanguage = SiteLocale;
export type PublicPageType = "home" | "standard";
export type { PublicRichText };

export type PublicPageLink = {
  label: string;
  href: string;
};

export type PublicPageImage = {
  src: string;
  alt: string;
  /** Set only when `alt` is not in the page's language (Turkish media alt on
   * an English page); render the image with this `lang`. */
  altLanguage?: PublicPageLanguage;
  width?: number;
  height?: number;
  caption?: string;
  /** Source / copyright line that must be shown with the image. */
  credit?: string;
};

type PublicPageBlockBase = {
  id: string;
  visible: boolean;
  anchor: string | null;
};

export type PublicHeroBlock = PublicPageBlockBase & {
  blockType: "hero";
  eyebrow: string | null;
  titleLines: Array<{
    text: string;
    accent: boolean;
  }>;
  description: string;
  primaryAction: PublicPageLink;
  secondaryAction: PublicPageLink;
  highlights: Array<{
    value: string;
    label: string;
  }>;
};

export type PublicRichTextBlock = PublicPageBlockBase & {
  blockType: "richText";
  eyebrow: string | null;
  title: string | null;
  content: PublicRichText;
};

export type PublicCardGroupBlock = PublicPageBlockBase & {
  blockType: "cardGroup";
  eyebrow: string | null;
  title: string;
  cards: Array<{
    id: string;
    icon: FocusAreaIcon;
    image: PublicPageImage | null;
    title: string;
    description: string;
    link: PublicPageLink | null;
  }>;
};

export type PublicImageTextBlock = PublicPageBlockBase & {
  blockType: "imageText";
  eyebrow: string | null;
  title: string;
  content: PublicRichText;
  image: PublicPageImage;
  imagePosition: "left" | "right";
};

export type PublicHomeAboutBlock = PublicPageBlockBase & {
  blockType: "homeAbout";
  eyebrow: string;
  titleLines: string[];
  paragraphs: string[];
  link: PublicPageLink | null;
  image: PublicPageImage | null;
  imageAlt: string;
};

export type PublicHomeFocusAreasBlock = PublicPageBlockBase & {
  blockType: "homeFocusAreas";
  eyebrow: string;
  title: string;
  description: string | null;
  cards: Array<{
    id: string;
    icon: FocusAreaIcon;
    title: string;
    description: string;
    linkLabel: string;
    linkHref: string | null;
  }>;
};

export type PublicCtaBlock = PublicPageBlockBase & {
  blockType: "cta";
  title: string;
  description: string | null;
  action: PublicPageLink;
};

export type PublicPageBlock =
  | PublicHeroBlock
  | PublicRichTextBlock
  | PublicCardGroupBlock
  | PublicImageTextBlock
  | PublicHomeAboutBlock
  | PublicHomeFocusAreasBlock
  | PublicCtaBlock;

export type PublicPage = {
  id: string;
  title: string;
  slug: string;
  language: PublicPageLanguage;
  pageType: PublicPageType;
  summary: string;
  layout: PublicPageBlock[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  seo: {
    title: string;
    description: string;
    index: boolean;
    follow: boolean;
    socialImage: PublicPageImage | null;
  };
};
