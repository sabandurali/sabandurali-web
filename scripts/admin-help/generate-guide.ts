// Writes YONETIM-PANELI-KULLANIM-KILAVUZU.md from the single source of the
// admin guide, src/components/admin/help/admin-help-guide.ts (the /admin/help
// view). `--check` only reports whether the file is current.
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  adminGuideMarkdownPath,
  renderAdminGuideMarkdown,
} from "./guide-markdown";

const { values } = parseArgs({
  options: { check: { type: "boolean" } },
  strict: true,
});
const expected = renderAdminGuideMarkdown();

if (values.check) {
  let current = "";
  try {
    current = readFileSync(adminGuideMarkdownPath, "utf8");
  } catch {
    // A missing file is reported as out of date below.
  }
  if (current !== expected) {
    console.error(
      `${adminGuideMarkdownPath} is out of date; run npm run generate:admin-guide.`,
    );
    process.exitCode = 1;
  } else {
    console.log(`${adminGuideMarkdownPath} is up to date.`);
  }
} else {
  writeFileSync(adminGuideMarkdownPath, expected);
  console.log(`Wrote ${adminGuideMarkdownPath}.`);
}
