import assert from "node:assert/strict";
import test from "node:test";
import {
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
