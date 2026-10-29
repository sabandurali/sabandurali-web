import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/*
 * FE-20 guard: public UI text is never smaller than 12 px.
 *
 * Scans the public site sources for explicit font sizes (Tailwind arbitrary
 * values such as text-[10px], inline fontSize styles and CSS font-size) and
 * fails on anything below 12 px. The Payload admin is a separate product
 * and not scanned.
 *
 * `legacyFiles` may only list a component that still contains smaller
 * sizes while it is rebuilt with src/components/ui. Every component now
 * uses the type scale, so it is empty; never add an entry. A listed file
 * must exist and still break the rule, so the list can only shrink.
 */
const legacyFiles: ReadonlySet<string> = new Set<string>();

const excluded = [
  /^src\/app\/\(payload\)\//,
  /^src\/app\/yonetim\//,
  /^src\/components\/admin\//,
  /^src\/migrations\//,
  /^src\/payload-types\.ts$/,
  /\.test\.tsx?$/,
];

const root = fileURLToPath(new URL("../../../", import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) return sourceFiles(absolute);
    return /\.(tsx|ts|css|scss)$/.test(entry) ? [absolute] : [];
  });
}

/** Font sizes in px found in a source text (rem/em counted at 16 px). */
function findFontSizesPx(source: string): number[] {
  const sizes: number[] = [];
  const toPx = (amount: string, unit: string) =>
    unit === "px" ? Number(amount) : Number(amount) * 16;
  const patterns = [
    /\btext-\[(?:length:)?(\d*\.?\d+)(px|rem|em)\]/g,
    /\bfontSize:\s*["'`]?(\d*\.?\d+)(px|rem|em)/g,
    /font-size:\s*(\d*\.?\d+)(px|rem|em)\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const [, amount, unit] = match;
      if (amount && unit) sizes.push(toPx(amount, unit));
    }
  }
  for (const match of source.matchAll(
    /\bfontSize:\s*(\d+(?:\.\d+)?)\s*[,}]/g,
  )) {
    if (match[1]) sizes.push(Number(match[1]));
  }
  return sizes;
}

test("the font-size scanner reads every supported notation", () => {
  assert.deepEqual(
    findFontSizesPx(
      'className="text-[9px] text-[0.625rem] md:text-[length:11px]" style={{ fontSize: 10 }} style={{ fontSize: "0.5rem" }} a { font-size: 12px; }',
    ),
    [9, 10, 11, 8, 12, 10],
  );
  assert.deepEqual(
    findFontSizesPx('className="text-xs text-small text-[2rem]"'),
    [32],
  );
});

test("FE-20: no public source sets text below 12 px", () => {
  const offenders: string[] = [];
  for (const absolute of sourceFiles(path.join(root, "src"))) {
    const relative = path.relative(root, absolute).split(path.sep).join("/");
    if (excluded.some((pattern) => pattern.test(relative))) continue;
    if (legacyFiles.has(relative)) continue;
    const small = findFontSizesPx(readFileSync(absolute, "utf8")).filter(
      (size) => size < 12,
    );
    if (small.length > 0) offenders.push(`${relative}: ${small.join(", ")} px`);
  }
  assert.deepEqual(offenders, [], "text below 12 px; use the type scale");
});

test("FE-20: the exception list is empty and holds only real offenders", () => {
  for (const relative of legacyFiles) {
    const absolute = path.join(root, relative);
    assert.ok(existsSync(absolute), `${relative} is gone; remove it`);
    const small = findFontSizesPx(readFileSync(absolute, "utf8")).filter(
      (size) => size < 12,
    );
    assert.ok(small.length > 0, `${relative} follows the scale; remove it`);
  }
  assert.equal(legacyFiles.size, 0, "the exception list only shrinks");
});
