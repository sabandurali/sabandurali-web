import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isValidElement, type ReactElement } from "react";
import { Figure } from "@/components/ui/Figure";
import PageIntro from "@/components/ui/PageIntro";
import { homeContent, type HomeContent } from "@/content/homeContent";
import { homeEditorialContent } from "@/content/homeEditorialContent";
import type { PublicPage } from "@/content/pages/public-types";
import AboutPageContent from "./AboutPageContent";

const source = readFileSync(
  new URL("./AboutPageContent.tsx", import.meta.url),
  "utf8",
);
const route = readFileSync(
  new URL("../../app/(tr)/hakkimda/page.tsx", import.meta.url),
  "utf8",
);

/** Every element in a tree, without rendering function components. */
function elements(node: unknown): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children)];
}

/** Text of the string children in a tree (props other than children skipped). */
function texts(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return texts(node.props.children);
}

/** The served home content as a CMS home page would set it. */
const cms: HomeContent = {
  ...homeContent.tr,
  hero: { ...homeContent.tr.hero, description: "CMS-HERO-DESCRIPTION" },
  about: {
    ...homeContent.tr.about,
    paragraphs: ["CMS-LEAD", "CMS-BIO-1", "CMS-BIO-2"],
    imageAlt: "CMS-ALT",
    imageSrc: "/api/media/file/cms-portrait.jpg",
  },
};

test("ARCHITECTURE-1: /hakkimda reads the served home content, not the static copy", () => {
  assert.match(route, /await getHomeContent\("tr"\)/);
  assert.match(route, /<AboutPage content=\{content\} page=\{page\} \/>/);
  // No second source for the same introduction.
  assert.doesNotMatch(route + source, /homeContent\.tr\b/);
  assert.doesNotMatch(route + source, /import \{[^}]*\bhomeContent\b/);
});

test("ARCHITECTURE-1: the CMS introduction, portrait and hero text reach /hakkimda", () => {
  const tree = AboutPageContent({ content: cms, page: null });
  const all = elements(tree);

  const intro = all.find((element) => element.type === PageIntro);
  assert.equal(intro?.props.lead, "CMS-LEAD");

  const portrait = all.find(
    (element) => element.props.alt === "CMS-ALT" && "src" in element.props,
  );
  assert.equal(portrait?.props.src, "/api/media/file/cms-portrait.jpg");

  const words = texts(tree);
  assert.ok(words.includes("CMS-BIO-1"));
  assert.ok(words.includes("CMS-BIO-2"));
  assert.ok(words.includes("CMS-HERO-DESCRIPTION"));
  for (const paragraph of homeContent.tr.about.paragraphs) {
    assert.ok(!words.includes(paragraph), "no static paragraph remains");
  }
});

test("ARCHITECTURE-1: the static content keeps the site's own portrait", () => {
  const all = elements(
    AboutPageContent({ content: homeContent.tr, page: null }),
  );
  const portrait = all.find(
    (element) => element.props.alt === homeContent.tr.about.imageAlt,
  );
  assert.equal(portrait?.props.src, "/brand/saban-durali-profile.jpg");
  // PERF-2: the above-the-fold portrait is fetched first and never lazily.
  assert.equal(portrait?.props.fetchPriority, "high");
  assert.equal(portrait?.props.loading, "eager");
  assert.equal(portrait?.props.preload, undefined);
  const intro = all.find((element) => element.type === PageIntro);
  assert.equal(intro?.props.lead, homeContent.tr.about.paragraphs[0]);
});

test("ARCHITECTURE-1: the CMS portrait keeps its media credit on /hakkimda", () => {
  // Test fixture only: the credit text is a placeholder, not a real source.
  const page: PublicPage = {
    id: "1",
    title: "Ana sayfa",
    slug: "ana-sayfa",
    language: "tr",
    pageType: "home",
    summary: "",
    publishedAt: "2026-10-01T00:00:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    seo: {
      title: "t",
      description: "d",
      index: true,
      follow: true,
      socialImage: null,
    },
    layout: [
      {
        id: "a",
        visible: true,
        anchor: null,
        blockType: "homeAbout",
        eyebrow: "Hakkımda",
        titleLines: ["Başlık"],
        paragraphs: ["CMS-LEAD"],
        link: null,
        imageAlt: "CMS-ALT",
        image: {
          src: "/api/media/file/cms-portrait.jpg",
          alt: "CMS-ALT",
          credit: "CMS-CREDIT",
        },
      },
    ],
  };
  const figure = elements(AboutPageContent({ content: cms, page })).find(
    (element) => element.type === Figure,
  );
  assert.deepEqual(figure?.props.credit, { collection: "CMS-CREDIT" });

  // The built-in portrait has no recorded source: no credit is invented.
  const staticFigure = elements(
    AboutPageContent({ content: homeContent.tr, page: null }),
  ).find((element) => element.type === Figure);
  assert.equal(staticFigure?.props.credit, null);
});

test("a CMS introduction of one paragraph leaves no empty biography paragraph", () => {
  const single: HomeContent = {
    ...cms,
    about: { ...cms.about, paragraphs: ["CMS-LEAD"] },
  };
  const page: PublicPage | null = null;
  const paragraphs = elements(
    AboutPageContent({ content: single, page }),
  ).filter(
    (element) =>
      element.type === "p" &&
      String(element.props.className).includes("text-on-sea-soft") &&
      texts(element.props.children).length === 0,
  );
  assert.deepEqual(paragraphs, []);
});

/*
 * ARCHITECTURE-8: the About page shows the same manifesto as the home page
 * and takes it from the one content module, so the two never drift apart.
 */
test("ARCHITECTURE-8: the About page reads the manifesto from homeEditorialContent", () => {
  assert.match(
    source,
    /import \{ homeEditorialContent \} from "@\/content\/homeEditorialContent";/,
  );
  assert.match(source, /homeEditorialContent\.tr\.manifestoLines\.map\(/);
});

test("ARCHITECTURE-8: the About page keeps no copy of the manifesto lines", () => {
  assert.ok(homeEditorialContent.tr.manifestoLines.length > 0);
  for (const line of homeEditorialContent.tr.manifestoLines) {
    assert.equal(source.includes(line), false, `"${line}" is duplicated`);
    assert.equal(route.includes(line), false, `"${line}" is duplicated`);
  }
});
