import { reportContentIssue } from "@/content/content-log";
import { getText, isPublishedBy, isRecord } from "@/content/guards";
import { mapMediaImage } from "@/content/media";
import { prepareRichText } from "@/content/rich-text/prepare-rich-text";
import type {
  PublicCardGroupBlock,
  PublicCtaBlock,
  PublicHeroBlock,
  PublicHomeAboutBlock,
  PublicHomeFocusAreasBlock,
  PublicImageTextBlock,
  PublicPage,
  PublicPageBlock,
  PublicPageImage,
  PublicPageLink,
  PublicPageLanguage,
  PublicRichTextBlock,
} from "@/content/pages/public-types";
import type { Page as PayloadPage } from "@/payload-types";

function getSafeHref(value: unknown): string | null {
  const href = getText(value);

  if (href === null) return null;

  if (/^#[a-z][a-z0-9-]*$/.test(href)) {
    return href;
  }

  if (href.startsWith("/") && !href.startsWith("//")) {
    return href;
  }

  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function mapLink(value: unknown): PublicPageLink | null {
  if (!isRecord(value)) return null;

  const label = getText(value.label);
  const href = getSafeHref(value.href);

  return label === null || href === null ? null : { label, href };
}

function mapOptionalLink(value: unknown): PublicPageLink | null | undefined {
  if (!isRecord(value)) return undefined;

  const label = getText(value.label);
  const href = getText(value.href);

  if (label === null && href === null) return undefined;
  if (label === null || href === null) return null;

  const safeHref = getSafeHref(href);
  return safeHref === null ? null : { label, href: safeHref };
}

function mapImage(
  value: unknown,
  altValue: unknown,
  fallbackAlt: string,
  language: PublicPageLanguage,
): PublicPageImage | null {
  const image = mapMediaImage(value, {
    alt: altValue,
    fallbackAlt,
    locale: language,
  });

  if (image === null) return null;

  return {
    src: image.src,
    alt: image.alt,
    ...(image.altLanguage === language
      ? {}
      : { altLanguage: image.altLanguage }),
    ...(image.width === null ? {} : { width: image.width }),
    ...(image.height === null ? {} : { height: image.height }),
    ...(image.caption === null ? {} : { caption: image.caption }),
    ...(image.credit === null ? {} : { credit: image.credit }),
  };
}

function isRichText(value: unknown): value is PublicRichTextBlock["content"] {
  return (
    isRecord(value) &&
    isRecord(value.root) &&
    Array.isArray(value.root.children)
  );
}

type PayloadBlock = NonNullable<PayloadPage["layout"]>[number];
type MappingContext = { language: PublicPageLanguage; now: Date };

/** Rich text with internal links resolved for the page language. */
function mapRichText(
  value: unknown,
  context: MappingContext,
): PublicRichTextBlock["content"] | null {
  const prepared = prepareRichText(value, context.language, context.now);
  return isRichText(prepared) ? prepared : null;
}

function isText(value: string | null): value is string {
  return value !== null;
}

function getBlockBase(block: PayloadBlock, index: number) {
  return {
    id: getText(block.id) ?? `${block.blockType}-${index + 1}`,
    visible: block.visible !== false,
    anchor: getText(block.anchor),
  };
}

function mapHeroBlock(
  block: Extract<PayloadBlock, { blockType: "hero" }>,
  index: number,
): PublicHeroBlock | null {
  const description = getText(block.description);
  const primaryAction = mapLink(block.primaryAction);
  const secondaryAction = mapLink(block.secondaryAction);
  const titleLines = block.titleLines.flatMap((line) => {
    const text = getText(line.text);
    return text === null ? [] : [{ text, accent: line.accent === true }];
  });

  if (
    description === null ||
    primaryAction === null ||
    secondaryAction === null ||
    titleLines.length === 0
  ) {
    return null;
  }

  return {
    ...getBlockBase(block, index),
    blockType: "hero",
    eyebrow: getText(block.eyebrow),
    titleLines,
    description,
    primaryAction,
    secondaryAction,
    highlights:
      block.highlights?.flatMap((highlight) => {
        const value = getText(highlight.value);
        const label = getText(highlight.label);
        return value === null || label === null ? [] : [{ value, label }];
      }) ?? [],
  };
}

function mapRichTextBlock(
  block: Extract<PayloadBlock, { blockType: "richText" }>,
  index: number,
  context: MappingContext,
): PublicRichTextBlock | null {
  const content = mapRichText(block.content, context);

  if (content === null) return null;

  return {
    ...getBlockBase(block, index),
    blockType: "richText",
    eyebrow: getText(block.eyebrow),
    title: getText(block.title),
    content,
  };
}

function mapCardGroupBlock(
  block: Extract<PayloadBlock, { blockType: "cardGroup" }>,
  index: number,
  context: MappingContext,
): PublicCardGroupBlock | null {
  const title = getText(block.title);
  const cards = block.cards.flatMap((card, cardIndex) => {
    const cardTitle = getText(card.title);
    const description = getText(card.description);

    if (cardTitle === null || description === null) return [];

    return [
      {
        id:
          getText(card.id) ??
          `${getBlockBase(block, index).id}-card-${cardIndex + 1}`,
        icon: card.icon ?? "book",
        image: mapImage(card.image, card.imageAlt, cardTitle, context.language),
        title: cardTitle,
        description,
        link: mapLink(card.link),
      },
    ];
  });

  if (title === null || cards.length === 0) return null;

  return {
    ...getBlockBase(block, index),
    blockType: "cardGroup",
    eyebrow: getText(block.eyebrow),
    title,
    cards,
  };
}

function mapImageTextBlock(
  block: Extract<PayloadBlock, { blockType: "imageText" }>,
  index: number,
  context: MappingContext,
): PublicImageTextBlock | null {
  const title = getText(block.title);
  const image = mapImage(
    block.image,
    block.imageAlt,
    title ?? "",
    context.language,
  );
  const content = mapRichText(block.content, context);

  if (title === null || image === null || content === null) {
    return null;
  }

  return {
    ...getBlockBase(block, index),
    blockType: "imageText",
    eyebrow: getText(block.eyebrow),
    title,
    content,
    image,
    imagePosition: block.imagePosition,
  };
}

function mapHomeAboutBlock(
  block: Extract<PayloadBlock, { blockType: "homeAbout" }>,
  index: number,
  context: MappingContext,
): PublicHomeAboutBlock | null {
  const eyebrow = getText(block.eyebrow);
  const imageAlt = getText(block.imageAlt);
  const titleLines = block.titleLines.map((line) => getText(line.text));
  const paragraphs = block.paragraphs.map((paragraph) =>
    getText(paragraph.text),
  );
  const link = mapOptionalLink(block.link);
  const image =
    block.image === null || block.image === undefined
      ? null
      : mapImage(block.image, block.imageAlt, imageAlt ?? "", context.language);
  const completeTitleLines = titleLines.filter(isText);
  const completeParagraphs = paragraphs.filter(isText);

  if (
    eyebrow === null ||
    imageAlt === null ||
    completeTitleLines.length !== titleLines.length ||
    completeParagraphs.length !== paragraphs.length ||
    completeTitleLines.length === 0 ||
    completeParagraphs.length === 0 ||
    link === null ||
    (block.image !== null && block.image !== undefined && image === null)
  ) {
    return null;
  }

  return {
    ...getBlockBase(block, index),
    blockType: "homeAbout",
    eyebrow,
    titleLines: completeTitleLines,
    paragraphs: completeParagraphs,
    link: link ?? null,
    image,
    imageAlt,
  };
}

type FocusAreaCard = PublicHomeFocusAreasBlock["cards"][number];

function mapHomeFocusAreasBlock(
  block: Extract<PayloadBlock, { blockType: "homeFocusAreas" }>,
  index: number,
): PublicHomeFocusAreasBlock | null {
  const eyebrow = getText(block.eyebrow);
  const title = getText(block.title);
  const cards = block.cards.map((card, cardIndex): FocusAreaCard | null => {
    const cardTitle = getText(card.title);
    const description = getText(card.description);
    const linkLabel = getText(card.linkLabel);
    const linkHref =
      getText(card.linkHref) === null ? null : getSafeHref(card.linkHref);

    if (
      cardTitle === null ||
      description === null ||
      linkLabel === null ||
      (getText(card.linkHref) !== null && linkHref === null)
    ) {
      return null;
    }

    return {
      id:
        getText(card.id) ??
        `${getBlockBase(block, index).id}-card-${cardIndex + 1}`,
      icon: card.icon,
      title: cardTitle,
      description,
      linkLabel,
      linkHref,
    };
  });
  const completeCards = cards.filter(
    (card): card is FocusAreaCard => card !== null,
  );

  if (
    eyebrow === null ||
    title === null ||
    completeCards.length === 0 ||
    completeCards.length !== cards.length
  ) {
    return null;
  }

  return {
    ...getBlockBase(block, index),
    blockType: "homeFocusAreas",
    eyebrow,
    title,
    description: getText(block.description),
    cards: completeCards,
  };
}

function mapCtaBlock(
  block: Extract<PayloadBlock, { blockType: "cta" }>,
  index: number,
): PublicCtaBlock | null {
  const title = getText(block.title);
  const action = mapLink(block.action);

  if (title === null || action === null) return null;

  return {
    ...getBlockBase(block, index),
    blockType: "cta",
    title,
    description: getText(block.description),
    action,
  };
}

function mapBlock(
  block: PayloadBlock,
  index: number,
  context: MappingContext,
): PublicPageBlock | null {
  switch (block.blockType) {
    case "hero":
      return mapHeroBlock(block, index);
    case "richText":
      return mapRichTextBlock(block, index, context);
    case "cardGroup":
      return mapCardGroupBlock(block, index, context);
    case "imageText":
      return mapImageTextBlock(block, index, context);
    case "homeAbout":
      return mapHomeAboutBlock(block, index, context);
    case "homeFocusAreas":
      return mapHomeFocusAreasBlock(block, index);
    case "cta":
      return mapCtaBlock(block, index);
  }
}

function reportInvalidPage(
  pageID: string,
  language: PublicPageLanguage,
  reason: string,
  detail?: string,
): void {
  reportContentIssue({
    scope: "pages",
    id: pageID,
    locale: language,
    reason,
    ...(detail === undefined ? {} : { detail }),
  });
}

export function mapPayloadPage(
  value: PayloadPage,
  language: PublicPageLanguage,
  now: Date = new Date(),
): PublicPage | null {
  const id = getText(value.id);
  const title = getText(value.title);
  const slug = getText(value.slug);
  const summary = getText(value.summary);

  if (id === null) return null;

  if (value._status !== "published" || !isPublishedBy(value.publishedAt, now)) {
    reportInvalidPage(id, language, "status or publication date is not public");
    return null;
  }

  if (
    value.language !== language ||
    title === null ||
    slug === null ||
    summary === null
  ) {
    reportInvalidPage(id, language, "required public fields are missing");
    return null;
  }

  const context: MappingContext = { language, now };

  return {
    id,
    title,
    slug,
    language,
    pageType: value.pageType,
    summary,
    layout:
      value.layout?.flatMap((block, index) => {
        const mapped = mapBlock(block, index, context);

        if (mapped === null) {
          reportInvalidPage(
            id,
            language,
            "block skipped: required block fields are missing or invalid",
            `${block.blockType}#${index + 1}`,
          );
          return [];
        }

        return [mapped];
      }) ?? [],
    publishedAt: value.publishedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    seo: {
      title: getText(value.seo?.title) ?? title,
      description: getText(value.seo?.description) ?? summary,
      index: value.seo?.index !== false,
      follow: value.seo?.follow !== false,
      socialImage: mapImage(
        value.seo?.socialImage,
        null,
        `${title} sosyal paylaşım görseli`,
        language,
      ),
    },
  };
}

const HOME_BLOCK_ARRAY_FIELDS = {
  hero: ["titleLines"],
  homeAbout: ["titleLines", "paragraphs"],
  homeFocusAreas: ["cards"],
} as const;

function isRecordArray(value: unknown): boolean {
  return Array.isArray(value) && value.every(isRecord);
}

type HomeBlock = Extract<
  PayloadBlock,
  { blockType: keyof typeof HOME_BLOCK_ARRAY_FIELDS }
>;

/**
 * A home block from a write (admin form, REST or Local API) with the shape
 * the mappers walk: arrays of rows where the schema has arrays. Text values
 * stay unchecked here; the mappers check them.
 */
function isHomeBlockShape(value: unknown): value is HomeBlock {
  if (!isRecord(value)) return false;

  const { blockType } = value;
  if (
    blockType !== "hero" &&
    blockType !== "homeAbout" &&
    blockType !== "homeFocusAreas"
  ) {
    return false;
  }

  return (
    HOME_BLOCK_ARRAY_FIELDS[blockType].every((name) =>
      isRecordArray(value[name]),
    ) &&
    (value.highlights === undefined ||
      value.highlights === null ||
      isRecordArray(value.highlights))
  );
}

/**
 * Whether a hero, homeAbout or homeFocusAreas block in a write renders on
 * the home page: the public mapper's own rules, applied before publishing so
 * that a published home record never falls back to the static content. An
 * upload is still an unpopulated ID during a write, so the portrait is
 * checked by its field filter (images only), not here.
 */
export function isRenderableHomeBlock(
  value: unknown,
  language: PublicPageLanguage,
): boolean {
  if (!isHomeBlockShape(value)) return false;

  const context: MappingContext = { language, now: new Date() };

  switch (value.blockType) {
    case "hero":
      return mapHeroBlock(value, 0) !== null;
    case "homeAbout":
      return (
        mapHomeAboutBlock(
          { ...value, image: isRecord(value.image) ? value.image : null },
          0,
          context,
        ) !== null
      );
    case "homeFocusAreas":
      return mapHomeFocusAreasBlock(value, 0) !== null;
  }
}
