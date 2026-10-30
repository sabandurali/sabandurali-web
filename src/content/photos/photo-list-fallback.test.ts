import assert from "node:assert/strict";
import test from "node:test";
import { shouldShowTurkishPhotoFallback } from "./photo-list-fallback";

const empty = { totalItems: 0 };

test("EN-PHOTO-FALLBACK: the empty, unfiltered English list shows Turkish photos", () => {
  assert.equal(shouldShowTurkishPhotoFallback("en", {}, empty), true);
  assert.equal(shouldShowTurkishPhotoFallback("en", { page: 1 }, empty), true);
});

test("EN-PHOTO-FALLBACK: a list with photos, a filter or a later page never falls back", () => {
  assert.equal(
    shouldShowTurkishPhotoFallback("en", {}, { totalItems: 3 }),
    false,
  );
  assert.equal(
    shouldShowTurkishPhotoFallback("en", { collection: "istanbul" }, empty),
    false,
  );
  assert.equal(
    shouldShowTurkishPhotoFallback("en", { tag: "sokak" }, empty),
    false,
  );
  assert.equal(shouldShowTurkishPhotoFallback("en", { page: 2 }, empty), false);
  // The Turkish list is the source: it has nothing to fall back to.
  assert.equal(shouldShowTurkishPhotoFallback("tr", {}, empty), false);
});
