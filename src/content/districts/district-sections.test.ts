import assert from "node:assert/strict";
import test from "node:test";
import type { PublicArticleSummary } from "../articles/public-types";
import type { PublicPhoto } from "../photos/types";
import {
  loadDistrictSectionsForCache,
  settleDistrictSections,
} from "./district-sections";

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

test("CORRECTNESS-3: a production server keeps the cached page instead of a degraded one", async (t) => {
  t.mock.method(console, "error", () => {});
  const loaders = {
    photos: async (): Promise<PublicPhoto[]> => {
      throw new Error("connection reset");
    },
    research: async () => [article],
    news: async () => [],
  };

  await assert.rejects(
    loadDistrictSectionsForCache("kadikoy", loaders, {
      NODE_ENV: "production",
    }),
    { name: "DegradedRenderError" },
  );
  // The build and dev still render the page with the unavailable section.
  const built = await loadDistrictSectionsForCache("kadikoy", loaders, {
    NODE_ENV: "production",
    NEXT_PHASE: "phase-production-build",
  });
  assert.deepEqual(built.unavailableSections, ["photos"]);
  // A complete render is never refused.
  const complete = await loadDistrictSectionsForCache(
    "kadikoy",
    { ...loaders, photos: async () => [photo] },
    { NODE_ENV: "production" },
  );
  assert.deepEqual(complete.unavailableSections, []);
});
