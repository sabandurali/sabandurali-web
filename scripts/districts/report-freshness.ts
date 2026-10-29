// District content freshness report (`npm run report:districts:freshness`).
// Not part of `npm test` or the pull request CI: it reads the wall clock on
// purpose and runs on a schedule (.github/workflows/content-freshness.yml),
// so a dated window that runs out never turns an unrelated pull request red.
// Exit code 1 only when reviewed content is already withheld today; content
// that expires within `--warn-days` (default 30) is a warning.
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  contentReferenceTime,
  isEditorialBundle,
  isResearchBundle,
  readCheckedJson,
} from "./content-acceptance";
import { attachEditorial } from "./editorial";
import { districtFreshness } from "./freshness";

const { values: options } = parseArgs({
  options: {
    now: { type: "string" },
    "warn-days": { type: "string", default: "30" },
  },
  strict: true,
});
const now = options.now === undefined ? Date.now() : Date.parse(options.now);
const warnDays = Number(options["warn-days"]);
if (!Number.isFinite(now) || !Number.isInteger(warnDays) || warnDays < 0) {
  console.error("Usage: report-freshness [--now <ISO date>] [--warn-days <n>]");
  process.exit(2);
}

const research = readCheckedJson(
  "data/districts/research.json",
  isResearchBundle,
);
const editorial = readCheckedJson(
  "data/districts/editorial.json",
  isEditorialBundle,
);
const referenceTime = contentReferenceTime(editorial);
attachEditorial(research, editorial, referenceTime);
const findings = districtFreshness(
  research.districts,
  referenceTime,
  now,
  warnDays,
);

const day = (time: number) => new Date(time).toISOString().slice(0, 10);
const inActions = process.env.GITHUB_ACTIONS === "true";
const lines = [
  `District content freshness on ${day(now)} (reviewed ${day(referenceTime)}, warning window ${warnDays} days)`,
  ...findings.map(
    (finding) =>
      `${finding.status === "expired" ? "EXPIRED " : "EXPIRING"} ${finding.district}/${finding.field}`,
  ),
];
if (findings.length === 0) lines.push("All reviewed content is still public.");
console.log(lines.join("\n"));

if (inActions) {
  for (const finding of findings) {
    const level = finding.status === "expired" ? "error" : "warning";
    console.log(
      `::${level} title=District content ${finding.status}::${finding.district}/${finding.field} needs a new dated review`,
    );
  }
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary)
    appendFileSync(
      summary,
      [
        "## District content freshness",
        "",
        ...lines.map((line) => `- ${line}`),
        "",
      ].join("\n"),
    );
}

process.exitCode = findings.some((finding) => finding.status === "expired")
  ? 1
  : 0;
