import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseResearchBundle } from "./import-core";
import { isEditorialBundle } from "./content-acceptance";
import { attachEditorial, editorialSectionKeys } from "./editorial";
import {
  HistoricalPhotoImportError,
  parseHistoricalManifest,
} from "../photos/historical-district-photo-engine";
import { historicalBatch1Config } from "../photos/historical-district-batch1-config";

const readJson = (file: string): unknown =>
  JSON.parse(readFileSync(file, "utf8"));

/** A deep copy of `value` with `change` applied, for one broken field. */
function broken(value: unknown, change: (copy: unknown) => void): unknown {
  const copy: unknown = structuredClone(value);
  change(copy);
  return copy;
}

function at(value: unknown, ...path: Array<string | number>): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = Reflect.get(current, key);
  }
  return current;
}

function remove(
  value: unknown,
  path: Array<string | number>,
  key: string,
): void {
  const parent = at(value, ...path);
  assert.ok(typeof parent === "object" && parent !== null);
  Reflect.deleteProperty(parent, key);
}

test("ARCHITECTURE-9: the research bundle is parsed from unknown JSON with path errors", () => {
  const json = readJson("data/districts/research.json");
  const bundle = parseResearchBundle(json);
  assert.equal(bundle.districts.length, 39);
  assert.equal(bundle.districts[0]?.document.sha256.length, 64);

  // A missing or mistyped field names its path instead of a TypeError.
  const cases: Array<[(copy: unknown) => void, RegExp]> = [
    [
      (copy) => remove(copy, ["districts", 0, "document"], "sha256"),
      /\$\.districts\[0\]\.document\.sha256: expected a string/,
    ],
    [
      (copy) => remove(copy, ["districts", 3], "sources"),
      /\$\.districts\[3\]\.sources: expected a list/,
    ],
    [
      (copy) => remove(copy, ["districts", 2], "reviewedSections"),
      /\$\.districts\[2\]\.reviewedSections: expected a list of strings/,
    ],
    [
      (copy) => {
        const source = at(copy, "districts", 1, "sources", 0);
        assert.ok(typeof source === "object" && source !== null);
        Reflect.set(source, "sections", ["not-a-section"]);
      },
      /\$\.districts\[1\]\.sources\[0\]\.sections: expected a list of district sections/,
    ],
  ];
  for (const [change, message] of cases) {
    assert.throws(
      () => parseResearchBundle(broken(json, change)),
      (error: unknown) =>
        error instanceof Error &&
        !(error instanceof TypeError) &&
        message.test(error.message),
      String(message),
    );
  }
  // The import gates still run after parsing.
  assert.throws(
    () =>
      parseResearchBundle(
        broken(json, (copy) => {
          const rows = at(copy, "districts");
          assert.ok(Array.isArray(rows));
          rows.pop();
        }),
      ),
    /Exactly 39 draft research records required/,
  );
  assert.throws(() => parseResearchBundle(null), /\$: expected an object/);
});

test("ARCHITECTURE-9: a historical photo manifest is parsed from unknown JSON", () => {
  const json = readJson("data/districts/historical-photo-batch1.json");
  const manifest = parseHistoricalManifest(json, historicalBatch1Config);
  assert.equal(manifest.items.length, historicalBatch1Config.districts.length);

  assert.throws(
    () =>
      parseHistoricalManifest(
        broken(json, (copy) => remove(copy, ["items", 4], "width")),
        historicalBatch1Config,
      ),
    (error: unknown) =>
      error instanceof HistoricalPhotoImportError &&
      error.message.includes("$.items[4].width must be a number"),
  );
  assert.throws(
    () =>
      parseHistoricalManifest(
        broken(json, (copy) => {
          const item = at(copy, "items", 0);
          assert.ok(typeof item === "object" && item !== null);
          Reflect.set(item, "publicationSafe", "yes");
        }),
        historicalBatch1Config,
      ),
    (error: unknown) =>
      error instanceof HistoricalPhotoImportError &&
      error.message.includes("$.items[0].publicationSafe must be a boolean"),
  );
});

test("ARCHITECTURE-9: the import entry points parse instead of casting JSON", () => {
  for (const file of [
    "scripts/districts/import.ts",
    "scripts/districts/check-cms.ts",
    "scripts/photos/historical-district-photo-importer.ts",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bas\s+ResearchBundle\b/, file);
    assert.doesNotMatch(source, /\bas\s+HistoricalPhotoManifest\b/, file);
    assert.doesNotMatch(source, /\bas\s+EditorialBundle\b/, file);
  }
  assert.match(
    readFileSync("scripts/districts/import.ts", "utf8"),
    /isEditorialBundle\(/,
  );
  assert.match(
    readFileSync("scripts/districts/check-cms.ts", "utf8"),
    /parseResearchBundle\(/,
  );
  assert.match(
    readFileSync("scripts/districts/import.ts", "utf8"),
    /parseResearchBundle\(/,
  );
  assert.match(
    readFileSync(
      "scripts/photos/historical-district-photo-importer.ts",
      "utf8",
    ),
    /parseHistoricalManifest\(/,
  );
});

test("ARCHITECTURE-2: editorial section keys from JSON are checked, not cast", () => {
  assert.deepEqual(
    editorialSectionKeys({ summary: "a", history: "b", geography: "c" }),
    ["summary", "history", "geography"],
  );
  for (const key of ["summery", "facts", "neighborhoods", "__proto__x"])
    assert.throws(
      () => editorialSectionKeys({ [key]: "x" }),
      new RegExp(`Unknown editorial section: ${key}`),
    );

  // The real bundles: an unknown section in one review stops the import
  // before any write instead of reaching the reviewed-section list.
  const research = parseResearchBundle(
    readJson("data/districts/research.json"),
  );
  const editorial = readJson("data/districts/editorial.json");
  assert.ok(isEditorialBundle(editorial));
  const [first] = editorial.districts;
  assert.ok(first);
  const misspelt = {
    ...editorial,
    districts: [
      { ...first, sections: { ...first.sections, summery: "x" } },
      ...editorial.districts.slice(1),
    ],
  };
  assert.throws(
    () => attachEditorial(structuredClone(research), misspelt),
    /Unknown editorial section: summery/,
  );
  assert.doesNotThrow(() =>
    attachEditorial(structuredClone(research), editorial),
  );
});
