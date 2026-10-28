import assert from "node:assert/strict";
import test from "node:test";
import type { PublicArticleSummary } from "../articles/public-types";
import type { PublicPhoto } from "../photos/types";
import { settleDistrictSections } from "./district-sections";

const photo = { id: "p1" } as PublicPhoto;
const article = { id: "a1" } as PublicArticleSummary;

test("all sections load: nothing is unavailable and nothing is logged", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const result = await settleDistrictSections("kadikoy", {
    photos: async () => [photo],
    research: async () => [article],
    news: async () => [],
  });

  assert.deepEqual(result, {
    sections: { photos: [photo], research: [article], news: [] },
    unavailableSections: [],
  });
  assert.equal(error.mock.callCount(), 0);
});

test("one failing query empties only its own section and is logged", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const result = await settleDistrictSections("kadikoy", {
    photos: async () => {
      throw new Error("connection reset");
    },
    research: async () => [article],
    news: () => Promise.reject(new TypeError("timeout")),
  });

  assert.deepEqual(result.sections, {
    photos: [],
    research: [article],
    news: [],
  });
  assert.deepEqual(result.unavailableSections, ["photos", "news"]);
  assert.equal(error.mock.callCount(), 2);
  const lines = error.mock.calls.map((call) => String(call.arguments[0]));
  assert.ok(
    lines.some((line) => line.includes('"detail":"Error: connection reset"')),
  );
  assert.ok(
    lines.every((line) => line.includes('"scope":"districts","id":"kadikoy"')),
  );
});
