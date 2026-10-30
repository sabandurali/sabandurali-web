import assert from "node:assert/strict";
import test from "node:test";
import { parsePhotoListParams } from "./photo-list-params";

test("reads collection, tag and page from the query string", () => {
  assert.deepEqual(
    parsePhotoListParams({ collection: " sehir ", tag: "kedi", page: "3" }),
    { collection: "sehir", tag: "kedi", page: 3 },
  );
});

test("ignores repeated, empty and oversized values", () => {
  assert.deepEqual(
    parsePhotoListParams({
      collection: ["a", "b"],
      tag: "   ",
      page: "x".repeat(200),
    }),
    {},
  );
});

test("accepts only plain positive page numbers and drops page 1", () => {
  for (const page of ["0", "-1", "2.0", "1e3", "02", "abc", "9999999"]) {
    assert.deepEqual(parsePhotoListParams({ page }), {}, page);
  }
  assert.deepEqual(parsePhotoListParams({ page: "1" }), {});
  assert.deepEqual(parsePhotoListParams({ page: "12" }), { page: 12 });
});
