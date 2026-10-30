import assert from "node:assert/strict";
import test from "node:test";
import {
  clampPaginationPage,
  getPaginationEntries,
  type PaginationEntry,
} from "./pagination-entries";

function render(entries: PaginationEntry[]): string {
  return entries
    .map((entry) => (entry.type === "gap" ? "…" : String(entry.page)))
    .join(" ");
}

test("short lists show every page", () => {
  assert.equal(render(getPaginationEntries(1, 1)), "1");
  assert.equal(render(getPaginationEntries(2, 5)), "1 2 3 4 5");
});

test("long lists keep first, last and the current neighbourhood", () => {
  assert.equal(render(getPaginationEntries(1, 20)), "1 2 … 20");
  assert.equal(render(getPaginationEntries(10, 20)), "1 … 9 10 11 … 20");
  assert.equal(render(getPaginationEntries(20, 20)), "1 … 19 20");
  assert.equal(
    render(getPaginationEntries(10, 20, 2)),
    "1 … 8 9 10 11 12 … 20",
  );
});

test("a gap never hides a single page", () => {
  assert.equal(render(getPaginationEntries(4, 7)), "1 2 3 4 5 6 7");
  assert.equal(render(getPaginationEntries(5, 9)), "1 … 4 5 6 … 9");
});

test("out-of-range input is clamped and gap keys are unique", () => {
  assert.equal(render(getPaginationEntries(99, 3)), "1 2 3");
  assert.equal(render(getPaginationEntries(-4, 3)), "1 2 3");
  assert.deepEqual(getPaginationEntries(1, 0), []);
  assert.equal(clampPaginationPage(7, 3), 3);
  assert.equal(clampPaginationPage(0, 3), 1);
  assert.equal(clampPaginationPage(2, 0), 0);
  const keys = getPaginationEntries(10, 20)
    .filter((entry) => entry.type === "gap")
    .map((entry) => entry.key);
  assert.equal(new Set(keys).size, keys.length);
});
