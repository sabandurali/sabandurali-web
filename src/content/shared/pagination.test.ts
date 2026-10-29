import assert from "node:assert/strict";
import test from "node:test";
import {
  clampPage,
  collectMappedPages,
  getReadBatchSize,
  normalizeRequestedPage,
} from "./pagination";

function pages(...contents: number[][]) {
  const reads: number[] = [];
  const read = async (page: number) => {
    reads.push(page);
    return { items: contents[page - 1] ?? [], totalPages: contents.length };
  };
  return { reads, read };
}

test("ARCHITECTURE-2: every page is read without a limit", async () => {
  const { reads, read } = pages([1, 2], [3], [4, 5]);

  assert.deepEqual(await collectMappedPages(read), [1, 2, 3, 4, 5]);
  assert.deepEqual(reads, [1, 2, 3]);
});

test("ARCHITECTURE-2: a limited read stops once enough items survive", async () => {
  const { reads, read } = pages([1, 2], [3, 4], [5]);

  assert.deepEqual(await collectMappedPages(read, 3), [1, 2, 3]);
  assert.deepEqual(reads, [1, 2]);
});

test("ARCHITECTURE-2: rejected records only cost a page when they leave the result short", async () => {
  // The mapper rejected everything on page 1.
  const { reads, read } = pages([], [7], [8]);

  assert.deepEqual(await collectMappedPages(read, 1), [7]);
  assert.deepEqual(reads, [1, 2]);
});

test("ARCHITECTURE-2: an empty collection is one read", async () => {
  const reads: number[] = [];
  const result = await collectMappedPages(async (page) => {
    reads.push(page);
    return { items: [], totalPages: 0 };
  });

  assert.deepEqual(result, []);
  assert.deepEqual(reads, [1]);
});

test("ARCHITECTURE-2: limited reads ask for at least ten rows", () => {
  assert.equal(getReadBatchSize(undefined, 100), 100);
  assert.equal(getReadBatchSize(1, 100), 10);
  assert.equal(getReadBatchSize(24, 100), 24);
  assert.equal(getReadBatchSize(500, 100), 100);
});

test("ARCHITECTURE-2: requested pages are whole and clamped to the last page", () => {
  assert.equal(normalizeRequestedPage(undefined), 1);
  assert.equal(normalizeRequestedPage(Number.NaN), 1);
  assert.equal(normalizeRequestedPage(-3), 1);
  assert.equal(normalizeRequestedPage(2.7), 2);
  assert.deepEqual(clampPage(5, 50, 24), { page: 3, totalPages: 3 });
  assert.deepEqual(clampPage(2, 0, 24), { page: 1, totalPages: 1 });
  assert.deepEqual(clampPage(undefined, 30, 10), { page: 1, totalPages: 3 });
});
