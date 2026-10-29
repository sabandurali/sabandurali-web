import assert from "node:assert/strict";
import test from "node:test";
import {
  clampPage,
  collectMappedPages,
  getReadBatchSize,
  normalizeRequestedPage,
  readClampedPage,
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

/**
 * A list of `total` items read like Payload reads a joined query: a page
 * past the end has no documents and a total of 0.
 */
function payloadLikeList(total: number, pageSize: number) {
  const reads: number[] = [];
  const read = async (page: number) => {
    reads.push(page);
    const start = (page - 1) * pageSize;
    const docs = Array.from(
      { length: Math.max(0, Math.min(pageSize, total - start)) },
      (_, index) => start + index,
    );
    return { docs, totalDocs: docs.length === 0 ? 0 : total };
  };
  return { read, reads };
}

test("ARCHITECTURE-9: readClampedPage reads a page that exists once", async () => {
  const list = payloadLikeList(25, 10);
  const page = await readClampedPage(
    list.read,
    ({ docs }) => docs.length,
    3,
    10,
  );

  assert.deepEqual(list.reads, [3]);
  assert.deepEqual(page, {
    result: { docs: [20, 21, 22, 23, 24], totalDocs: 25 },
    page: 3,
    totalPages: 3,
    totalItems: 25,
  });
});

test("ARCHITECTURE-9: a page past the end reads the total, then the last page", async () => {
  const list = payloadLikeList(25, 10);
  const page = await readClampedPage(
    list.read,
    ({ docs }) => docs.length,
    9,
    10,
  );

  assert.deepEqual(list.reads, [9, 1, 3]);
  assert.deepEqual(page.result.docs, [20, 21, 22, 23, 24]);
  assert.equal(page.page, 3);
  assert.equal(page.totalPages, 3);
  assert.equal(page.totalItems, 25);
});

test("ARCHITECTURE-9: past the end of a one-page or empty list shows page 1", async () => {
  const short = payloadLikeList(4, 10);
  const shortPage = await readClampedPage(
    short.read,
    ({ docs }) => docs.length,
    5,
    10,
  );
  assert.deepEqual(short.reads, [5, 1]);
  assert.deepEqual(shortPage.result.docs, [0, 1, 2, 3]);
  assert.equal(shortPage.page, 1);

  const empty = payloadLikeList(0, 10);
  assert.deepEqual(
    await readClampedPage(empty.read, ({ docs }) => docs.length, 2, 10),
    {
      result: { docs: [], totalDocs: 0 },
      page: 1,
      totalPages: 1,
      totalItems: 0,
    },
  );
  assert.deepEqual(empty.reads, [2, 1]);

  // Page 1 of an empty list already holds the real total: one read.
  const emptyFirst = payloadLikeList(0, 10);
  assert.equal(
    (await readClampedPage(emptyFirst.read, ({ docs }) => docs.length, 1, 10))
      .totalPages,
    1,
  );
  assert.deepEqual(emptyFirst.reads, [1]);

  const invalid = payloadLikeList(25, 10);
  assert.equal(
    (
      await readClampedPage(
        invalid.read,
        ({ docs }) => docs.length,
        Number.NaN,
        10,
      )
    ).page,
    1,
  );
  assert.deepEqual(invalid.reads, [1]);
});
