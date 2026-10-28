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

function runCheck(args: string[]) {
  return spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/districts/check-content.ts", ...args],
    { encoding: "utf8" },
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
