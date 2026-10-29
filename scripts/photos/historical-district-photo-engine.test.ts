import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

// The shared photo import engine and runner are batch-independent: a new
// batch adds only a config and a thin entry point (scripts/districts/archive/
// README.md points new importers at this pattern).
const directory = "scripts/photos";
const read = (file: string) => readFileSync(`${directory}/${file}`, "utf8");

test("the engine and the runner carry no batch-specific name or default", () => {
  for (const file of [
    "historical-district-photo-engine.ts",
    "historical-district-photo-importer.ts",
  ]) {
    const source = read(file);
    // Identifiers, batch names and approval prefixes of a single batch.
    assert.doesNotMatch(
      source,
      /historicalBatch\d|HistoricalBatch\d|photos-batch\d|_BATCH\d/,
      file,
    );
    assert.doesNotMatch(source, /historical-district-batch\d/, file);
  }
});

test("every batch is a config plus a thin entry point on the shared runner", () => {
  const files = readdirSync(directory);
  assert.equal(
    files.some((file) => /batch\d-core\.ts$/.test(file)),
    false,
    "no batch-named engine",
  );
  const configs = files.filter((file) =>
    /^historical-district-batch\d+-config\.ts$/.test(file),
  );
  assert.deepEqual(configs.sort(), [
    "historical-district-batch1-config.ts",
    "historical-district-batch2-config.ts",
  ]);
  for (const config of configs) {
    const batch = /batch(\d+)/.exec(config)?.[1];
    assert.match(read(config), /from "\.\/historical-district-photo-engine"/);
    const entry = read(`import-historical-district-batch${batch}.ts`);
    assert.match(entry, /from "\.\/historical-district-photo-importer"/);
    assert.match(
      entry,
      new RegExp(`from "\\./historical-district-batch${batch}-config"`),
    );
    // An entry point never imports another batch's entry point or config.
    assert.doesNotMatch(entry, /import-historical-district-batch\d/);
  }
});
