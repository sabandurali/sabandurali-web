import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PUBLIC_DISTRICT_GUIDE_QUERY_PATHS } from "../../collections/DistrictGuides";
import { collectWherePaths } from "../../lib/payloadAccess";
import {
  DISTRICT_GUIDE_SORT,
  publishedDistrictGuidesWhere,
} from "./district-guide-queries";

const allowed: ReadonlySet<string> = new Set(PUBLIC_DISTRICT_GUIDE_QUERY_PATHS);
const contentDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
      ? [full]
      : [];
  });
}

test("district-guides queries only filter and sort on public paths", () => {
  const now = new Date("2026-10-29T12:00:00Z");
  const paths = [
    ...collectWherePaths(publishedDistrictGuidesWhere(now)),
    ...collectWherePaths(publishedDistrictGuidesWhere(now, "esenler")),
    DISTRICT_GUIDE_SORT.replace(/^-/, ""),
  ];

  assert.ok(paths.includes("district"));
  for (const queryPath of paths) {
    assert.ok(allowed.has(queryPath), `${queryPath} is not a public path`);
  }
});

test("every district-guides query in the content layer uses those builders", () => {
  const queries = sourceFiles(contentDirectory).flatMap((file) => {
    const source = readFileSync(file, "utf8");
    const count = source.match(/collection:\s*"district-guides"/g)?.length ?? 0;
    return count === 0 ? [] : [{ file, source, count }];
  });

  assert.deepEqual(
    queries.map(({ file }) => path.relative(contentDirectory, file)),
    [path.join("districts", "payload-district-guide-repository.ts")],
    "a new district-guides query must use district-guide-queries.ts",
  );

  for (const { source, count } of queries) {
    // One builder call per query, and no inline `where` or `sort` literals.
    assert.equal(
      source.match(/where: publishedDistrictGuidesWhere\(/g)?.length,
      count,
    );
    assert.equal(source.match(/where:\s*\{/g), null);
    assert.equal(source.match(/sort:\s*["'`]/g), null);
    // The one query keeps the public access options.
    assert.match(source, /overrideAccess: false/);
    assert.match(source, /draft: false/);
    assert.equal(source.match(/overrideAccess: true/), null);
  }
});
