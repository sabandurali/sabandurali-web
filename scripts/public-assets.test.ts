import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

// Every file in public/ is published at a site URL on each deploy, so each one
// must be referenced by the application. Masters and unused files belong in
// brand-assets/. public/media holds local CMS uploads and is not tracked.
const publicRoot = "public";
const ignoredPublicDirectories = new Set(["media"]);
// Application code, its configuration and the static content data. Tests
// are not the application: a path named only in a test is not published
// by anything, so it does not keep a file in public/.
const sourceRoots = ["src", "next.config.ts", "data"];
const isTestFile = (file: string) => /\.test\.[cm]?[jt]sx?$/.test(file);
// Migration snapshots describe the database, not the application.
const ignoredSourceDirectories = new Set(["migrations"]);
// Public files that are only referenced through a computed path. Prefer a
// literal path in the code; list a file here only when that is impossible.
const computedReferences = new Set<string>();

function listFiles(root: string, ignored: Set<string>): string[] {
  if (statSync(root).isFile()) return [root];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return ignored.has(entry.name) ? [] : listFiles(full, ignored);
    }
    return entry.isFile() ? [full] : [];
  });
}

test("every file in public/ is referenced by the application", () => {
  const sources = sourceRoots
    .flatMap((root) => listFiles(root, ignoredSourceDirectories))
    .filter((file) => /\.(?:[cm]?[jt]sx?|css|json)$/.test(file))
    .filter((file) => !isTestFile(file))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  const published = listFiles(publicRoot, ignoredPublicDirectories).map(
    (file) => `/${path.relative(publicRoot, file).split(path.sep).join("/")}`,
  );
  assert.ok(published.includes("/brand/site-og.jpg"));
  const unreferenced = published.filter(
    (url) => !computedReferences.has(url) && !sources.includes(url),
  );
  assert.deepEqual(
    unreferenced,
    [],
    "Reference these files from the application or move them to brand-assets/.",
  );
});

test("the retired home photos stay out of public/", () => {
  for (const name of [
    "arastirma-analiz.jpg",
    "kitaplar-ogrenme.jpg",
    "yapay-zeka-teknoloji.jpg",
  ]) {
    assert.equal(
      listFiles(publicRoot, ignoredPublicDirectories).some(
        (file) => path.basename(file) === name,
      ),
      false,
      name,
    );
    assert.ok(
      statSync(path.join("brand-assets", "retired-home-images", name)).isFile(),
      name,
    );
  }
});
