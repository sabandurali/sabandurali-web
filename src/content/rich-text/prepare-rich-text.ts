import { isSiteLocale, type SiteLocale } from "@/content/locales";
import { getArticlePath } from "@/content/articles/article-routes";
import { getBookReviewPath } from "@/content/books/book-routes";
import { getDistrict } from "@/content/districts/district-registry";
import { getDistrictPath } from "@/content/districts/district-routes";
import { reportContentIssue } from "@/content/content-log";
import { getText, isPublishedBy, isRecord } from "@/content/guards";
import { getPhotoPath } from "@/content/photos/photo-routes";

export type RichTextLocale = SiteLocale;

function getLanguage(value: unknown): RichTextLocale | null {
  return isSiteLocale(value) ? value : null;
}

/**
 * What the renderer of a page must know beyond the linked document itself.
 *
 * An English article version is only served when it covers its Turkish
 * source (`isCompleteTranslation`), which needs the Turkish rich text that a
 * link populated in English does not carry. The repository therefore
 * resolves the English article targets first (`collectLinkedArticles`) and
 * passes the IDs it may link to. Without that set, English article links
 * stay unresolved and render as plain text: never a link to a 404.
 */
export type RichTextLinkContext = {
  offeredEnglishArticleIds?: ReadonlySet<string>;
};

function isPublishedDocument(value: Record<string, unknown>, now: Date) {
  return (
    (value._status === undefined || value._status === "published") &&
    isPublishedBy(value.publishedAt, now)
  );
}

/**
 * Public path of the document behind a Lexical internal link, or null when
 * the link cannot be followed by an anonymous visitor: the target is not
 * populated (Payload keeps only the ID when access is denied), not published
 * yet, has no public route, or belongs to an unsupported collection.
 *
 * Localized slugs are populated in the locale of the page being rendered, so
 * articles and photos use that locale. Pages and book reviews are separate
 * documents per language and carry their own `language`.
 */
export function getInternalDocumentPath(
  doc: unknown,
  locale: RichTextLocale,
  now: Date,
  context: RichTextLinkContext = {},
): string | null {
  if (!isRecord(doc) || !isRecord(doc.value)) return null;

  const relationTo = getText(doc.relationTo);
  const value = doc.value;
  const slug = getText(value.slug);

  switch (relationTo) {
    case "articles": {
      if (
        slug === null ||
        value.articleType === "district-news" ||
        !isPublishedDocument(value, now)
      ) {
        return null;
      }
      if (locale === "en") {
        const id = getText(value.id);
        const offered = context.offeredEnglishArticleIds;

        if (id === null || offered === undefined || !offered.has(id)) {
          return null;
        }
      }
      return getArticlePath(slug, locale);
    }
    case "photos":
      // Same rule as the photo detail page (`createPublicPhotoConditions`):
      // the localized title and alt text must exist in this locale.
      return slug !== null &&
        getText(value.title) !== null &&
        getText(value.altText) !== null &&
        isPublishedDocument(value, now)
        ? getPhotoPath(slug, locale)
        : null;
    case "books": {
      const language = getLanguage(value.language);

      return slug !== null &&
        language !== null &&
        value.reviewStatus === "published" &&
        isRecord(value.seo) &&
        value.seo.index === true &&
        isPublishedDocument(value, now)
        ? getBookReviewPath(slug, language)
        : null;
    }
    case "pages": {
      const language = getLanguage(value.language);

      if (language === null || !isPublishedDocument(value, now)) return null;
      if (value.pageType === "home") return language === "en" ? "/en" : "/";

      // Only Turkish standard pages have a public route.
      return value.pageType === "standard" && language === "tr" && slug !== null
        ? `/${slug}`
        : null;
    }
    case "district-guides": {
      /*
       * Every registered district has a page, published guide or not, but
       * an anonymous reader can only populate a published guide: a link to
       * a draft or scheduled guide arrives without `value` and stays plain
       * text until the guide is published. Publishing the guide refreshes
       * the pages that render rich text (`districtGuideTargets` in
       * src/lib/revalidation.ts), so the link appears at once.
       */
      const district = getText(value.district);

      return district !== null && getDistrict(district) !== null
        ? getDistrictPath(district)
        : null;
    }
    default:
      return null;
  }
}

