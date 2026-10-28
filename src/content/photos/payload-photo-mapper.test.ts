import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { Photo } from "../../payload-types";
import { mediaDocument } from "../rich-text/lexical-fixtures";
import { mapPayloadPhoto } from "./payload-photo-mapper";

const now = new Date("2026-10-28T12:00:00Z");

const collection = {
  id: "col-1",
  title: "İstanbul",
  slug: "istanbul",
  parent: "col-root",
  sortOrder: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

// Loose overrides and a cast keep the fixture compiling when the schema grows.
function photo(overrides: Record<string, unknown> = {}): Photo {
  return {
    id: "photo-1",
    title: "Galata akşamüstü",
    slug: "galata-aksamustu",
    altText: "Galata Kulesi akşam ışığında",
    image: mediaDocument,
    collections: [collection, "unpopulated"],
    tags: [{ id: "t1", title: "Kule", slug: "kule" }],
    district: "beyoglu",
    photographer: "  ",
    creditLicense: "Tüm hakları saklıdır",
    publishedAt: "2026-10-01T09:00:00Z",
    createdAt: "2026-10-01T09:00:00Z",
    updatedAt: "2026-10-01T09:00:00Z",
    _status: "published",
    ...overrides,
  } as Photo;
}

function silence(t: TestContext) {
  return t.mock.method(console, "warn", () => {});
}

test("a published photo maps with collections, tags and defaults", (t) => {
  silence(t);
  const mapped = mapPayloadPhoto(photo(), "tr", now);

  assert.ok(mapped);
  assert.deepEqual(mapped.image, {
    src: mediaDocument.url,
    alt: "Galata Kulesi akşam ışığında",
    width: 1600,
    height: 900,
  });
  assert.deepEqual(mapped.collections, [
    {
      id: "col-1",
      title: "İstanbul",
      slug: "istanbul",
      parentId: "col-root",
      sortOrder: 1,
    },
  ]);
  assert.equal(mapped.photographer, "Şaban Durali");
  assert.equal(mapped.creditLicense, "Tüm hakları saklıdır");
  assert.equal(mapped.seo.title, "Galata akşamüstü");
});

test("photos that cannot be shown publicly are skipped and logged", (t) => {
  const warn = silence(t);

  for (const overrides of [
    { _status: "draft" },
    { publishedAt: "2026-12-01T00:00:00Z" },
    { altText: "" },
    { image: { ...mediaDocument, mimeType: "application/pdf" } },
    { image: "media-1" },
    { collections: ["unpopulated"] },
  ]) {
    assert.equal(mapPayloadPhoto(photo(overrides), "en", now), null);
  }

  assert.equal(warn.mock.callCount(), 6);
  assert.match(String(warn.mock.calls[0]?.arguments[0]), /"scope":"photos"/);
});
