import type { PublicArticle } from "@/content/articles/public-types";
import { reportContentIssue } from "@/content/content-log";
import { isRecord } from "@/content/guards";

/**
 * Payload publishes every locale of a document together. When an editor has
 * started the English translation as a draft and then publishes a Turkish
 * fix, the half-finished English text goes live with it. A translation is
 * therefore only offered when it covers the Turkish source: at least as many
 * headings and at least MIN_TRANSLATION_TEXT_RATIO of its text length.
 * English text normally runs within ±15 % of the Turkish length, so the
 * threshold tolerates normal variation but rejects a summary or a first
 * section.
 */
export const MIN_TRANSLATION_TEXT_RATIO = 0.6;

export type LexicalOutline = {
  headings: number;
  textLength: number;
};

function collect(node: unknown, outline: LexicalOutline): void {
  if (!isRecord(node)) return;

  if (node.type === "heading") outline.headings += 1;
  if (node.type === "text" && typeof node.text === "string") {
    outline.textLength += node.text.trim().length;
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) collect(child, outline);
  }
}

export function getLexicalOutline(content: unknown): LexicalOutline {
  const outline: LexicalOutline = { headings: 0, textLength: 0 };

  if (isRecord(content)) collect(content.root, outline);

  return outline;
}

/**
 * True when `translation` covers `source`. A source without text (district
 * news, an empty draft) imposes no requirement.
 */
export function isCompleteTranslation(
  source: unknown,
  translation: unknown,
): boolean {
  const sourceOutline = getLexicalOutline(source);

  if (sourceOutline.textLength === 0) return true;

  const translationOutline = getLexicalOutline(translation);

  return (
    translationOutline.headings >= sourceOutline.headings &&
    translationOutline.textLength >=
      sourceOutline.textLength * MIN_TRANSLATION_TEXT_RATIO
  );
}

function getLexicalData(article: PublicArticle): unknown {
  return article.content.source === "lexical" ? article.content.data : null;
}

/**
 * Whether an article version may be shown and linked. Only English versions
 * are checked; the Turkish rich text is their source. Rejections are logged
 * so editors can see why a translation is not online.
 */
export function isOfferedArticleVersion(
  article: PublicArticle,
  turkishContent: unknown,
): boolean {
  if (article.language !== "en") return true;
  if (isCompleteTranslation(turkishContent, getLexicalData(article))) {
    return true;
  }

  reportContentIssue({
    scope: "articles",
    id: article.id,
    locale: article.language,
    reason:
      "translation is incomplete compared with the Turkish source and is not offered",
  });
  return false;
}

/** The pair form used by article pages, where both versions are loaded. */
export function isOfferedTranslationPair(
  article: PublicArticle,
  turkishSource: PublicArticle | null,
): boolean {
  return (
    turkishSource === null ||
    isOfferedArticleVersion(article, getLexicalData(turkishSource))
  );
}

/**
 * English article versions an internal link may point to: those whose
 * Turkish source is known and covered (`englishContent` maps article ID →
 * English rich text, `turkishContent` article ID → Turkish rich text). An
 * article missing from `turkishContent` is not readable in Turkish and is
 * not offered.
 */
export function selectOfferedEnglishArticleIds(
  englishContent: ReadonlyMap<string, unknown>,
  turkishContent: ReadonlyMap<string, unknown>,
): Set<string> {
  const offered = new Set<string>();

  for (const [id, content] of englishContent) {
    if (
      turkishContent.has(id) &&
      isCompleteTranslation(turkishContent.get(id), content)
    ) {
      offered.add(id);
    }
  }

  return offered;
}
