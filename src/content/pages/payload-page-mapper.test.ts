import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { Page as PayloadPage } from "../../payload-types";
import {
  lexical,
  link,
  mediaDocument,
  paragraph,
  text,
} from "../rich-text/lexical-fixtures";
import { mapPayloadPage } from "./payload-page-mapper";

const now = new Date("2026-10-28T12:00:00Z");

const hero = {
  blockType: "hero",
  id: "hero-1",
  titleLines: [{ text: "Başlık" }],
  description: "Açıklama",
  primaryAction: { label: "Makaleler", href: "/makaleler" },
  secondaryAction: { label: "İletişim", href: "/iletisim" },
};

const about = {
  blockType: "homeAbout",
  id: "about-1",
  eyebrow: "Hakkımda",
  titleLines: [{ text: "Satır" }],
  paragraphs: [{ text: "Paragraf" }],
  link: { label: "", href: "" },
  image: mediaDocument,
  imageAlt: "Portre",
};

// Loose block fixtures with a cast keep compiling when the schema grows.
function page(
  layout: unknown[],
  overrides: Record<string, unknown> = {},
): PayloadPage {
  return {
    id: "page-1",
    title: "Ana Sayfa",
    slug: "ana-sayfa",
    language: "tr",
    pageType: "home",
    summary: "Özet",
    layout,
    publishedAt: "2026-10-01T00:00:00Z",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-02T00:00:00Z",
    _status: "published",
    ...overrides,
  } as PayloadPage;
}

function silence(t: TestContext) {
  return t.mock.method(console, "warn", () => {});
}

test("published pages map their blocks and images with caption and credit", (t) => {
  silence(t);
  const mapped = mapPayloadPage(page([hero, about]), "tr", now);

  assert.ok(mapped);
  assert.deepEqual(
    mapped.layout.map((block) => block.blockType),
    ["hero", "homeAbout"],
  );
  const aboutBlock = mapped.layout[1];
  assert.ok(aboutBlock?.blockType === "homeAbout");
  assert.equal(aboutBlock.link, null);
  assert.deepEqual(aboutBlock.image, {
    src: mediaDocument.url,
    alt: "Portre",
    width: 1600,
    height: 900,
    caption: mediaDocument.description,
    credit: mediaDocument.sourceCopyright,
  });
  assert.equal(mapped.seo.socialImage, null);
});

test("an English page keeps credits but not the Turkish media caption", (t) => {
  silence(t);
  const mapped = mapPayloadPage(
    page([about], { language: "en", slug: "home" }),
    "en",
    now,
  );
  const block = mapped?.layout[0];

  assert.ok(block?.blockType === "homeAbout");
  assert.equal(block.image?.credit, mediaDocument.sourceCopyright);
  assert.equal(block.image?.caption, undefined);
});

test("a half-filled optional link or a PDF portrait drops the block and logs it", (t) => {
  const warn = silence(t);
  const mapped = mapPayloadPage(
    page([
      hero,
      { ...about, link: { label: "Devamı", href: "" } },
      {
        ...about,
        id: "about-2",
        image: { ...mediaDocument, mimeType: "application/pdf" },
      },
    ]),
    "tr",
    now,
  );

  assert.deepEqual(
    mapped?.layout.map((block) => block.blockType),
    ["hero"],
  );
  assert.equal(warn.mock.callCount(), 2);
  assert.match(
    String(warn.mock.calls[0]?.arguments[0]),
    /"detail":"homeAbout#2"/,
  );
  assert.match(
    String(warn.mock.calls[1]?.arguments[0]),
    /"detail":"homeAbout#3"/,
  );
});

test("drafts, scheduled pages and pages of another language are not public", (t) => {
  silence(t);
  assert.equal(
    mapPayloadPage(page([hero], { _status: "draft" }), "tr", now),
    null,
  );
  assert.equal(
    mapPayloadPage(
      page([hero], { publishedAt: "2026-12-01T00:00:00Z" }),
      "tr",
      now,
    ),
    null,
  );
  assert.equal(
    mapPayloadPage(page([hero], { publishedAt: null }), "tr", now),
    null,
  );
  assert.equal(mapPayloadPage(page([hero]), "en", now), null);
  assert.equal(mapPayloadPage(page([hero], { summary: " " }), "tr", now), null);
});

test("rich text blocks resolve internal links for the page language", (t) => {
  silence(t);
  const mapped = mapPayloadPage(
    page(
      [
        {
          blockType: "richText",
          id: "rt",
          content: lexical(
            paragraph(
              text("Bakınız: "),
              link({
                linkType: "internal",
                newTab: false,
                doc: {
                  relationTo: "pages",
                  value: {
                    id: "p2",
                    slug: "biyografi-detay",
                    language: "tr",
                    pageType: "standard",
                    _status: "published",
                    publishedAt: "2026-09-01T00:00:00Z",
                  },
                },
              }),
            ),
          ),
        },
      ],
      { pageType: "standard", slug: "kaynaklar" },
    ),
    "tr",
    now,
  );
  const block = mapped?.layout[0];

  assert.ok(block?.blockType === "richText");
  assert.ok(JSON.stringify(block.content).includes('"url":"/biyografi-detay"'));
});
