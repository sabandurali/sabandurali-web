import assert from "node:assert/strict";
import test from "node:test";
import { isFirstUnfilteredPhotoPage } from "./photo-cache-tags";

test("SEO-PERF-4: only the unfiltered first list page is cached", () => {
  assert.equal(
    isFirstUnfilteredPhotoPage(undefined, undefined, undefined),
    true,
  );
  assert.equal(isFirstUnfilteredPhotoPage(undefined, undefined, 1), true);
  assert.equal(isFirstUnfilteredPhotoPage(undefined, undefined, 2), false);
  assert.equal(isFirstUnfilteredPhotoPage("istanbul", undefined, 1), false);
  assert.equal(isFirstUnfilteredPhotoPage(undefined, "kule", undefined), false);
});
