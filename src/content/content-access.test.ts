/**
 * The public content layer reads Payload as an anonymous visitor
 * (`overrideAccess: false`) and only published versions (`draft: false`).
 * The single exception is the Navigation global: it is closed to anonymous
 * reads so the public REST API never exposes its configuration, and the
 * site reads its published version server-side with `overrideAccess: true`;
 * the mapper passes on only published, active and safe links. This test
 * keeps that exception the only one.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const contentDirectory = path.dirname(fileURLToPath(import.meta.url));
const navigationRepository = path.join(
  "navigation",
  "payload-navigation-repository.ts",
);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const candidate = path.join(directory, entry);
    if (statSync(candidate).isDirectory()) return sourceFiles(candidate);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)
      ? [candidate]
      : [];
  });
}

const readers = sourceFiles(contentDirectory).flatMap((file) => {
  const source = readFileSync(file, "utf8");
  const calls = source.match(/payload\.(find|findGlobal|findByID)\(/g) ?? [];
  return calls.length === 0
    ? []
    : [{ file: path.relative(contentDirectory, file), source, calls }];
});

test("every public Payload read is anonymous and published-only", () => {
  assert.ok(readers.length >= 5);

  for (const { file, source, calls } of readers) {
    assert.equal(
      source.match(/^\s*draft: false,/gm)?.length,
      calls.length,
      `${file}: every read passes draft: false`,
    );
    if (file === navigationRepository) continue;
    assert.equal(
      source.match(/^\s*overrideAccess: false,/gm)?.length,
      calls.length,
      `${file}: every read passes overrideAccess: false`,
    );
    assert.equal(/^\s*overrideAccess: true/m.test(source), false, file);
  }
});

test("the Navigation global is the one documented overrideAccess exception", () => {
  const navigation = readers.find(({ file }) => file === navigationRepository);

  assert.ok(navigation);
  assert.deepEqual(navigation.calls, ["payload.findGlobal("]);
  assert.match(navigation.source, /overrideAccess: true/);
  assert.match(navigation.source, /mapPayloadNavigation\(/);
});
