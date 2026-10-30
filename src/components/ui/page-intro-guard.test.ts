import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/*
 * FRONTEND-2 guard: every page opens with PageIntro (DESIGN-SYSTEM.md §5),
 * so the eyebrow, the h1's measure and hyphenation and the spacing stay the
 * same and a fix to PageIntro reaches every page. Only the components below
 * write their own h1; each one is a documented exception.
 */
const ownH1: ReadonlySet<string> = new Set([
  // The opening itself.
  "src/components/ui/PageIntro.tsx",
  // The home page hero (TitleLines, map figure): its own documented layout.
  "src/components/sections/Hero.tsx",
  // 404 and error screens (StatusMessage in DESIGN-SYSTEM.md §5).
  "src/components/layout/StatusMessage.tsx",
]);

const excluded = [
  /^src\/app\/\(payload\)\//,
  /^src\/app\/yonetim\//,
  /^src\/components\/admin\//,
  /\.test\.tsx?$/,
];

const root = fileURLToPath(new URL("../../../", import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) return sourceFiles(absolute);
    return /\.tsx$/.test(entry) ? [absolute] : [];
  });
}

const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

test("FRONTEND-2: no page builds its own opening with a hand-written h1", () => {
  const offenders: string[] = [];
  for (const absolute of sourceFiles(path.join(root, "src"))) {
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (excluded.some((pattern) => pattern.test(relative))) continue;
    if (ownH1.has(relative)) continue;
    if (/<h1[\s>]/.test(readFileSync(absolute, "utf8")))
      offenders.push(relative);
  }
  assert.deepEqual(offenders, [], "open the page with <PageIntro>");
});

test("FRONTEND-2: the exception list holds only files that still write an h1", () => {
  for (const relative of ownH1) {
    assert.match(read(relative), /<h1[\s>]/, `${relative}: remove it`);
  }
});

test("FRONTEND-2: the district index and district news pages open with PageIntro", () => {
  for (const relative of [
    "src/app/(tr)/istanbul/ilceler/page.tsx",
    "src/components/districts/DistrictNewsListPage.tsx",
  ]) {
    const source = read(relative);
    assert.match(
      source,
      /import PageIntro from "@\/components\/ui\/PageIntro";/,
      relative,
    );
    assert.match(source, /<PageIntro\s+layout="page"/, relative);
    assert.doesNotMatch(source, /type-region/, `${relative}: use the Eyebrow`);
  }
});
