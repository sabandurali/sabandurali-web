import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/*
 * FRONTEND-5 guard: the design system documents only primitives that a
 * page really renders. A component exported from src/components/ui that no
 * other source uses is removed (as StationDiagram and StationMarker were)
 * and comes back together with the data it shows.
 */

const root = fileURLToPath(new URL("../../../", import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) return sourceFiles(absolute);
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)
      ? [absolute]
      : [];
  });
}

const relative = (absolute: string) =>
  path.relative(root, absolute).split(path.sep).join("/");

const sources = new Map(
  sourceFiles(path.join(root, "src")).map((absolute) => [
    relative(absolute),
    readFileSync(absolute, "utf8"),
  ]),
);

/** Exported component names (PascalCase functions) of a source text. */
function exportedComponents(source: string): string[] {
  return [
    ...source.matchAll(/^export (?:default )?function ([A-Z]\w*)/gm),
  ].flatMap((match) => (match[1] ? [match[1]] : []));
}

test("the export reader finds named and default component exports", () => {
  assert.deepEqual(
    exportedComponents(
      "export function LineChip() {}\nexport default function Card() {}\nexport function describedBy() {}\nfunction Local() {}",
    ),
    ["LineChip", "Card"],
  );
});

test("FRONTEND-5: every exported ui component is used outside its own file", () => {
  const unused: string[] = [];
  for (const [file, source] of sources) {
    if (!/^src\/components\/ui\/[^/]+\.tsx$/.test(file)) continue;
    for (const name of exportedComponents(source)) {
      const pattern = new RegExp(`\\b${name}\\b`);
      const used = [...sources].some(
        ([other, text]) => other !== file && pattern.test(text),
      );
      if (!used) unused.push(`${file}: ${name}`);
    }
  }
  assert.deepEqual(unused, [], "remove the component or use it on a page");
});

test("FRONTEND-5: the design system document names no removed component", () => {
  const doc = readFileSync(path.join(root, "docs/DESIGN-SYSTEM.md"), "utf8");
  assert.doesNotMatch(doc, /\|\s*`StationMarker`/);
  assert.doesNotMatch(doc, /için `StationMarker`/);
});

/** Exported value names (functions, constants, classes) of a source text. */
function exportedValues(source: string): string[] {
  return [
    ...source.matchAll(
      /^export (?:async )?(?:function\*?|const|let|class) ([A-Za-z_$][\w$]*)/gm,
    ),
  ].flatMap((match) => (match[1] ? [match[1]] : []));
}

test("the value export reader finds functions, constants and classes", () => {
  assert.deepEqual(
    exportedValues(
      "export function a() {}\nexport const b = 1;\nexport async function c() {}\nexport class D {}\nexport default function E() {}\nexport type F = 1;",
    ),
    ["a", "b", "c", "D"],
  );
});

test("ARCHITECTURE-7: no component helper shares an exported name with a content helper", () => {
  // Two exports with one name but different shapes (homeCrumb as a function
  // and as a record, clampPage returning 0 or 1 for an empty list) let an
  // auto-import pick the wrong module without a type error.
  const owners = new Map<string, string[]>();
  for (const [file, source] of sources) {
    const layer = /^src\/components\//.test(file)
      ? "components"
      : /^src\/(?:content|lib)\//.test(file)
        ? "content"
        : null;
    if (layer === null) continue;
    for (const name of exportedValues(source)) {
      owners.set(name, [...(owners.get(name) ?? []), `${layer}:${file}`]);
    }
  }
  const shared = [...owners]
    .filter(
      ([, files]) =>
        files.some((file) => file.startsWith("components:")) &&
        files.some((file) => file.startsWith("content:")),
    )
    .map(([name, files]) => `${name}: ${files.join(", ")}`);
  assert.deepEqual(shared, [], "give one of the two exports a distinct name");
});
