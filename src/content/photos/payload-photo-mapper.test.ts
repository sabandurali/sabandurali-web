import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import {
  assertWithheldForNonPublishedStatuses,
  nonPublishedStatuses,
} from "../shared/status-test-cases";
import type { Photo } from "../../payload-types";
import { mediaDocument } from "../rich-text/lexical-fixtures";
import {
  mapPayloadPhoto,
  toPublicPhotoTranslation,
} from "./payload-photo-mapper";

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
    tags: [
      {
        id: "t1",
        title: "Kule",
        slug: "kule",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ],
    district: "beyoglu",
    photographer: "Şaban Durali",
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

test("a published photo maps with collections, tags and its credit", (t) => {
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
  assert.equal(mapped.seo.title, "Galata akşamüstü | Şaban Durali");
});

test("SEO-PERF-1: a photo without caption or SEO description still has a meta description", (t) => {
  silence(t);
  const bare = mapPayloadPhoto(photo(), "tr", now);
  assert.ok(bare);
  assert.equal(bare.seo.description, "Galata Kulesi akşam ışığında");

  const long = "Galata Kulesi akşam ışığında, Haliç üzerinden bakış. ".repeat(
    6,
  );
  const captioned = mapPayloadPhoto(photo({ description: long }), "tr", now);
  assert.ok(captioned);
  assert.ok(captioned.seo.description.length <= 160);
  // The page itself still shows the full caption.
  assert.equal(captioned.description, long.trim());

  const explicit = mapPayloadPhoto(
    photo({ seo: { metaTitle: "Galata", metaDescription: "Elle yazıldı." } }),
    "tr",
    now,
  );
  assert.ok(explicit);
  assert.equal(explicit.seo.title, "Galata");
  assert.equal(explicit.seo.description, "Elle yazıldı.");
});

test("a translation link carries only identity, title and slug", (t) => {
  silence(t);
  const mapped = mapPayloadPhoto(photo(), "en", now);

  assert.ok(mapped);
  assert.deepEqual(toPublicPhotoTranslation(mapped), {
    id: "photo-1",
    language: "en",
    title: "Galata akşamüstü",
    slug: "galata-aksamustu",
  });
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

test("CORRECTNESS-2: no photographer name is invented", (t) => {
  const warn = silence(t);

  for (const photographer of [undefined, null, "", "  "]) {
    assert.equal(mapPayloadPhoto(photo({ photographer }), "tr", now), null);
  }
  assert.equal(warn.mock.callCount(), 4);
  assert.match(
    String(warn.mock.calls[0]?.arguments[0]),
    /photographer is missing/,
  );
});

test("CORRECTNESS-2: a historical photo needs its real creator and licence", (t) => {
  const warn = silence(t);
  const historical = (overrides: Record<string, unknown>) =>
    mapPayloadPhoto(
      photo({ districtPhotoCategory: "tarih", ...overrides }),
      "tr",
      now,
    );

  // The collection default credits the owner: an archive photo is not his.
  assert.equal(
    historical({ photographer: "Şaban Durali", creditLicense: "CC BY 4.0" }),
    null,
  );
  for (const creditLicense of [undefined, null, "", "  "]) {
    assert.equal(
      historical({ photographer: "Arşiv Fotoğrafçısı", creditLicense }),
      null,
    );
  }
  assert.equal(warn.mock.callCount(), 5);

  const credited = historical({
    photographer: "Arşiv Fotoğrafçısı",
    creditLicense: "CC BY 4.0",
  });
  assert.ok(credited);
  assert.equal(credited.photographer, "Arşiv Fotoğrafçısı");
  assert.equal(credited.creditLicense, "CC BY 4.0");
});

test("TESTS-INFRA-2: only the exact published status is public", (t) => {
  const warn = silence(t);

  assertWithheldForNonPublishedStatuses((_status) =>
    mapPayloadPhoto(photo({ _status }), "tr", now),
  );
  assert.equal(warn.mock.callCount(), nonPublishedStatuses.length);
  assert.match(String(warn.mock.calls[0]?.arguments[0]), /status/);
});
