import { getSafePayloadMediaPath } from "@/content/articles/article-images";
import type {
  PublicCardGroupBlock,
  PublicCtaBlock,
  PublicHeroBlock,
  PublicImageTextBlock,
  PublicPage,
  PublicPageBlock,
  PublicPageImage,
  PublicPageLink,
  PublicPageLanguage,
  PublicRichTextBlock,
} from "@/content/pages/public-types";
import type { Page as PayloadPage } from "@/payload-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRequiredText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getOptionalText(value: unknown): string | null {
  return getRequiredText(value);
}

function getPositiveDimension(value: unknown): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : undefined;
}

function getSafeHref(value: unknown): string | null {
  const href = getRequiredText(value);

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

  const label = getRequiredText(value.label);
  const href = getSafeHref(value.href);

  return label === null || href === null ? null : { label, href };
}

function mapImage(
  value: unknown,
  altValue: unknown,
  fallbackAlt: string,
): PublicPageImage | null {
  if (!isRecord(value)) return null;

  const mimeType = getRequiredText(value.mimeType);
  const src = getSafePayloadMediaPath(value.url);

  if (mimeType === null || !mimeType.startsWith("image/") || src === null) {
    return null;
  }

  return {
    src,
    alt:
      getRequiredText(altValue) ??
      getRequiredText(value.alt) ??
      fallbackAlt,
    ...(getPositiveDimension(value.width) === undefined
      ? {}
      : { width: getPositiveDimension(value.width) }),
    ...(getPositiveDimension(value.height) === undefined
      ? {}
      : { height: getPositiveDimension(value.height) }),
  };
}

function isRichText(value: unknown): value is PublicRichTextBlock["content"] {
  return (
    isRecord(value) &&
    isRecord(value.root) &&
    Array.isArray(value.root.children)
  );
}

function getBlockBase(
  block: NonNullable<PayloadPage["layout"]>[number],
  index: number,
) {
  return {
    id:
      getRequiredText(block.id) ??
      `${block.blockType}-${index + 1}`,
    visible: block.visible !== false,
    anchor: getOptionalText(block.anchor),
  };
}

function mapHeroBlock(
  block: Extract<
    NonNullable<PayloadPage["layout"]>[number],
    { blockType: "hero" }
  >,
  index: number,
): PublicHeroBlock | null {
  const description = getRequiredText(block.description);
  const primaryAction = mapLink(block.primaryAction);
  const secondaryAction = mapLink(block.secondaryAction);
  const titleLines = block.titleLines.flatMap((line) => {
    const text = getRequiredText(line.text);
    return text === null
      ? []
      : [{ text, accent: line.accent === true }];
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
    eyebrow: getOptionalText(block.eyebrow),
    titleLines,
    description,
    primaryAction,
    secondaryAction,
    highlights:
      block.highlights?.flatMap((highlight) => {
        const value = getRequiredText(highlight.value);
        const label = getRequiredText(highlight.label);
        return value === null || label === null ? [] : [{ value, label }];
      }) ?? [],
  };
}

function mapRichTextBlock(
  block: Extract<
    NonNullable<PayloadPage["layout"]>[number],
    { blockType: "richText" }
  >,
  index: number,
): PublicRichTextBlock | null {
  if (!isRichText(block.content)) return null;

  return {
    ...getBlockBase(block, index),
    blockType: "richText",
    eyebrow: getOptionalText(block.eyebrow),
    title: getOptionalText(block.title),
    content: block.content,
  };
}

function mapCardGroupBlock(
  block: Extract<
    NonNullable<PayloadPage["layout"]>[number],
    { blockType: "cardGroup" }
  >,
  index: number,
): PublicCardGroupBlock | null {
  const title = getRequiredText(block.title);
  const cards = block.cards.flatMap((card, cardIndex) => {
    const cardTitle = getRequiredText(card.title);
    const description = getRequiredText(card.description);

    if (cardTitle === null || description === null) return [];

    return [
      {
        id:
          getRequiredText(card.id) ??
          `${getBlockBase(block, index).id}-card-${cardIndex + 1}`,
        icon: card.icon ?? "book",
        image: mapImage(card.image, card.imageAlt, cardTitle),
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
    eyebrow: getOptionalText(block.eyebrow),
    title,
    cards,
  };
}

function mapImageTextBlock(
  block: Extract<
    NonNullable<PayloadPage["layout"]>[number],
    { blockType: "imageText" }
  >,
  index: number,
): PublicImageTextBlock | null {
  const title = getRequiredText(block.title);
  const image = mapImage(block.image, block.imageAlt, title ?? "");

  if (title === null || image === null || !isRichText(block.content)) {
    return null;
  }

  return {
    ...getBlockBase(block, index),
    blockType: "imageText",
    eyebrow: getOptionalText(block.eyebrow),
    title,
    content: block.content,
    image,
    imagePosition: block.imagePosition,
  };
}

function mapCtaBlock(
  block: Extract<
    NonNullable<PayloadPage["layout"]>[number],
    { blockType: "cta" }
  >,
  index: number,
): PublicCtaBlock | null {
  const title = getRequiredText(block.title);
  const action = mapLink(block.action);

  if (title === null || action === null) return null;

  return {
    ...getBlockBase(block, index),
    blockType: "cta",
    title,
    description: getOptionalText(block.description),
    action,
  };
}

function mapBlock(
  block: NonNullable<PayloadPage["layout"]>[number],
  index: number,
): PublicPageBlock | null {
  switch (block.blockType) {
    case "hero":
      return mapHeroBlock(block, index);
    case "richText":
      return mapRichTextBlock(block, index);
    case "cardGroup":
      return mapCardGroupBlock(block, index);
    case "imageText":
      return mapImageTextBlock(block, index);
    case "cta":
      return mapCtaBlock(block, index);
  }
}

function isPublishedAtPublic(
  value: unknown,
  now: Date,
): value is string {
  if (typeof value !== "string") return false;

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}

function reportInvalidPage(
  pageID: string,
  reason: string,
): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[public-pages] Payload page ${pageID} was skipped: ${reason}`);
  }
}

export function mapPayloadPage(
  value: PayloadPage,
  language: PublicPageLanguage,
  now: Date = new Date(),
): PublicPage | null {
  const id = getRequiredText(value.id);
  const title = getRequiredText(value.title);
  const slug = getRequiredText(value.slug);
  const summary = getRequiredText(value.summary);

  if (id === null) return null;

  if (
    value._status !== "published" ||
    !isPublishedAtPublic(value.publishedAt, now)
  ) {
    reportInvalidPage(id, "status or publication date is not public");
    return null;
  }

  if (
    value.language !== language ||
    title === null ||
    slug === null ||
    summary === null
  ) {
    reportInvalidPage(id, "required public fields are missing");
    return null;
  }

  return {
    id,
    title,
    slug,
    language,
    pageType: value.pageType,
    summary,
    layout:
      value.layout?.flatMap((block, index) => {
        const mapped = mapBlock(block, index);
        return mapped === null ? [] : [mapped];
      }) ?? [],
    publishedAt: value.publishedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    seo: {
      title: getRequiredText(value.seo?.title) ?? title,
      description: getRequiredText(value.seo?.description) ?? summary,
      index: value.seo?.index !== false,
      follow: value.seo?.follow !== false,
      socialImage: mapImage(
        value.seo?.socialImage,
        null,
        `${title} sosyal paylaşım görseli`,
      ),
    },
  };
}
