import type { MetaItem } from "@/components/pages/MetaList";
import {
  articlePageContent,
  formatArticleDate,
} from "@/content/articles/article-page-content";
import type { PublicArticle } from "@/content/articles/public-types";
import { getContentLastModifiedIso } from "@/lib/content-dates";
import { toDateTimeAttribute } from "@/lib/format-date";

/** Published, updated (when later) and author lines under the lead. */
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

  return items;
}
