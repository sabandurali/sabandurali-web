import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { SubmissionMessages as FormSubmissionMessages } from "@/components/forms/contact-submission";
import type { PrivacyAcknowledgementContent as FormPrivacyContent } from "@/components/forms/PrivacyAcknowledgement";
import { getUiStrings } from "@/components/ui/strings";
import type {
  PrivacyAcknowledgementContent,
  SubmissionMessages,
} from "./contactContent";
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

// Until the form components import these types from contactContent.ts,
// typecheck fails here if the two shapes drift apart.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const sameMessages: Same<SubmissionMessages, FormSubmissionMessages> = true;
const samePrivacy: Same<PrivacyAcknowledgementContent, FormPrivacyContent> =
  true;

test("ARCHITECTURE-7: form content types keep one shape", () => {
  assert.equal(sameMessages && samePrivacy, true);
});
