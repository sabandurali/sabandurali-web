import assert from "node:assert/strict";
import test from "node:test";
import { describeError, reportContentIssue } from "./content-log";
import {
  getFiniteNumber,
  getPositiveNumber,
  getRelationshipID,
  getText,
  isPublishedBy,
  isRecord,
} from "./guards";

test("records exclude null and arrays", () => {
  assert.equal(isRecord({}), true);
  assert.equal(isRecord(null), false);
  assert.equal(isRecord([]), false);
  assert.equal(isRecord("text"), false);
});

test("text values are trimmed and blank values are null", () => {
  assert.equal(getText("  Kadıköy  "), "Kadıköy");
  assert.equal(getText("   "), null);
  assert.equal(getText(42), null);
});

test("numbers must be finite, dimensions must be positive", () => {
  assert.equal(getFiniteNumber(0), 0);
  assert.equal(getFiniteNumber(Number.NaN), null);
  assert.equal(getFiniteNumber("3"), null);
  assert.equal(getPositiveNumber(1200), 1200);
  assert.equal(getPositiveNumber(0), null);
  assert.equal(getPositiveNumber(-1), null);
});

test("relationships resolve from IDs and populated documents", () => {
  assert.equal(getRelationshipID("abc"), "abc");
  assert.equal(getRelationshipID({ id: "abc", title: "x" }), "abc");
  assert.equal(getRelationshipID({ title: "x" }), null);
  assert.equal(getRelationshipID(""), null);
  assert.equal(getRelationshipID(null), null);
});

test("publication dates must be valid and not in the future", () => {
  const now = new Date("2026-10-28T12:00:00Z");
  assert.equal(isPublishedBy("2026-10-28T12:00:00Z", now), true);
  assert.equal(isPublishedBy("2026-10-28T12:00:01Z", now), false);
  assert.equal(isPublishedBy("soon", now), false);
  assert.equal(isPublishedBy(null, now), false);
});

test("content issues are logged as one JSON line without values", (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const error = t.mock.method(console, "error", () => {});

  reportContentIssue({
    scope: "books",
    id: "book-1",
    reason: "required public fields are missing",
  });
  reportContentIssue({ scope: "home", reason: "fallback" }, "error");

  assert.equal(warn.mock.callCount(), 1);
  assert.equal(error.mock.callCount(), 1);
  const line = String(warn.mock.calls[0]?.arguments[0]);
  assert.ok(line.startsWith("[content] "));
  assert.deepEqual(JSON.parse(line.slice("[content] ".length)), {
    severity: "warn",
    scope: "books",
    id: "book-1",
    reason: "required public fields are missing",
  });
  assert.equal(describeError(new TypeError("boom")), "TypeError: boom");
  assert.equal(describeError("plain"), "plain");
  assert.equal(describeError({}), "Unknown error");
});
