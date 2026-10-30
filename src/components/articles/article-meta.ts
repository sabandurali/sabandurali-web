import type { MetaItem } from "@/components/pages/MetaList";
import {
  articlePageContent,
  formatArticleDate,
} from "@/content/articles/article-page-content";
import type { PublicArticle } from "@/content/articles/public-types";
import { getContentLastModifiedIso } from "@/lib/content-dates";
import { toDateTimeAttribute } from "@/lib/format-date";
import { getArticleOutline, readingMinutes } from "./article-outline";

/** Reading time line: the label and the value in each language. */
export const readingTimeCopy = {
  tr: { label: "Okuma süresi", value: (minutes: number) => `${minutes} dk` },
  en: {
    label: "Reading time",
    value: (minutes: number) => `${minutes} min`,
  },
} as const;

/**
 * Published, updated (when later), author and reading time lines under the
 * lead. The reading time is counted from the body text; an article without
 * text has none.
 */
export function getArticleMetaItems(article: PublicArticle): MetaItem[] {
  const content = articlePageContent[article.language];
  const staticDetails =
    article.content.source === "static" ? article.content.details : null;
  const author = staticDetails?.author?.name ?? article.author ?? null;
  const publishedAt = formatArticleDate(article.publishedAt, content);
  // A scheduled article is saved before it goes live: its last change is
  // never earlier than its publication.
  const modifiedAt = getContentLastModifiedIso(article) ?? null;
  const updatedAt = formatArticleDate(modifiedAt, content);
  const items: MetaItem[] = [];

  if (publishedAt !== null) {
    items.push({
      label: content.publishedLabel,
      value: publishedAt,
      dateTime: toDateTimeAttribute(article.publishedAt),
      data: true,
    });
  }
  // The update line only adds information when it names another day.
  if (updatedAt !== null && updatedAt !== publishedAt) {
    items.push({
      label: content.updatedLabel,
      value: updatedAt,
      dateTime: toDateTimeAttribute(modifiedAt),
      data: true,
    });
  }
  if (author !== null && author.trim() !== "") {
    items.push({ label: content.authorLabel, value: author });
  }
  const minutes = readingMinutes(getArticleOutline(article.content).words);
  if (minutes !== null) {
    const copy = readingTimeCopy[article.language];
    items.push({ label: copy.label, value: copy.value(minutes), data: true });
  }

  return items;
}
