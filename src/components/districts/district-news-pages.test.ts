import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { isDistrictNewsPageIndexable } from "@/content/districts/district-seo";
import {
  createDistrictNewsMetadata,
  getDistrictNewsPagePath,
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
  const robots = (totalItems: number) => {
    const value = createDistrictNewsMetadata(district, {
      currentPage: 1,
      totalItems,
    }).robots;
    return typeof value === "object" && value !== null ? value.index : value;
  };

  assert.equal(robots(0), isDistrictNewsPageIndexable(0));
  assert.equal(robots(0), false);
  assert.equal(robots(1), isDistrictNewsPageIndexable(1));
  assert.equal(robots(1), true);

  // The page served (already clamped by the database read) is canonical.
  const canonical = (currentPage: number) =>
    String(
      createDistrictNewsMetadata(district, { currentPage, totalItems: 25 })
        .alternates?.canonical,
    );
  assert.match(
    canonical(2),
    /\/istanbul\/ilceler\/esenler\/haberler\?sayfa=2$/,
  );
  assert.doesNotMatch(canonical(1), /sayfa/);
});

test("SEO-PERF-2: the news route reads one database page, not the history", () => {
  const source = readFileSync(
    path.join(
      process.cwd(),
      "src/app/(tr)/istanbul/ilceler/[district]/haberler/page.tsx",
    ),
    "utf8",
  );
  const reads = source.match(
    /getDistrictNewsPage\(\s*slug,\s*parseNewsPage\(query\.sayfa\),\s*districtNewsPageSize,\s*\)/g,
  );
  assert.equal(reads?.length, 2, "metadata and page");
  assert.doesNotMatch(source, /getDistrictNews\(|getAllDistrictNews|slice\(/);
});
