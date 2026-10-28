import assert from "node:assert/strict";
import test from "node:test";
import { collectPhotoFacets } from "./photo-facets";
import {
  clampPhotoPage,
  createDistrictPhotoConditions,
  createPhotoCategoryConditions,
  createPhotoListConditions,
  createRelatedPhotoConditions,
  normalizeRequestedPage,
  PHOTO_LIST_PAGE_SIZE,
} from "./photo-query-conditions";
import {
  getVerifiedDistrictImage,
  verifiedDistrictImages,
} from "./verified-district-images";

const now = new Date("2026-10-28T12:00:00Z");
const published = [
  { _status: { equals: "published" } },
  { publishedAt: { less_than_equal: "2026-10-28T12:00:00.000Z" } },
];

test("list filters run in the database", () => {
  assert.deepEqual(createPhotoListConditions(now, {}), published);
  assert.deepEqual(
    createPhotoListConditions(now, { collection: "istanbul", tag: "kule" }),
    [
      ...published,
      { "collections.slug": { equals: "istanbul" } },
      { "tags.slug": { equals: "kule" } },
    ],
  );
});

test("workspace sections match a collection or a tag", () => {
  assert.deepEqual(createPhotoCategoryConditions(now, "sokak"), [
    ...published,
    {
      or: [
        { "collections.slug": { equals: "sokak" } },
        { "tags.slug": { equals: "sokak" } },
      ],
    },
  ]);
});

test("district pages filter photos by district", () => {
  assert.deepEqual(createDistrictPhotoConditions(now, "kadikoy"), [
    ...published,
    { district: { equals: "kadikoy" } },
  ]);
});

test("related photos share a collection or tag and exclude the photo itself", () => {
  const photo = {
    id: "p1",
    collections: [
      { id: "c1", title: "A", slug: "a", parentId: null, sortOrder: 0 },
    ],
    tags: [{ id: "t1", title: "T", slug: "t" }],
  };

  assert.deepEqual(createRelatedPhotoConditions(now, photo), [
    ...published,
    { id: { not_equals: "p1" } },
    { or: [{ collections: { in: ["c1"] } }, { tags: { in: ["t1"] } }] },
  ]);
  assert.equal(
    createRelatedPhotoConditions(now, { id: "p1", collections: [], tags: [] }),
    null,
  );
});

test("page numbers are normalized and clamped", () => {
  assert.equal(PHOTO_LIST_PAGE_SIZE, 24);
  assert.equal(normalizeRequestedPage(undefined), 1);
  assert.equal(normalizeRequestedPage(Number.NaN), 1);
  assert.equal(normalizeRequestedPage(-3), 1);
  assert.equal(normalizeRequestedPage(2.7), 2);
  assert.deepEqual(clampPhotoPage(5, 50), { page: 3, totalPages: 3 });
  assert.deepEqual(clampPhotoPage(2, 0), { page: 1, totalPages: 1 });
});

test("facets list each used collection and tag once, sorted", () => {
  const facets = collectPhotoFacets(
    [
      {
        collections: [
          { id: "c2", title: "Sokak", slug: "sokak", sortOrder: 2 },
          { id: "c1", title: "İstanbul", slug: "istanbul", sortOrder: 1 },
        ],
        tags: [{ id: "t2", title: "Vapur", slug: "vapur" }],
      },
      {
        collections: [
          { id: "c1", title: "İstanbul", slug: "istanbul", sortOrder: 1 },
          "unpopulated",
        ],
        tags: [
          { id: "t1", title: "Kule", slug: "kule" },
          { id: "t3", title: "" },
        ],
      },
      null,
    ],
    "tr",
  );

  assert.deepEqual(
    facets.collections.map((item) => item.id),
    ["c1", "c2"],
  );
  assert.deepEqual(
    facets.tags.map((item) => item.id),
    ["t1", "t2"],
  );
});

test("verified district images have English alt text and credit", () => {
  for (const [district, image] of Object.entries(verifiedDistrictImages)) {
    assert.notEqual(image.altEn.trim(), "", district);
    assert.notEqual(image.altEn, image.alt, district);
    assert.notEqual(image.creditEn.trim(), "", district);
    assert.equal(getVerifiedDistrictImage(district, "en")?.alt, image.altEn);
    assert.equal(getVerifiedDistrictImage(district, "tr")?.alt, image.alt);
    assert.equal(
      getVerifiedDistrictImage(district, "en")?.licenseUrl,
      image.licenseUrl,
    );
  }
  assert.equal(getVerifiedDistrictImage("toString", "en"), null);
  assert.equal(getVerifiedDistrictImage("adalar", "tr"), null);
});
