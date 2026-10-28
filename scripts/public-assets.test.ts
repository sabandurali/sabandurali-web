import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

// Every file in public/ is published at a site URL on each deploy, so each one
// must be referenced by the application. Masters and unused files belong in
// brand-assets/. public/media holds local CMS uploads and is not tracked.
const publicRoot = "public";
const ignoredPublicDirectories = new Set(["media"]);
// Application code, its configuration and the static content data.
const sourceRoots = ["src", "next.config.ts", "data"];
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
