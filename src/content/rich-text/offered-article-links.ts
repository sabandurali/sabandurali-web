import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { selectOfferedEnglishArticleIds } from "@/content/articles/article-translation";
import {
  collectLinkedArticles,
  type RichTextLinkContext,
} from "@/content/rich-text/prepare-rich-text";

/**
 * Link context for English documents: which linked English articles are
 * complete translations and therefore served (the detail page applies the
 * same rule). One query reads the Turkish rich text of the linked articles;
 * documents without article links cost nothing.
 */
export async function getEnglishRichTextLinkContext(
  documents: ReadonlyArray<unknown>,
): Promise<RichTextLinkContext> {
  const english = collectLinkedArticles(documents);

  if (english.size === 0) return { offeredEnglishArticleIds: new Set() };

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "articles",
    depth: 0,
    draft: false,
    fallbackLocale: false,
    limit: english.size,
    locale: "tr",
    overrideAccess: false,
    pagination: false,
    select: { content: true },
    where: { id: { in: [...english.keys()] } },
  });
  const turkish = new Map<string, unknown>(
    result.docs.map((document) => [document.id, document.content]),
  );

  return {
    offeredEnglishArticleIds: selectOfferedEnglishArticleIds(english, turkish),
  };
}
