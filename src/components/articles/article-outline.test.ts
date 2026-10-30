import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { exampleTurkishArticle } from "@/content/articles/examples";
import type { PublicArticle } from "@/content/articles/public-types";
import { mapStaticArticle } from "@/content/articles/static-articles";
import type { ArticleContentBlock } from "@/content/articles/types";
import {
  heading,
  lexical,
  paragraph,
  text,
} from "@/content/rich-text/lexical-fixtures";
import { articlePageContent } from "@/content/articles/article-page-content";
import ArticleContent from "./ArticleContent";
import ArticleToc from "./ArticleToc";
import { getArticleMetaItems, readingTimeCopy } from "./article-meta";
import {
  getArticleOutline,
  getTocEntries,
  headingSlug,
  readingMinutes,
  uniqueHeadingId,
} from "./article-outline";
import PayloadRichText from "./PayloadRichText";

type RichTextData = ComponentProps<typeof PayloadRichText>["data"];

function isRichTextData(value: unknown): value is RichTextData {
  return typeof value === "object" && value !== null && "root" in value;
}

const base = mapStaticArticle(exampleTurkishArticle);

function staticArticle(blocks: ArticleContentBlock[]): PublicArticle {
  assert.equal(base.content.source, "static");
  if (base.content.source !== "static") throw new Error("static fixture");
  return { ...base, content: { ...base.content, blocks } };
}

function lexicalArticle(data: unknown): PublicArticle {
  assert.ok(isRichTextData(data));
  return { ...base, content: { source: "lexical", data } };
}

const headingBlock = (
  id: string,
  level: "h2" | "h3" | "h4",
  value: string,
): ArticleContentBlock => ({ id, type: "heading", level, text: value });
const paragraphBlock = (id: string, value: string): ArticleContentBlock => ({
  id,
  type: "paragraph",
  text: value,
});

test("ARTICLE-TOC: heading slugs spell Turkish letters in ASCII", () => {
  assert.equal(
    headingSlug("Şişli'de Konut Piyasası: 2026"),
    "sisli-de-konut-piyasasi-2026",
  );
  assert.equal(headingSlug("İSTANBUL BOĞAZI"), "istanbul-bogazi");
  assert.equal(
    headingSlug("Kağıthane & Üsküdar, Çifte Havuzlar"),
    "kagithane-uskudar-cifte-havuzlar",
  );
  assert.equal(headingSlug("Café résumé"), "cafe-resume");
  assert.equal(headingSlug("— ? —"), "bolum");
  assert.ok(headingSlug("a ".repeat(80)).length <= 64);
});

test("ARTICLE-TOC: repeated and reserved headings get unique ids", () => {
  const used = new Set<string>();
  assert.equal(uniqueHeadingId("Sonuç", used), "sonuc");
  assert.equal(uniqueHeadingId("Sonuç", used), "sonuc-2");
  assert.equal(uniqueHeadingId("Sonuç", used), "sonuc-3");
  // Ids the page already uses: <main id="main">, source and FAQ anchors.
  assert.equal(uniqueHeadingId("Main", used), "bolum-main");
  assert.equal(uniqueHeadingId("Source 1", used), "bolum-source-1");
  assert.equal(uniqueHeadingId("FAQ 2", used), "bolum-faq-2");
});

test("ARTICLE-TOC: static headings get the ids the table of contents links to", () => {
  const article = staticArticle([
    headingBlock("b1", "h2", "Konum"),
    paragraphBlock("b2", "Birinci paragraf."),
    headingBlock("b3", "h3", "Ulaşım"),
    headingBlock("b4", "h4", "Ayrıntı"),
    headingBlock("b5", "h2", "Konum"),
  ]);
  const outline = getArticleOutline(article.content);
  assert.deepEqual(
    outline.headings.map(({ id, level }) => [id, level]),
    [
      ["konum", 2],
      ["ulasim", 3],
      ["ayrinti", 4],
      ["konum-2", 2],
    ],
  );
  // h4 is anchored but not listed.
  const entries = getTocEntries(outline);
  assert.deepEqual(
    entries.map((entry) => entry.id),
    ["konum", "ulasim", "konum-2"],
  );

  const html = renderToStaticMarkup(
    h(ArticleContent, { article, content: articlePageContent.tr }),
  );
  for (const heading of outline.headings) {
    assert.match(html, new RegExp(`<h${heading.level} id="${heading.id}">`));
  }

  const toc = renderToStaticMarkup(h(ArticleToc, { entries, locale: "tr" }));
  assert.match(
    toc,
    /<nav id="article-toc" aria-labelledby="article-toc-heading"/,
  );
  assert.match(toc, />İçindekiler</);
  for (const entry of entries)
    assert.match(toc, new RegExp(`href="#${entry.id}"`));
});

test("ARTICLE-TOC: Lexical headings get the same ids in the rendered body", () => {
  const data = lexical(
    heading("h2", "Giriş"),
    paragraph(text("Kısa bir giriş metni.")),
    heading("h3", "Veri kaynakları"),
    heading("h2", "Sonuç"),
  );
  const article = lexicalArticle(data);
  const outline = getArticleOutline(article.content);
  assert.deepEqual(
    outline.headings.map((item) => item.id),
    ["giris", "veri-kaynaklari", "sonuc"],
  );

  const html = renderToStaticMarkup(
    h(ArticleContent, { article, content: articlePageContent.tr }),
  );
  assert.match(html, /<h2 id="giris">Giriş<\/h2>/);
  assert.match(html, /<h3 id="veri-kaynaklari">Veri kaynakları<\/h3>/);
  assert.match(html, /<h2 id="sonuc">Sonuç<\/h2>/);

  // Rich text outside an article (page blocks) keeps plain headings.
  assert.ok(isRichTextData(data));
  const plain = renderToStaticMarkup(h(PayloadRichText, { data }));
  assert.match(plain, /<h2>Giriş<\/h2>/);
});

test("ARTICLE-TOC: fewer than three headings show no table of contents", () => {
  const outline = getArticleOutline(
    staticArticle([
      headingBlock("b1", "h2", "Konum"),
      headingBlock("b2", "h4", "Ayrıntı"),
      headingBlock("b3", "h3", "Ulaşım"),
    ]).content,
  );
  assert.deepEqual(getTocEntries(outline), []);
  assert.equal(
    renderToStaticMarkup(h(ArticleToc, { entries: [], locale: "en" })),
    "",
  );
});

test("ARTICLE-TOC: the reading time counts the body text at 200 words a minute", () => {
  assert.equal(readingMinutes(0), null);
  assert.equal(readingMinutes(40), 1);
  assert.equal(readingMinutes(1000), 5);
  assert.equal(readingMinutes(1150), 6);

  const words = Array.from({ length: 1000 }, () => "kelime").join(" ");
  const article = staticArticle([
    headingBlock("b1", "h2", "Başlık"),
    paragraphBlock("b2", words),
    // Punctuation alone is not a word.
    paragraphBlock("b3", "— · —"),
  ]);
  assert.equal(getArticleOutline(article.content).words, 1001);
  const reading = getArticleMetaItems(article).find(
    (item) => item.label === readingTimeCopy.tr.label,
  );
  assert.equal(reading?.value, "5 dk");

  const english = getArticleMetaItems({
    ...article,
    language: "en",
  }).find((item) => item.label === readingTimeCopy.en.label);
  assert.equal(english?.value, "5 min");

  const empty = getArticleMetaItems(lexicalArticle(lexical()));
  assert.ok(
    !empty.some((item) => item.label === readingTimeCopy.tr.label),
    "no reading time without text",
  );
});
