import assert from "node:assert/strict";
import test from "node:test";
import {
  HAS_PUBLIC_SCAN_PAGE_SIZE,
  hasPublicDocument,
} from "./has-public-document";

/** A fake query over `accepted` (true = the mapper accepts that document). */
function query(accepted: readonly boolean[]) {
  const calls: Array<[number, number]> = [];
  const findPage = async (page: number, pageSize: number) => {
    calls.push([page, pageSize]);
    const start = (page - 1) * pageSize;
    const rows = accepted.slice(start, start + pageSize);
    return {
      photos: rows.filter(Boolean),
      totalPages: Math.ceil(accepted.length / pageSize),
    };
  };
  return { calls, findPage };
}

test("SEO-PERF-4: an accepted newest document needs one one-row query", async () => {
  const { calls, findPage } = query([true, false, true]);
  assert.equal(await hasPublicDocument(findPage), true);
  assert.deepEqual(calls, [[1, 1]]);
});

test("SEO-PERF-4: no document, or a single rejected one, is one query", async () => {
  for (const accepted of [[], [false]]) {
    const { calls, findPage } = query(accepted);
    assert.equal(await hasPublicDocument(findPage), false);
    assert.deepEqual(calls, [[1, 1]]);
  }
});

test("SEO-PERF-4: rejected documents are scanned in larger pages, not row by row", async () => {
  const rejected = Array.from({ length: 60 }, () => false);

  const found = query([...rejected, true]);
  assert.equal(await hasPublicDocument(found.findPage), true);
  assert.deepEqual(found.calls, [
    [1, 1],
    [1, HAS_PUBLIC_SCAN_PAGE_SIZE],
    [2, HAS_PUBLIC_SCAN_PAGE_SIZE],
    [3, HAS_PUBLIC_SCAN_PAGE_SIZE],
  ]);

  const none = query(rejected);
  assert.equal(await hasPublicDocument(none.findPage), false);
  assert.equal(
    none.calls.length,
    1 + Math.ceil(60 / HAS_PUBLIC_SCAN_PAGE_SIZE),
  );
});
