import assert from "node:assert/strict";
import test from "node:test";
import { isDistrictNewsPageIndexable } from "@/content/districts/district-seo";
import {
  createDistrictNewsMetadata,
  getDistrictNewsPagePath,
  paginateDistrictNews,
  parseNewsPage,
} from "./district-news-pages";

test("the sayfa query is a positive integer or page 1", () => {
  assert.equal(parseNewsPage(undefined), 1);
  assert.equal(parseNewsPage("3"), 3);
  assert.equal(parseNewsPage(["2", "5"]), 2);
  for (const value of ["0", "-1", "1.5", "2abc", "", "1e3", "9".repeat(20)]) {
    assert.equal(parseNewsPage(value), 1, value);
  }
});

test("pages are clamped to the existing range", () => {
  const items = Array.from({ length: 25 }, (_, index) => index);
  assert.deepEqual(paginateDistrictNews(items, 1).items, items.slice(0, 12));
  assert.deepEqual(paginateDistrictNews(items, 3), {
    items: [24],
    currentPage: 3,
    totalPages: 3,
  });
  assert.equal(paginateDistrictNews(items, 99).currentPage, 3);
  assert.deepEqual(paginateDistrictNews([], 4), {
    items: [],
    currentPage: 1,
    totalPages: 1,
  });
});

test("page 1 of the news list has no query, later pages carry sayfa", () => {
  assert.equal(
    getDistrictNewsPagePath("esenler", 1),
    "/istanbul/ilceler/esenler/haberler",
  );
  assert.equal(
    getDistrictNewsPagePath("esenler", 3),
    "/istanbul/ilceler/esenler/haberler?sayfa=3",
  );
});

test("SEO-PERF-3: news page robots and canonical follow the sitemap rule", () => {
  const district = { slug: "esenler", name: "Esenler" };
  const robots = (news: readonly unknown[]) => {
    const value = createDistrictNewsMetadata(district, news, 1).robots;
    return typeof value === "object" && value !== null ? value.index : value;
  };

  assert.equal(robots([]), isDistrictNewsPageIndexable([]));
  assert.equal(robots([]), false);
  assert.equal(robots([{}]), isDistrictNewsPageIndexable([{}]));
  assert.equal(robots([{}]), true);

  const news = Array.from({ length: 25 }, () => ({}));
  const canonical = (page: number) =>
    String(
      createDistrictNewsMetadata(district, news, page).alternates?.canonical,
    );
  assert.match(
    canonical(2),
    /\/istanbul\/ilceler\/esenler\/haberler\?sayfa=2$/,
  );
  // A page past the end is clamped to the last one.
  assert.match(canonical(9), /\?sayfa=3$/);
  assert.doesNotMatch(canonical(1), /sayfa/);
});