/**
 * Public projection of a populated upload (media) document. Only what the
 * renderer needs is kept. The media description is written in Turkish in the
 * CMS, so it is only used as a caption for Turkish content; the source /
 * copyright credit is kept for every language because attribution is a
 * licence condition.
 */
function projectUploadValue(
  value: Record<string, unknown>,
  locale: RichTextLocale,
): Record<string, unknown> {
  const description = locale === "tr" ? getText(value.description) : null;
  const credit = getText(value.sourceCopyright);

  return {
    id: value.id,
    url: value.url,
    mimeType: value.mimeType,
    filename: value.filename,
    alt: value.alt,
    width: value.width,
    height: value.height,
    ...(description === null ? {} : { description }),
    ...(credit === null ? {} : { sourceCopyright: credit }),
  };
}

/**
 * Relationship nodes (legacy content from before the editor stopped
 * offering them) have no public rendering. They are dropped, and each one
 * is logged so an editor can replace it with an internal link.
 */
function isRelationshipNode(node: unknown): boolean {
  if (!isRecord(node) || node.type !== "relationship") return false;

  const relationTo = getText(node.relationTo);
  reportContentIssue({
    scope: "rich-text",
    reason: "relationship node dropped: it has no public rendering",
    ...(relationTo === null ? {} : { detail: relationTo }),
  });
  return true;
}

function prepareNode(
  node: unknown,
  locale: RichTextLocale,
  now: Date,
  context: RichTextLinkContext,
): unknown {
  if (!isRecord(node)) return node;

  const children = Array.isArray(node.children)
    ? node.children.flatMap((child) =>
        isRelationshipNode(child)
          ? []
          : [prepareNode(child, locale, now, context)],
      )
    : node.children;
  const withChildren =
    children === node.children ? node : { ...node, children };

  if (node.type === "upload") {
    return isRecord(node.value)
      ? { ...withChildren, value: projectUploadValue(node.value, locale) }
      : withChildren;
  }

  // The page title is the only h1; a legacy h1 in the body becomes an h2.
  if (node.type === "heading" && node.tag === "h1") {
    return { ...withChildren, tag: "h2" };
  }

  if (
    node.type !== "link" ||
    !isRecord(node.fields) ||
    node.fields.linkType !== "internal"
  ) {
    return withChildren;
  }

  const href = getInternalDocumentPath(node.fields.doc, locale, now, context);

  // The populated target document is never passed on to the renderer.
  return {
    ...withChildren,
    fields:
      href === null
        ? { ...node.fields, doc: null }
        : { ...node.fields, doc: null, linkType: "custom", url: href },
  };
}

/**
 * Prepares a Lexical document for public rendering while the locale is
 * known: internal links become public paths (or stay unresolved "internal"
 * links that render as plain text), uploads keep only their public fields,
 * relationship nodes are dropped and logged, and a legacy h1 becomes an h2.
 */
export function prepareRichText(
  content: unknown,
  locale: RichTextLocale,
  now: Date,
  context: RichTextLinkContext = {},
): unknown {
  if (!isRecord(content) || !isRecord(content.root)) return content;

  return { ...content, root: prepareNode(content.root, locale, now, context) };
}

function collectLinks(value: unknown, found: Map<string, unknown>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectLinks(item, found);
    return;
  }
  if (!isRecord(value)) return;

  if (
    value.type === "link" &&
    isRecord(value.fields) &&
    value.fields.linkType === "internal" &&
    isRecord(value.fields.doc) &&
    value.fields.doc.relationTo === "articles" &&
    isRecord(value.fields.doc.value)
  ) {
    const target = value.fields.doc.value;
    const id = getText(target.id);
    if (id !== null && !found.has(id)) found.set(id, target.content);
  }

  for (const child of Object.values(value)) collectLinks(child, found);
}

/**
 * Populated article targets of every internal link anywhere in `value` (an
 * article, a page layout, …): article ID → its rich text in the locale the
 * link was populated in.
 */
export function collectLinkedArticles(value: unknown): Map<string, unknown> {
  const found = new Map<string, unknown>();
  collectLinks(value, found);
  return found;
}
