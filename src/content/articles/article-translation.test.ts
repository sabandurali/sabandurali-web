import assert from "node:assert/strict";
import test from "node:test";
import {
  heading,
  lexical,
  paragraph,
  text,
} from "../rich-text/lexical-fixtures";
import {
  getLexicalOutline,
  isCompleteTranslation,
  isOfferedArticleVersion,
  isOfferedTranslationPair,
  MIN_TRANSLATION_TEXT_RATIO,
  selectOfferedEnglishArticleIds,
} from "./article-translation";
import type { PublicArticle } from "./public-types";

function isLexicalData(
  value: unknown,
): value is Extract<PublicArticle["content"], { source: "lexical" }>["data"] {
  return typeof value === "object" && value !== null && "root" in value;
}

function version(language: "tr" | "en", data: unknown): PublicArticle {
  return {
    id: "article-1",
    title: "Başlık",
    slug: "baslik",
    language,
    translationKey: "article-1",
    summary: "Özet",
    content: { source: "lexical", data: isLexicalData(data) ? data : null },
    categories: [],
    featuredImage: null,
    featured: false,
    articleType: "article",
    district: null,
    districtNeighborhood: null,
    newsCategory: null,
    externalSource: null,
    publishedAt: "2026-10-01T00:00:00Z",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    seo: { title: "Başlık", description: "Özet", index: true, follow: true },
  };
}

const words = (count: number) =>
  Array.from({ length: count }, () => "kelime").join(" ");

const turkish = lexical(
  heading("h2", "Konum"),
  paragraph(text(words(60))),
  heading("h2", "Hukuk"),
  paragraph(text(words(60))),
  heading("h3", "Belgeler"),
  paragraph(text(words(30))),
);

test("the outline counts headings and text in nested nodes", () => {
  const outline = getLexicalOutline(turkish);

  assert.equal(outline.headings, 3);
  assert.equal(
    outline.textLength,
    "Konum".length +
      "Hukuk".length +
      "Belgeler".length +
      words(60).length * 2 +
      words(30).length,
  );
  assert.deepEqual(getLexicalOutline(null), { headings: 0, textLength: 0 });
});

test("a half-finished translation (title, summary and one paragraph) is incomplete", () => {
  assert.equal(
    isCompleteTranslation(turkish, lexical(paragraph(text(words(20))))),
    false,
  );
});

test("a translation that drops the last section is incomplete", () => {
  const firstTwoSections = lexical(
    heading("h2", "Location"),
    paragraph(text(words(60))),
    heading("h2", "Legal"),
    paragraph(text(words(60))),
  );

  assert.equal(isCompleteTranslation(turkish, firstTwoSections), false);
});

test("a full translation with normal length variation is complete", () => {
  const english = lexical(
    heading("h2", "Location"),
    paragraph(text(words(45))),
    heading("h2", "Legal checks"),
    paragraph(text(words(45))),
    heading("h3", "Documents"),
    paragraph(text(words(25))),
  );

  assert.equal(isCompleteTranslation(turkish, english), true);
});

test("the length threshold is a ratio of the Turkish text", () => {
  const source = lexical(paragraph(text("x".repeat(100))));

  assert.equal(MIN_TRANSLATION_TEXT_RATIO, 0.6);
  assert.equal(
    isCompleteTranslation(source, lexical(paragraph(text("y".repeat(60))))),
    true,
  );
  assert.equal(
    isCompleteTranslation(source, lexical(paragraph(text("y".repeat(59))))),
    false,
  );
});

test("without Turkish text there is nothing to compare against", () => {
  assert.equal(
    isCompleteTranslation(null, lexical(paragraph(text("Only English")))),
    true,
  );
  assert.equal(
    isCompleteTranslation(lexical(paragraph(text("  "))), null),
    true,
  );
});

test("only English versions are checked and rejections are logged", (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const half = lexical(paragraph(text(words(5))));

  assert.equal(isOfferedArticleVersion(version("tr", half), turkish), true);
  assert.equal(isOfferedArticleVersion(version("en", half), turkish), false);
  assert.equal(warn.mock.callCount(), 1);
  assert.match(
    String(warn.mock.calls[0]?.arguments[0]),
    /"scope":"articles","id":"article-1","locale":"en"/,
  );
});

test("article pages apply the rule to the loaded pair", (t) => {
  t.mock.method(console, "warn", () => {});
  const english = version("en", lexical(paragraph(text(words(5)))));

  assert.equal(isOfferedTranslationPair(english, null), true);
  assert.equal(
    isOfferedTranslationPair(english, version("tr", turkish)),
    false,
  );
  assert.equal(
    isOfferedTranslationPair(version("en", turkish), version("tr", turkish)),
    true,
  );
});

test("internal links only target English versions that cover their Turkish source", () => {
  const complete = lexical(
    heading("h2", "Location"),
    paragraph(text(words(60))),
    heading("h2", "Legal"),
    paragraph(text(words(60))),
    heading("h3", "Documents"),
    paragraph(text(words(30))),
  );
  const halfFinished = lexical(paragraph(text(words(20))));

  assert.deepEqual(
    [
      ...selectOfferedEnglishArticleIds(
        new Map<string, unknown>([
          ["complete", complete],
          ["half", halfFinished],
          ["unreadable", complete],
        ]),
        new Map<string, unknown>([
          ["complete", turkish],
          ["half", turkish],
        ]),
      ),
    ],
    ["complete"],
  );
});
