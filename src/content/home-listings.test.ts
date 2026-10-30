import assert from "node:assert/strict";
import test from "node:test";
import type { PublicArticleSummary } from "./articles/public-types";
import type { PublicBookReviewSummary } from "./books/public-types";
import { loadHomeListings, type HomeListingLoaders } from "./home-listings";
import type { PublicPhoto } from "./photos/types";

const article = { id: "a1" } as PublicArticleSummary;
const book = { id: "b1" } as PublicBookReviewSummary;
const photo = { id: "p1" } as PublicPhoto;

const loaders: HomeListingLoaders = {
  articles: async () => [article],
  books: async () => [book],
  photos: async () => [photo],
  districts: async () => new Map([["kadikoy", "Özet."]]),
};

test("ARCHITECTURE-1: all lists load and nothing is unavailable", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const result = await loadHomeListings("tr", loaders, {});
  assert.deepEqual(result.unavailable, []);
  assert.deepEqual(result.listings.articles, [article]);
  assert.deepEqual([...result.listings.districts], [["kadikoy", "Özet."]]);
  assert.equal(error.mock.callCount(), 0);
});

test("ARCHITECTURE-1: a failing list empties only itself and is logged", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const result = await loadHomeListings(
    "en",
    {
      ...loaders,
      books: () => Promise.reject(new Error("connection reset")),
      districts: async () => {
        throw new TypeError("timeout");
      },
    },
    { NODE_ENV: "development" },
  );

  assert.deepEqual(result.unavailable, ["books", "districts"]);
  assert.deepEqual(result.listings.articles, [article]);
  assert.deepEqual(result.listings.books, []);
  assert.deepEqual(result.listings.photos, [photo]);
  assert.equal(result.listings.districts.size, 0);
  assert.equal(error.mock.callCount(), 2);
  const lines = error.mock.calls.map((call) => String(call.arguments[0]));
  assert.ok(lines.every((line) => line.includes('"scope":"home","id":"en"')));
  assert.ok(lines.some((line) => line.includes("Error: connection reset")));
});

test("ARCHITECTURE-1: a production server keeps the cached home page", async (t) => {
  t.mock.method(console, "error", () => {});
  const failing = {
    ...loaders,
    photos: () => Promise.reject(new Error("connection reset")),
  };
  await assert.rejects(
    loadHomeListings("tr", failing, { NODE_ENV: "production" }),
    { name: "DegradedRenderError" },
  );
  const built = await loadHomeListings("tr", failing, {
    NODE_ENV: "production",
    NEXT_PHASE: "phase-production-build",
  });
  assert.deepEqual(built.unavailable, ["photos"]);
});
