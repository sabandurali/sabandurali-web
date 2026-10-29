import assert from "node:assert/strict";
import test from "node:test";
import {
  getContentLastModified,
  getContentLastModifiedIso,
} from "./content-dates";

test("a scheduled item never reports a change before its publication", () => {
  const scheduled = {
    updatedAt: "2026-10-01T09:00:00.000Z",
    publishedAt: "2026-10-10T09:00:00.000Z",
  };

  assert.equal(
    getContentLastModified(scheduled)?.toISOString(),
    "2026-10-10T09:00:00.000Z",
  );
  assert.equal(
    getContentLastModifiedIso(scheduled),
    "2026-10-10T09:00:00.000Z",
  );
});

test("a later edit is the last modification", () => {
  assert.equal(
    getContentLastModifiedIso({
      updatedAt: "2026-10-12T09:00:00.000Z",
      publishedAt: "2026-10-10T09:00:00.000Z",
    }),
    "2026-10-12T09:00:00.000Z",
  );
});

test("missing or invalid dates are ignored, never invented", () => {
  assert.equal(
    getContentLastModifiedIso({ updatedAt: null, publishedAt: null }),
    undefined,
  );
  assert.equal(
    getContentLastModifiedIso({
      updatedAt: "not a date",
      publishedAt: "2026-10-10T09:00:00.000Z",
    }),
    "2026-10-10T09:00:00.000Z",
  );
});
