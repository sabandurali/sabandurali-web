import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  contentReferenceTime,
  isEditorialBundle,
  isResearchBundle,
  readCheckedJson,
} from "./content-acceptance";
import { attachEditorial } from "./editorial";
import { districtFreshness } from "./freshness";

const dayMs = 24 * 60 * 60 * 1000;

function load() {
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
  return { records: research.districts, referenceTime };
}

test("TESTS-INFRA-1: nothing is stale at the review time", () => {
  const { records, referenceTime } = load();
  assert.deepEqual(
    districtFreshness(records, referenceTime, referenceTime, 0),
    [],
  );
});

test("TESTS-INFRA-1: dated windows that run out are reported, not failed in CI", () => {
  const { records, referenceTime } = load();
  const later = referenceTime + 3650 * dayMs;
  const expired = districtFreshness(records, referenceTime, later, 0);
  assert.ok(expired.length > 0, "ten years later some window has run out");
  assert.ok(expired.every((finding) => finding.status === "expired"));
  // The same findings show up earlier as warnings within the window.
  const warned = districtFreshness(records, referenceTime, referenceTime, 3650);
  assert.deepEqual(
    warned.map(({ district, field }) => `${district}/${field}`),
    expired.map(({ district, field }) => `${district}/${field}`),
  );
  assert.ok(warned.every((finding) => finding.status === "expiring"));
});

function runReport(args: string[]) {
  return spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/districts/report-freshness.ts", ...args],
    { encoding: "utf8", env: { ...process.env, GITHUB_ACTIONS: "" } },
  );
}

test("TESTS-INFRA-1: the freshness report fails only when content already expired", () => {
  const { referenceTime } = load();
  const reviewed = new Date(referenceTime).toISOString();
  const fresh = runReport(["--now", reviewed, "--warn-days", "0"]);
  assert.equal(fresh.status, 0, fresh.stderr);
  assert.match(fresh.stdout, /All reviewed content is still public/);

  const warning = runReport(["--now", reviewed, "--warn-days", "3650"]);
  assert.equal(warning.status, 0, warning.stderr);
  assert.match(warning.stdout, /EXPIRING/);

  const later = new Date(referenceTime + 3650 * dayMs).toISOString();
  const expired = runReport(["--now", later]);
  assert.equal(expired.status, 1);
  assert.match(expired.stdout, /EXPIRED/);

  assert.equal(runReport(["--now", "not a date"]).status, 2);
  assert.notEqual(runReport(["--unknown"]).status, 0);
});
