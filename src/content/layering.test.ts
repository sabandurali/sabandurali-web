import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { getUiStrings } from "@/components/ui/strings";
import { homeCrumb } from "./home-crumb";
import { siteLocales } from "./locales";

const contentDir = path.dirname(fileURLToPath(import.meta.url));

async function sourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)
        ? [full]
        : [];
    }),
  );
  return nested.flat();
}

test("ARCHITECTURE-7: the content layer never imports from components", async () => {
  const offenders: string[] = [];
  for (const file of await sourceFiles(contentDir)) {
    const source = await readFile(file, "utf8");
    if (/from\s+["']@\/components\//.test(source))
      offenders.push(path.relative(contentDir, file));
  }
  assert.deepEqual(offenders, []);
});

test("ARCHITECTURE-7: the home crumb matches the UI breadcrumb", () => {
  for (const locale of siteLocales) {
    assert.equal(homeCrumb[locale].name, getUiStrings(locale).home);
    assert.equal(homeCrumb[locale].path, getUiStrings(locale).homePath);
  }
});

test("ARCHITECTURE-7: the UI takes the home crumb and the form texts' types from the content layer", async () => {
  const componentsDir = path.resolve(contentDir, "../components");
  const read = (file: string) =>
    readFile(path.join(componentsDir, file), "utf8");

  const strings = await read("ui/strings.ts");
  assert.match(strings, /from "@\/content\/home-crumb"/);
  assert.doesNotMatch(strings, /home: "/);

  for (const [file, type] of [
    ["forms/contact-submission.ts", "SubmissionMessages"],
    ["forms/PrivacyAcknowledgement.tsx", "PrivacyAcknowledgementContent"],
  ] as const) {
    const source = await read(file);
    assert.match(
      source,
      new RegExp(`import type \\{ ${type} \\} from "@/content/contactContent"`),
      file,
    );
    assert.doesNotMatch(source, new RegExp(`export type ${type} =`), file);
  }
});
