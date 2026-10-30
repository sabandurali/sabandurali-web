import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  excerpt,
  homeListLimits,
  pickFeaturedDistrict,
} from "./home-selection";

test("SEO-PERF-1: the home page reads its lists with database limits", () => {
  // HomePage.tsx loads server-only data sources, so the wiring is checked
  // in the source: the limited reads, never a whole collection.
  const source = readFileSync(
    path.join(process.cwd(), "src/components/HomePage.tsx"),
    "utf8",
  );
  assert.match(
    source,
    /getLatestPublishedArticles\(locale, homeListLimits\.articles\)/,
  );
  assert.match(
    source,
    /getLatestPublishedBookReviews\(locale, homeListLimits\.books\)/,
  );
  assert.match(source, /getHomePagePhotos\(locale, homeListLimits\.photos\)/);
  assert.doesNotMatch(source, /getAllPublished/);
  assert.deepEqual(homeListLimits, { articles: 3, books: 3, photos: 4 });
});

test("pickFeaturedDistrict prefers a published guide with a verified photo", () => {
  const summaries = new Map([
    ["arnavutkoy", "Arnavutköy özeti."],
    ["esenler", "Esenler özeti."],
    ["kadikoy", "Kadıköy özeti."],
  ]);
  const withImage = new Set(["esenler", "kadikoy"]);

  const picked = pickFeaturedDistrict(summaries, (slug) => withImage.has(slug));
  assert.ok(picked === "esenler" || picked === "kadikoy");
  // Stable: the same input gives the same district, whatever the map order.
  const reversed = new Map([...summaries.entries()].reverse());
  assert.equal(
    pickFeaturedDistrict(reversed, (slug) => withImage.has(slug)),
    picked,
  );
});

test("pickFeaturedDistrict ignores unknown districts and empty summaries", () => {
  assert.equal(
    pickFeaturedDistrict(new Map(), () => true),
    null,
  );
  assert.equal(
    pickFeaturedDistrict(
      new Map([
        ["atlantis", "Bilinmeyen."],
        ["esenler", "   "],
      ]),
      () => true,
    ),
    null,
  );
  assert.equal(
    pickFeaturedDistrict(new Map([["sisli", "Şişli özeti."]]), () => false),
    "sisli",
  );
});

test("excerpt keeps whole words and marks a cut with an ellipsis", () => {
  assert.equal(excerpt("  Kısa   metin. "), "Kısa metin.");
  const long =
    "İstanbul’un kuzeybatısında, Karadeniz kıyısından göle uzanan ilçe";
  const cut = excerpt(long, 30);
  assert.ok(cut.length <= 30);
  assert.ok(cut.endsWith("…"));
  assert.ok(long.startsWith(cut.slice(0, -1)));
  assert.doesNotMatch(cut, /,…$/);
});
