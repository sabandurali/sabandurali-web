import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const srcRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
        ? [full]
        : [];
    }),
  );
  return files.flat();
}

test("no component spaces its children with space-x/space-y utilities", async () => {
  // Tailwind 4 emits `:where(.space-y-5 > :not(:last-child))`, a zero
  // specificity rule that loses to the children's own `m-0`: the gap
  // silently disappears (FRONTEND-1). DESIGN-SYSTEM §7 asks for `gap-*` on
  // a grid or flex container instead.
  const offenders: string[] = [];
  for (const file of await sourceFiles(srcRoot)) {
    const source = await readFile(file, "utf8");
    if (/["'`\s]-?space-[xy]-[\w[\]./-]+/.test(source)) {
      offenders.push(path.relative(srcRoot, file));
    }
  }
  assert.deepEqual(offenders, []);
});
