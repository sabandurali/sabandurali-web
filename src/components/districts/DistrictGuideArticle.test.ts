import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import type { DistrictSource } from "@/content/districts/district-content-policy";
import { mapDistrictGuide } from "@/content/districts/district-guide-projection";
import { getDistrict } from "@/content/districts/district-registry";
import DistrictGuideArticle, {
  type DistrictGuideArticleProps,
} from "./DistrictGuideArticle";

const district = getDistrict("esenler");
assert.ok(district);
const now = Date.parse("2026-10-01T12:00:00Z");

const allSections: DistrictSource["sections"] = [
  "summary",
  "history",
  "geography",
  "life",
  "transportation",
  "facts",
  "neighborhoods",
  "housingTexture",
  "regionalAssessment",
  "placesGuide",
  "distinctiveFeatures",
  "researchTopics",
];
const sources: DistrictSource[] = [
  {
    title: "Esenler — Tarihçe",
    publisher: "T.C. Esenler Kaymakamlığı",
    url: "https://www.esenler.gov.tr/tarihce",
    sourceType: "official",
    primary: true,
    dataDate: "2026-09-01T00:00:00Z",
    checkedAt: "2026-09-27T00:00:00Z",
    needsVerification: false,
    sections: allSections,
  },
];
const guide = mapDistrictGuide(
  {
    _status: "published",
    publishedAt: "2026-09-13T10:00:00Z",
    reviewedSections: allSections,
    sources,
    summary: "Doğrulanmış özet.",
    history: "Birinci paragraf.\n\nİkinci paragraf.",
    geography: "Doğrulanmış coğrafya.",
    life: "Doğrulanmış yaşam.",
    transportation: "İlçeyi M1B ve M7 hatları bağlar.",
    facts: {
      population: "419878",
      populationYear: 2025,
      areaKm2: 18.43,
      neighborhoodCount: 2,
      neighboringDistricts: "Bağcılar ve Güngören",
    },
    neighborhoods: [{ name: "Birlik" }, { name: "Tuna" }],
    housingTexture: "Doğrulanmış yapı dokusu.",
    placesGuide: "Doğrulanmış yerler.",
    distinctiveFeatures: "Doğrulanmış özellikler.",
    updatedAt: "2026-09-27T11:00:00Z",
    researchNotes: "PRIVATE-METADATA-MUST-NOT-LEAK",
  },
  now,
);
assert.ok(guide);

const article: PublicArticleSummary = {
  id: "a1",
  title: "Esenler araştırması",
  slug: "esenler-arastirmasi",
  language: "tr",
  translationKey: null,
  summary: "Özet.",
  categories: [],
  featuredImage: null,
  featured: false,
  articleType: "district-research",
  district: "esenler",
  districtNeighborhood: null,
  newsCategory: null,
  externalSource: null,
  publishedAt: "2026-09-01T00:00:00Z",
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
  seo: { title: "", description: "", index: true, follow: true },
};

function render(data: Partial<DistrictGuideArticleProps["data"]>) {
  return renderToStaticMarkup(
    h(DistrictGuideArticle, {
      district: district!,
      data: {
        guide: null,
        photos: [],
        research: [],
        news: [],
        unavailableSections: [],
        ...data,
      },
    }),
  );
}

const sectionIds = (html: string) =>
  [...html.matchAll(/<section id="([^"]+)"/g)].map((match) => match[1]);

test("an empty guide renders the twelve fixed sections with empty states", () => {
  const html = render({});
  assert.deepEqual(sectionIds(html), [
    "genel-bakis",
    "tarihce",
    "tani",
    "yasam",
    "mahalleler",
    "gayrimenkul",
    "imar",
    "saha",
    "kareler",
    "kimlik",
    "kaynaklar",
    "guncelleme",
  ]);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /Bu ilçeden seçilmiş fotoğraflar henüz eklenmedi/);
  assert.match(html, /henüz yayımlanmadı/);
  assert.ok(!html.includes('href="#arastirmalar"'));
  assert.ok(!html.includes('href="#haberler"'));
  assert.ok(!html.includes("Ortalama m² satış fiyatı"));
});

