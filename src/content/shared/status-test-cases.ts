import assert from "node:assert/strict";

/*
 * Test support for the fail-closed `_status` check of every Payload mapper.
 * Only the exact value "published" is public; a mapper that tests for
 * `=== "draft"` instead would let these through.
 */
export const nonPublishedStatuses: readonly unknown[] = [
  undefined,
  null,
  "",
  "draft",
  "changed",
  "Published",
  " published",
  true,
];

/**
 * Asserts that `map` withholds a document for every non-published status.
 * `map` builds an otherwise public document with the given `_status`.
 */
export function assertWithheldForNonPublishedStatuses(
  map: (status: unknown) => unknown,
): void {
  for (const status of nonPublishedStatuses) {
    assert.equal(map(status), null, `_status ${JSON.stringify(status)}`);
  }
}
