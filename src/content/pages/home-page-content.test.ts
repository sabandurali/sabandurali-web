import assert from "node:assert/strict";
import test from "node:test";
import { homeContent } from "../homeContent";
import { getPayloadHomeContent, resolveHomeContent } from "./home-page-content";
import type { PublicPage, PublicPageBlock } from "./public-types";

const base = { visible: true, anchor: null };

const completeLayout: PublicPageBlock[] = [
  {
    ...base,
    id: "hero",
    blockType: "hero",
    eyebrow: "CMS eyebrow",
    titleLines: [{ text: "CMS başlık", accent: false }],
    description: "CMS açıklama",
    primaryAction: { label: "Birincil", href: "/makaleler" },
    secondaryAction: { label: "İkincil", href: "/iletisim" },
    highlights: [],
  },
  {
    ...base,
    id: "about",
    blockType: "homeAbout",
    eyebrow: "Hakkımda",
    titleLines: ["Satır"],
    paragraphs: ["Paragraf"],
    link: null,
    image: null,
    imageAlt: "Portre",
  },
  {
    ...base,
    id: "focus",
    blockType: "homeFocusAreas",
    eyebrow: "Odak",
    title: "Odak alanları",
    description: null,
    cards: [
      {
        id: "card",
        icon: "city",
        title: "Şehir",
        description: "Açıklama",
        linkLabel: "Aç",
        linkHref: "/istanbul/ilceler",
      },
    ],
  },
];

function homePage(
  language: "tr" | "en",
  layout: PublicPageBlock[] = completeLayout,
): PublicPage {
  return {
    id: `home-${language}`,
    title: "Ana Sayfa",
    slug: "ana-sayfa",
    language,
    pageType: "home",
    summary: "Özet",
    layout,
    publishedAt: "2026-10-01T00:00:00Z",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    seo: {
      title: "SEO",
      description: "SEO açıklama",
      index: true,
      follow: true,
      socialImage: null,
    },
  };
}

test("the static source serves the static home content without logging", (t) => {
  const error = t.mock.method(console, "error", () => {});
  const resolved = resolveHomeContent(
    { source: "static", page: null },
    homeContent.tr,
  );

  assert.equal(resolved.content, homeContent.tr);
  assert.equal(resolved.page, null);
  assert.equal(error.mock.callCount(), 0);
});

for (const locale of ["tr", "en"] as const) {
  test(`${locale}: a missing CMS home page falls back instead of 404`, (t) => {
    const error = t.mock.method(console, "error", () => {});
    const resolved = resolveHomeContent(
      { source: "payload", page: null },
      homeContent[locale],
    );

    assert.equal(resolved.content, homeContent[locale]);
    assert.equal(resolved.page, null);
    assert.equal(error.mock.callCount(), 1);
    assert.match(String(error.mock.calls[0]?.arguments[0]), /"scope":"home"/);
  });

  test(`${locale}: incomplete CMS blocks fall back to static content`, (t) => {
    const error = t.mock.method(console, "error", () => {});
    // A dropped about block (for example a half-filled link) leaves 2 of 3.
    const page = homePage(
      locale,
      completeLayout.filter((block) => block.blockType !== "homeAbout"),
    );
    const resolved = resolveHomeContent(
      { source: "payload", page },
      homeContent[locale],
    );

    assert.equal(resolved.content, homeContent[locale]);
    assert.equal(resolved.page, null);
    assert.equal(error.mock.callCount(), 1);
  });

  test(`${locale}: a complete CMS home page is used`, () => {
    const page = homePage(locale);
    const resolved = resolveHomeContent(
      { source: "payload", page },
      homeContent[locale],
    );

    assert.equal(resolved.page, page);
    assert.equal(resolved.content.hero.description, "CMS açıklama");
    assert.equal(resolved.content.about.label, "Hakkımda");
    assert.equal(resolved.content.focusAreas.title, "Odak alanları");
    // Highlights fall back to the static goals when the CMS has none.
    assert.deepEqual(
      resolved.content.hero.goals,
      homeContent[locale].hero.goals,
    );
  });
}

test("hidden blocks and a wrong locale are rejected", () => {
  const hidden = completeLayout.map((block) =>
    block.blockType === "hero" ? { ...block, visible: false } : block,
  );

  assert.equal(
    getPayloadHomeContent(homePage("tr", hidden), homeContent.tr),
    null,
  );
  assert.equal(getPayloadHomeContent(homePage("en"), homeContent.tr), null);
});
