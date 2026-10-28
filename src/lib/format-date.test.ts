import assert from "node:assert/strict";
import test from "node:test";
import { formatDate, SITE_TIME_ZONE, toDateTimeAttribute } from "./format-date";

test("dates are shown in Europe/Istanbul, not in the server time zone", () => {
  assert.equal(SITE_TIME_ZONE, "Europe/Istanbul");
  // 22:30 UTC on 27 October is already 28 October in Istanbul (UTC+3).
  assert.equal(formatDate("2026-10-27T22:30:00Z"), "28 Ekim 2026");
  assert.equal(formatDate("2026-10-27T22:30:00Z", "en"), "28 October 2026");
  // 20:59 UTC is still the same calendar day in Istanbul.
  assert.equal(formatDate("2026-10-27T20:59:00Z"), "27 Ekim 2026");
});

test("date-only values keep their calendar day", () => {
  assert.equal(formatDate("2026-09-01"), "1 Eylül 2026");
  assert.equal(formatDate("2026-09-01", "en"), "1 September 2026");
});

test("Turkish month names and explicit locale tags are supported", () => {
  assert.equal(formatDate("2026-08-15T09:00:00Z", "tr"), "15 Ağustos 2026");
  assert.equal(formatDate("2026-02-03T09:00:00Z", "tr-TR"), "3 Şubat 2026");
  assert.equal(formatDate("2026-02-03T09:00:00Z", "en-GB"), "3 February 2026");
  assert.equal(
    formatDate(new Date("2026-02-03T09:00:00Z"), "tr", "short"),
    "3.02.2026",
  );
  assert.equal(
    formatDate(Date.parse("2026-02-03T09:00:00Z"), "tr", "medium"),
    "3 Şub 2026",
  );
});

test("missing and invalid values return null", () => {
  for (const value of [null, undefined, "", "not a date", Number.NaN]) {
    assert.equal(formatDate(value), null);
    assert.equal(toDateTimeAttribute(value), null);
  }
});

test("the machine-readable value is an ISO timestamp", () => {
  assert.equal(
    toDateTimeAttribute("2026-10-27T22:30:00+00:00"),
    "2026-10-27T22:30:00.000Z",
  );
});
