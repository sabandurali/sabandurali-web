/**
 * Content types depend on shared modules (`media-paths`, `locales`,
 * `links`, `shared/`), not on each other's internals: reorganizing one
 * type's folder must not break another. Rich text is the deliberate
 * exception, it builds links to every type's routes.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const contentDirectory = path.dirname(fileURLToPath(import.meta.url));
const contentTypeImport =
  /^@\/content\/(articles|books|photos|pages|districts|navigation)\//;

function importsOf(files: string[]): Array<{ file: string; from: string }> {
  return files.flatMap((file) => {
    const source = readFileSync(path.join(contentDirectory, file), "utf8");
    return [...source.matchAll(/from "(@\/content\/[^"]+)"/g)].map((match) => ({
      file,
      from: match[1] ?? "",
    }));
  });
}

function moduleFiles(directory: string): string[] {
  return readdirSync(path.join(contentDirectory, directory))
    .filter((entry) => /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry))
    .map((entry) => path.join(directory, entry));
}

test("book reviews do not depend on the articles module", () => {
  assert.deepEqual(
    importsOf(moduleFiles("books")).filter(({ from }) =>
      from.startsWith("@/content/articles/"),
    ),
    [],
  );
});

test("CMS pages reach article rules only through rich text", () => {
  assert.deepEqual(
    importsOf(moduleFiles("pages")).filter(({ from }) =>
      from.startsWith("@/content/articles/"),
    ),
    [],
  );
});

test("shared modules import no content type", () => {
  const shared = [
    "media.ts",
    "media-paths.ts",
    "locales.ts",
    "links.ts",
    ...moduleFiles("shared"),
  ];

  assert.deepEqual(
    importsOf(shared).filter(({ from }) => contentTypeImport.test(from)),
    [],
  );
});

test("ARCHITECTURE-4: book publication rules take media paths from the shared module", () => {
  const source = readFileSync(
    path.join(contentDirectory, "../collections/bookPublication.ts"),
    "utf8",
  );
  assert.doesNotMatch(source, /@\/content\/articles\//);
  // The articles module no longer re-exports the shared helper.
  assert.doesNotMatch(
    readFileSync(
      path.join(contentDirectory, "articles/article-images.ts"),
      "utf8",
    ),
    /export \{[^}]*getSafePayloadMediaPath/,
  );
});
