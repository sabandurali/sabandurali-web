import { getArticlePath } from "@/content/articles/article-routes";
import { getBookReviewPath } from "@/content/books/book-routes";
import { getDistrict } from "@/content/districts/district-registry";
import { getDistrictPath } from "@/content/districts/district-routes";
import { getText, isPublishedBy, isRecord } from "@/content/guards";
import { getPhotoPath } from "@/content/photos/photo-routes";

export type RichTextLocale = "tr" | "en";

function getLanguage(value: unknown): RichTextLocale | null {
  return value === "tr" || value === "en" ? value : null;
}

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
): string | null {
  if (!isRecord(doc) || !isRecord(doc.value)) return null;

  const relationTo = getText(doc.relationTo);
  const value = doc.value;
  const slug = getText(value.slug);

  switch (relationTo) {
    case "articles":
      return slug !== null &&
        value.articleType !== "district-news" &&
        isPublishedDocument(value, now)
        ? getArticlePath(slug, locale)
        : null;
    case "photos":
      return slug !== null && isPublishedDocument(value, now)
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
      // Every registered district has a page, published guide or not.
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

function prepareNode(
  node: unknown,
  locale: RichTextLocale,
  now: Date,
): unknown {
  if (!isRecord(node)) return node;

  const children = Array.isArray(node.children)
    ? node.children.map((child) => prepareNode(child, locale, now))
    : node.children;
  const withChildren =
    children === node.children ? node : { ...node, children };

  if (node.type === "upload") {
    return isRecord(node.value)
      ? { ...withChildren, value: projectUploadValue(node.value, locale) }
      : withChildren;
  }

  if (node.type === "relationship") {
    // Rendered as explicitly unsupported; never pass the populated document.
    return isRecord(node.value)
      ? { ...withChildren, value: node.value.id ?? null }
      : withChildren;
  }

  if (
    node.type !== "link" ||
    !isRecord(node.fields) ||
    node.fields.linkType !== "internal"
  ) {
    return withChildren;
  }

  const href = getInternalDocumentPath(node.fields.doc, locale, now);

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
 * links that render as plain text), uploads keep only their public fields
 * and relationship nodes lose their populated document.
 */
export function prepareRichText(
  content: unknown,
  locale: RichTextLocale,
  now: Date,
): unknown {
  if (!isRecord(content) || !isRecord(content.root)) return content;

  return { ...content, root: prepareNode(content.root, locale, now) };
}
