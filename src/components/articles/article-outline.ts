import type { PublicArticleContent } from "@/content/articles/public-types";
import type { ArticleContentBlock } from "@/content/articles/types";
import { isRecord } from "@/content/guards";

/**
 * The outline of an article body: an anchor id for every h2–h4 heading
 * (static blocks and Lexical rich text alike), the h2/h3 entries of the
 * table of contents and a word count for the reading time. Pure, so the
 * renderer and the table of contents compute the same ids.
 */

export type OutlineHeading = {
  id: string;
  text: string;
  level: 2 | 3 | 4;
};

export type ArticleOutline = {
  headings: OutlineHeading[];
  /**
   * Anchor id per heading: keyed by the block id of a static heading and by
   * the node object of a Lexical heading.
   */
  anchors: ReadonlyMap<string | object, string>;
  words: number;
};

/** A table of contents helps from this many h2/h3 headings on. */
export const minimumTocHeadings = 3;

/** Silent reading speed used for the reading time (words per minute). */
export const wordsPerMinute = 200;

/**
 * Ids the article page itself uses. A heading whose slug would collide
 * with one of them, or with the source and FAQ anchors, gets a prefix.
 */
const reservedIds = new Set([
  "main",
  "article-title",
  "article-toc",
  "article-toc-heading",
  "article-sources",
  "article-sources-heading",
  "article-faq",
  "article-faq-heading",
  "article-legal-notice-heading",
  "article-cite",
]);

const turkishLetters: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

/** URL-safe slug of a heading text, with Turkish letters spelled in ASCII. */
export function headingSlug(text: string): string {
  const slug = text
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (letter) => turkishLetters[letter] ?? letter)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return slug || "bolum";
}

/** A unique anchor id for a heading; `used` collects the ids handed out. */
export function uniqueHeadingId(text: string, used: Set<string>): string {
  let base = headingSlug(text);
  if (
    reservedIds.has(base) ||
    base.startsWith("source-") ||
    base.startsWith("faq-")
  ) {
    base = `bolum-${base}`;
  }
  let id = base;
  for (let suffix = 2; used.has(id); suffix += 1) id = `${base}-${suffix}`;
  used.add(id);
  return id;
}

const countWords = (value: string | null | undefined): number =>
  value
    ? value.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length
    : 0;

function blockText(block: ArticleContentBlock): readonly string[] {
  switch (block.type) {
    case "paragraph":
    case "heading":
      return [block.text];
    case "bullet_list":
    case "numbered_list":
      return block.items;
    case "quote":
      return [block.text, block.attribution ?? ""];
    case "table":
      return [block.caption ?? "", ...block.headers, ...block.rows.flat()];
    case "info_box":
    case "warning_box":
      return [block.title ?? "", block.text];
    default:
      return [];
  }
}

const headingLevels = { h2: 2, h3: 3, h4: 4 } as const;

function headingLevel(tag: unknown): 2 | 3 | 4 | null {
  return tag === "h2" || tag === "h3" || tag === "h4"
    ? headingLevels[tag]
    : null;
}

/** Plain text of a Lexical node and its descendants. */
function lexicalText(node: unknown): string {
  if (!isRecord(node)) return "";
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (node.type === "linebreak" || node.type === "tab") return " ";
  if (!Array.isArray(node.children)) return "";
  return node.children.map(lexicalText).join("");
}

function walkLexical(
  node: unknown,
  visit: (node: Record<string, unknown>) => void,
): void {
  if (!isRecord(node)) return;
  visit(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walkLexical(child, visit);
  }
}

export function getArticleOutline(
  content: PublicArticleContent,
): ArticleOutline {
  const used = new Set<string>();
  const headings: OutlineHeading[] = [];
  const anchors = new Map<string | object, string>();
  let words = 0;

  const addHeading = (key: string | object, text: string, level: 2 | 3 | 4) => {
    const label = text.replace(/\s+/g, " ").trim();
    if (label === "") return;
    const id = uniqueHeadingId(label, used);
    anchors.set(key, id);
    headings.push({ id, text: label, level });
  };

  if (content.source === "static") {
    for (const block of content.blocks) {
      words += blockText(block).reduce(
        (sum, text) => sum + countWords(text),
        0,
      );
      if (block.type === "heading") {
        const level = headingLevel(block.level);
        if (level !== null) addHeading(block.id, block.text, level);
      }
    }
  } else if (isRecord(content.data)) {
    walkLexical(content.data.root, (node) => {
      if (node.type === "text" && typeof node.text === "string") {
        words += countWords(node.text);
      }
      if (node.type === "heading") {
        const level = headingLevel(node.tag);
        if (level !== null) addHeading(node, lexicalText(node), level);
      }
    });
  }

  return { headings, anchors, words };
}

/** The table of contents entries (h2 and h3), or none below the minimum. */
export function getTocEntries(outline: ArticleOutline): OutlineHeading[] {
  const entries = outline.headings.filter((heading) => heading.level <= 3);
  return entries.length >= minimumTocHeadings ? entries : [];
}

/** Reading time in whole minutes (at least one), or null without text. */
export function readingMinutes(words: number): number | null {
  return words > 0 ? Math.max(1, Math.round(words / wordsPerMinute)) : null;
}
