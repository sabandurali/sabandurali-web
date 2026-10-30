import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const defaultReport = "reports/istanbul-39/content-acceptance.json";

const shiftedClock = "./scripts/districts/fixtures/shifted-clock.mjs";

function runCheck(args: string[], clockOffsetDays = 0) {
  return spawnSync(
    process.execPath,
    [
      "--import",
      shiftedClock,
      "--import",
      "tsx",
      "scripts/districts/check-content.ts",
      ...args,
    ],
    {
      encoding: "utf8",
      env: { ...process.env, CLOCK_OFFSET_DAYS: String(clockOffsetDays) },
    },
  );
}

function modifiedAt(file: string): number | null {
  return existsSync(file) ? statSync(file).mtimeMs : null;
}

test("the content acceptance check passes and writes nothing by default", () => {
  const before = modifiedAt(defaultReport);
  const result = runCheck([]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /39\/39 PASS/);
  assert.equal(modifiedAt(defaultReport), before);
});

test("--report writes the acceptance result only to the given path", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "district-content-"));
  try {
    const report = path.join(directory, "acceptance.json");
    const before = modifiedAt(defaultReport);
    const result = runCheck(["--report", report]);
    assert.equal(result.status, 0, result.stderr);
    const written = JSON.parse(readFileSync(report, "utf8")) as {
      result: string;
      rows: unknown[];
    };
    assert.equal(written.result, "39/39 PASS");
    assert.equal(written.rows.length, 39);
    assert.equal(modifiedAt(defaultReport), before);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("unknown arguments are rejected instead of being ignored", () => {
  const result = runCheck(["--write-report"]);
  assert.notEqual(result.status, 0);
});

test("TESTS-INFRA-1: the check gives the same result on every future date", () => {
  // 35 days was the first failing day before the fix (a planning row left
  // its 90-day window); 500 and 3650 days cover the transport and market
  // windows of the content policy as well.
  for (const days of [35, 200, 500, 3650]) {
    const result = runCheck([], days);
    assert.equal(result.status, 0, `+${days} days: ${result.stderr}`);
    assert.match(result.stdout, /39\/39 PASS/);
  }
});

test("TESTS-INFRA-1: the shifted clock preload really moves the wall clock", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--import",
      shiftedClock,
      "--eval",
      "console.log(Date.now(), new Date().getTime())",
    ],
    { encoding: "utf8", env: { ...process.env, CLOCK_OFFSET_DAYS: "3650" } },
  );
  assert.equal(result.status, 0, result.stderr);
  const year = 365 * 24 * 60 * 60 * 1000;
  for (const time of result.stdout.trim().split(" ").map(Number))
    assert.ok(time - Date.now() > 5 * year, String(time));
});
