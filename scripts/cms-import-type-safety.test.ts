import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { toFieldRecord } from "./districts/import-core";
import {
  HistoricalPhotoImportError,
  makeHistoricalPhotoData,
  type HistoricalPhotoItem,
} from "./photos/historical-district-photo-engine";

/**
 * Scripts that write to (or replay writes into) the CMS. Their Payload calls
 * must stay typed: a cast or non-null assertion would hide a renamed,
 * retyped or newly required field until a dry-run or apply fails
 * (CLAUDE.md, Definition of done).
 */
const DISTRICT_IMPORT_SCRIPTS = [
  "scripts/districts/import.ts",
  "scripts/districts/import-core.ts",
  "scripts/districts/check-cms.ts",
  "scripts/districts/editorial.ts",
];
const CMS_IMPORT_SCRIPTS = [
  "scripts/photos/historical-district-photo-importer.ts",
  "scripts/photos/historical-district-photo-engine.ts",
  ...DISTRICT_IMPORT_SCRIPTS,
];

const UNCHECKED = [
  { name: "as never", pattern: /\bas\s+never\b/ },
  { name: "as unknown as", pattern: /\bas\s+unknown\s+as\b/ },
  // `value!.x`, `value!)`, `find(...)!;` — but not `!=` or `!==`.
  { name: "non-null !", pattern: /[\w)\]]!(?=[.;,)\s\]])/ },
];

/**
 * Any `as` type assertion except `as const`. Import and export renames
 * (`{ a as b }`) are skipped by the caller. JSON read from a file is checked
 * with a guard (`parseResearchBundle`, `isEditorialBundle`), never cast.
 */
const TYPE_ASSERTION = /\bas\s+(?!const\b)[\w{([]/;
const IMPORT_RENAME = /^\s*(?:import\b|export\s*\{|\w+\s+as\s+\w+,?\s*$)/;

test("district import scripts make no type assertions at all", () => {
  for (const file of DISTRICT_IMPORT_SCRIPTS) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (/^\s*(?:\/\/|\*|\/\*)/.test(line) || IMPORT_RENAME.test(line)) return;
      assert.ok(
        !TYPE_ASSERTION.test(line),
        `${file}:${index + 1} uses a type assertion: ${line.trim()}`,
      );
    });
  }
});

test("the type assertion check catches casts of parsed JSON", () => {
  for (const line of [
    "JSON.parse(text) as EditorialBundle,",
    "const keys = Object.keys(sections) as DistrictSection[];",
    "plan[action as keyof typeof plan]",
    "(error as NodeJS.ErrnoException).code",
    "value as { id?: unknown }",
  ])
    assert.ok(TYPE_ASSERTION.test(line), line);
  for (const line of [
    "] as const;",
    "} as const satisfies Record<string, number>;",
  ])
    assert.ok(!TYPE_ASSERTION.test(line), line);
});

test("CMS import scripts carry no unchecked casts or non-null assertions", () => {
  for (const file of CMS_IMPORT_SCRIPTS) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (/^\s*(?:\/\/|\*|\/\*)/.test(line)) return;
      for (const { name, pattern } of UNCHECKED) {
        assert.ok(
          !pattern.test(line),
          `${file}:${index + 1} uses ${name}: ${line.trim()}`,
        );
      }
    });
  }
});

const item: HistoricalPhotoItem = {
  district: "besiktas",
  title: "Bebek Sahili",
  depictedPlace: "Bebek",
  approximateDate: "1900",
  creator: "Fixture",
  archive: "Fixture",
  recordUrl: "https://example.org/record",
  downloadUrl: "https://example.org/file.jpg",
  license: "Public domain",
  rightsStatement: "Fixture",
  requiredAttribution: "Fixture",
  sha256: "0".repeat(64),
  bytes: 1,
  mimeType: "image/jpeg",
  width: 1,
  height: 1,
  auditedAt: "2026-01-01",
  publicationSafe: true,
};

test("historical photo data names a registered district and its slug", () => {
  const data = makeHistoricalPhotoData(item, "media-1", "collection-1");
  assert.equal(data.district, "besiktas");
  assert.equal(data.slug, "bebek-sahili");
  assert.equal(data.image, "media-1");
  assert.deepEqual(data.collections, ["collection-1"]);

  assert.throws(
    () =>
      makeHistoricalPhotoData(
        { ...item, district: "atlantis" },
        "media-1",
        "collection-1",
      ),
    (error: unknown) =>
      error instanceof HistoricalPhotoImportError &&
      error.category === "input_failed",
  );
});

test("a typed document becomes a plain field record without losing fields", () => {
  const document = { id: "a", district: "esenler", nested: { x: 1 } };
  const record = toFieldRecord(document);
  assert.deepEqual(record, document);
  assert.notEqual(record, document);
});
