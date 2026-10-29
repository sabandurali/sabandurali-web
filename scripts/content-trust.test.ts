import assert from "node:assert/strict";
import { test } from "node:test";
import { districts } from "../src/content/districts/district-registry";
import { districtMetadata } from "../src/content/districts/district-seo";
import { formatDistrictNumber } from "../src/content/districts/district-presentation";
import { getDistrict } from "../src/content/districts/district-registry";
import type {
  DistrictArticleType,
  PublicArticleSummary,
} from "../src/content/articles/public-types";
import DistrictGuideArticle, {
  type DistrictGuideArticleProps,
} from "../src/components/districts/DistrictGuideArticle";
import {
  expectedSectionIds,
  guideSections,
} from "./districts/acceptance-expectations.mjs";
import { experience, education } from "../src/content/biography";
import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("39 district metadata: unique, complete, canonical, OG, Twitter, no fictitious EN", () => {
  assert.equal(districts.length, 39);
  const titles = new Set();
  for (const district of districts) {
    const metadata = districtMetadata(district, null);
    titles.add(metadata.title);
    assert.ok(metadata.description?.includes(district.name));
    assert.ok(!metadata.description?.endsWith("…"));
    assert.equal(
      metadata.alternates?.canonical,
      `https://www.sabandurali.com/istanbul/ilceler/${district.slug}`,
    );
    assert.deepEqual(Object.keys(metadata.alternates?.languages ?? {}), [
      "tr-TR",
    ]);
    assert.ok(metadata.openGraph?.images);
    assert.ok(metadata.twitter && "card" in metadata.twitter);
    assert.equal(metadata.twitter.card, "summary_large_image");
  }
  assert.equal(titles.size, 39);
});
test("presentation preserves data, years and localized decimals", () => {
  assert.equal(formatDistrictNumber("458573"), "458.573");
  assert.equal(formatDistrictNumber(25.09), "25,09");
  assert.equal(formatDistrictNumber("458.573"), "458.573");
  assert.equal(formatDistrictNumber(null), null);
  const bundle = JSON.parse(
    readFileSync("data/districts/editorial.json", "utf8"),
  );
  assert.equal(bundle.districts.length, 39);
  assert.equal(
    bundle.districts.find((d: { district: string }) => d.district === "kadikoy")
      .facts.population,
    "458573",
  );
});
// The section contract (docs/PROJECT-STATE.md §H) is checked on the real
// render path: DistrictGuideArticle, which the district page uses, for every
// state of the two conditional sections (published items, nothing
// published, query failed).
function districtArticle(articleType: DistrictArticleType, slug: string) {
  const item: PublicArticleSummary = {
    id: slug,
    title: slug,
    slug,
    language: "tr",
    translationKey: null,
    summary: "Özet.",
    categories: [],
    featuredImage: null,
    featured: false,
    articleType,
    district: "esenler",
    districtNeighborhood: null,
    newsCategory: null,
    externalSource: null,
    publishedAt: "2026-09-01T00:00:00Z",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    seo: { title: "", description: "", index: true, follow: true },
  };
  return item;
}

type ConditionalState = "published" | "empty" | "unavailable";
const states: ConditionalState[] = ["published", "empty", "unavailable"];

function renderGuide(research: ConditionalState, news: ConditionalState) {
  const district = getDistrict("esenler");
  assert.ok(district);
  const unavailableSections: DistrictGuideArticleProps["data"]["unavailableSections"] =
    [];
  if (research === "unavailable") unavailableSections.push("research");
  if (news === "unavailable") unavailableSections.push("news");
  return renderToStaticMarkup(
    h(DistrictGuideArticle, {
      district,
      data: {
        guide: null,
        photos: [],
        research:
          research === "published"
            ? [districtArticle("district-research", "esenler-arastirmasi")]
            : [],
        news:
          news === "published"
            ? [districtArticle("district-news", "esenler-haberi")]
            : [],
        unavailableSections,
      },
    }),
  );
}

test("every research/news state renders the §H contract, numbered consecutively", () => {
  assert.equal(guideSections.length, 14);
  for (const research of states)
    for (const news of states) {
      const html = renderGuide(research, news);
      const ids = [...html.matchAll(/<section id="([^"]+)"/g)].map(
        (match) => match[1],
      );
      const label = `research=${research}, news=${news}`;
      assert.deepEqual(ids, expectedSectionIds(ids), label);
      // An empty section disappears; a failed query keeps the section and
      // says it is temporarily unavailable.
      assert.equal(ids.includes("arastirmalar"), research !== "empty", label);
      assert.equal(ids.includes("haberler"), news !== "empty", label);
      assert.equal(
        html.includes('href="#arastirmalar"'),
        research !== "empty",
        label,
      );
      assert.equal(html.includes('href="#haberler"'), news !== "empty", label);
      const signs = [...html.matchAll(/Bölüm (\d+), (\d+) bölümden/g)].map(
        (match) => [Number(match[1]), Number(match[2])],
      );
      assert.deepEqual(
        signs,
        ids.map((_, index) => [index + 1, ids.length]),
        label,
      );
    }
});
test("user CV preserves eleven roles and ongoing education", () => {
  assert.equal(experience.length, 11);
  assert.match(education[0].description, /devam ediyor/);
});