test("a published guide renders facts, numbered sources and line chips", () => {
  const html = render({ guide });
  assert.ok(!html.includes("PRIVATE-METADATA-MUST-NOT-LEAK"));
  assert.match(html, /419\.878/);
  assert.match(html, /18,43/);
  assert.match(html, /M1B/);
  assert.match(html, /M7/);
  assert.match(html, /<ol[^>]*>[\s\S]*Birlik[\s\S]*Tuna[\s\S]*<\/ol>/);
  // Every source reference points at a row of the source list.
  const anchors = new Set(
    [...html.matchAll(/id="(kaynak-\d+)"/g)].map((match) => match[1]),
  );
  const refs = [...html.matchAll(/href="#(kaynak-\d+)"/g)].map(
    (match) => match[1],
  );
  assert.ok(refs.length > 0);
  for (const ref of refs) assert.ok(anchors.has(ref), ref);
  assert.match(html, /Son kontrol/);
  assert.match(
    html,
    /İçerik güncellemesi: <time dateTime="2026-09-27T11:00:00.000Z">/,
  );
});

test("research and news appear with items, or when their query failed", () => {
  const withResearch = render({ guide, research: [article] });
  assert.ok(sectionIds(withResearch).includes("arastirmalar"));
  assert.match(withResearch, /href="\/makaleler\/esenler-arastirmasi"/);

  const failed = render({
    guide,
    unavailableSections: ["photos", "news"],
  });
  assert.ok(sectionIds(failed).includes("haberler"));
  assert.ok(!sectionIds(failed).includes("arastirmalar"));
  assert.match(failed, /Fotoğraflar geçici olarak yüklenemedi/);
  assert.match(failed, /Haberler geçici olarak yüklenemedi/);
});

test("the Kadıköy page shows no figure the guide projection does not carry", () => {
  // Every number and date on a district page comes from the policy-checked
  // projection. A figure written into the component would bypass
  // district-content-policy.ts and stay on the page after the CMS changed.
  const kadikoy = getDistrict("kadikoy");
  assert.ok(kadikoy);
  const html = renderToStaticMarkup(
    h(DistrictGuideArticle, {
      district: kadikoy,
      data: {
        guide,
        photos: [],
        research: [],
        news: [],
        unavailableSections: [],
      },
    }),
  );
  assert.doesNotMatch(html, /458\.573/);
  assert.doesNotMatch(html, /ADNKS nüfusu/);
  assert.doesNotMatch(html, /kadikoyakademi\.org/);
  assert.doesNotMatch(html, /18 Ekim 2026/);
  // The only population figure is the one of the projected guide.
  assert.match(html, /419\.878/);
});

test("the guide article never branches on a district slug literal", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const file of [
    "./DistrictGuideArticle.tsx",
    "./district-guide-sections.tsx",
    "./district-guide-parts.tsx",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /slug\s*===\s*["']/, file);
  }
});

test("prose paragraphs are spaced by the container gap, not by margins", () => {
  const html = render({ guide });
  // history: "Birinci paragraf.\n\nİkinci paragraf." — two paragraphs in one
  // stack. A `space-y-*` rule loses to the paragraphs' `m-0` in Tailwind 4,
  // so the stack must carry the gap itself.
  const stack =
    /<div class="([^"]*)"><p class="m-0 whitespace-pre-line">Birinci paragraf\.<\/p><p class="m-0 whitespace-pre-line">İkinci paragraf\.<\/p><\/div>/.exec(
      html,
    );
  assert.ok(stack, "history paragraphs render as one stack");
  const classes = (stack[1] ?? "").split(/\s+/);
  assert.ok(classes.includes("grid"), stack[1]);
  assert.ok(classes.includes("gap-5"), stack[1]);
  assert.ok(!classes.some((name) => name.startsWith("space-y-")), stack[1]);
});

test("the breadcrumb names the workspace page it links to", () => {
  const html = render({});
  const crumb =
    /<a [^>]*href="\/gayrimenkul-ve-istanbul"[^>]*>([^<]+)<\/a>/.exec(html);
  assert.ok(crumb);
  // Same target, same name as the header navigation and the page's h1
  // (WCAG 3.2.4).
  assert.equal(crumb[1], "Gayrimenkul &amp; İstanbul");
});

test("a scheduled guide's update line shows its publication, like the JSON-LD", () => {
  // Saved on 1 October, scheduled for 10 October: the visible line must not
  // report a change before the page existed (getContentLastModifiedIso).
  const scheduled = mapDistrictGuide(
    {
      _status: "published",
      publishedAt: "2026-10-10T07:00:00Z",
      reviewedSections: allSections,
      sources,
      summary: "Doğrulanmış özet.",
      updatedAt: "2026-10-01T09:00:00Z",
    },
    Date.parse("2026-10-12T12:00:00Z"),
  );
  assert.ok(scheduled);
  const html = render({ guide: scheduled });
  assert.match(
    html,
    /İçerik güncellemesi: <time dateTime="2026-10-10T07:00:00.000Z">/,
  );
  assert.doesNotMatch(html, /dateTime="2026-10-01T09:00:00.000Z"/);
});
