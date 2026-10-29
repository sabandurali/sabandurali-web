import assert from "node:assert/strict";
import { test } from "node:test";
import { resolvePublishedAt } from "./publishedAt";

const now = new Date("2026-10-29T08:00:00.000Z");
const earlier = "2026-03-01T10:00:00.000Z";

test("first publication without a date gets the current time", () => {
  assert.equal(
    resolvePublishedAt({ _status: "published" }, { _status: "draft" }, now),
    now.toISOString(),
  );
  assert.equal(
    resolvePublishedAt(
      { _status: "published", publishedAt: null },
      undefined,
      now,
    ),
    now.toISOString(),
  );
});

test("an emptied date on a published record keeps the stored date", () => {
  for (const publishedAt of [null, "", "   ", undefined]) {
    assert.equal(
      resolvePublishedAt(
        { _status: "published", publishedAt },
        { _status: "published", publishedAt: earlier },
        now,
      ),
      earlier,
      String(publishedAt),
    );
  }
});

test("a published record whose stored date is missing gets the current time", () => {
  assert.equal(
    resolvePublishedAt(
      { _status: "published", publishedAt: null },
      { _status: "published", publishedAt: null },
      now,
    ),
    now.toISOString(),
  );
});

test("an explicit date and drafts are left as the editor entered them", () => {
  assert.equal(
    resolvePublishedAt(
      { _status: "published", publishedAt: "2027-01-01T00:00:00.000Z" },
      { _status: "published", publishedAt: earlier },
      now,
    ),
    "2027-01-01T00:00:00.000Z",
  );
  assert.equal(
    resolvePublishedAt(
      { _status: "draft", publishedAt: null },
      { _status: "published", publishedAt: earlier },
      now,
    ),
    null,
  );
});
