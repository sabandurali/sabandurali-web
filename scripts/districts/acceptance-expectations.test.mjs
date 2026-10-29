import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeAttribute,
  expectedSectionIds,
  expectsIndexedGuides,
  guideSections,
  localImageUrl,
  robotsProblem,
  sitemapListsDistrict,
  withoutSoftHyphens,
} from "./acceptance-expectations.mjs";

test("conditional sections are expected only when the page rendered them", () => {
  const fixed = guideSections.filter(
    (id) => id !== "arastirmalar" && id !== "haberler",
  );
  assert.deepEqual(expectedSectionIds(fixed), fixed);
  assert.deepEqual(expectedSectionIds(guideSections), guideSections);
  assert.equal(expectedSectionIds(["haberler"]).length, 13);
});

test("static builds expect noindex, follow; editorial builds expect indexing", () => {
  assert.equal(expectsIndexedGuides({}), false);
  assert.equal(expectsIndexedGuides({ DISTRICT_EXPECT_EDITORIAL: "1" }), true);
  assert.equal(robotsProblem("noindex, follow", false), null);
  assert.equal(robotsProblem("index, follow", true), null);
  assert.match(robotsProblem("index, follow", false), /noindex, follow/);
  assert.match(robotsProblem("noindex, follow", true), /indexable/);
  assert.match(robotsProblem("noindex, nofollow", false), /nofollow/);
  assert.match(robotsProblem(null, false), /noindex, follow/);
});

test("the og:image keeps its query string and decodes &amp;", () => {
  const og =
    "https://www.sabandurali.com/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fx.jpg&amp;w=1200&amp;q=75";
  assert.equal(
    localImageUrl("http://127.0.0.1:3017", og),
    "http://127.0.0.1:3017/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fx.jpg&w=1200&q=75",
  );
  assert.equal(
    localImageUrl(
      "http://localhost:3017",
      "https://www.sabandurali.com/brand/og.jpg",
    ),
    "http://localhost:3017/brand/og.jpg",
  );
  assert.equal(decodeAttribute("a&amp;b&quot;"), 'a&b"');
});

test("sitemap and title helpers", () => {
  const xml =
    "<url><loc>https://www.sabandurali.com/istanbul/ilceler/esenler</loc></url>";
  assert.equal(sitemapListsDistrict(xml, "esenler"), true);
  assert.equal(sitemapListsDistrict(xml, "esen"), false);
  assert.equal(withoutSoftHyphens("Gazi­osman­paşa"), "Gaziosmanpaşa");
});
