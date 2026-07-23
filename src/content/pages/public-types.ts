import type { ComponentProps } from "react";
import type { RichText } from "@payloadcms/richtext-lexical/react";
import type { FocusAreaIcon } from "@/content/homeContent";

export type PublicPageLanguage = "tr" | "en";
export type PublicPageType = "home" | "standard";
export type PublicRichText = ComponentProps<typeof RichText>["data"];

export type PublicPageLink = {
  label: string;
  href: string;
};

export type PublicPageImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
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
