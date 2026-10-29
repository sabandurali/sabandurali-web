import assert from "node:assert/strict";
import test from "node:test";
import {
  excerpt,
  isIstanbulPhoto,
  newestPublicationFirst,
  pickFeaturedDistrict,
  selectHomePhotos,
  selectLatest,
} from "./home-selection";

const dated = (id: string, publishedAt: string | null) => ({ id, publishedAt });

test("selectLatest keeps the newest items first, undated and invalid last", () => {
  const items = [
    dated("old", "2025-01-01T00:00:00.000Z"),
    dated("none", null),
    dated("new", "2026-10-01T00:00:00.000Z"),
    dated("bad", "not a date"),
    dated("mid", "2026-03-01T00:00:00.000Z"),
  ];

  assert.deepEqual(
    selectLatest(items, 3).map((item) => item.id),
    ["new", "mid", "old"],
  );
  assert.equal(items[0]?.id, "old", "the input is not reordered");
  assert.deepEqual(selectLatest(items, 0), []);
  assert.deepEqual(selectLatest(items, -1), []);
  assert.ok(
    newestPublicationFirst(
      dated("new", "2026-10-01T00:00:00.000Z"),
      dated("old", "2025-01-01T00:00:00.000Z"),
    ) < 0,
  );
});

const photo = (
  id: string,
  publishedAt: string,
  extra: Partial<{
    district: string | null;
    districtPhotoCategory: string | null;
    collections: { slug: string }[];
  }> = {},
) => ({
  id,
  publishedAt,
  district: null,
  districtPhotoCategory: null,
  collections: [],
  ...extra,
});

test("Istanbul photos lead the home selection, newest first within each group", () => {
  const photos = [
    photo("nature-new", "2026-10-01T00:00:00.000Z"),
    photo("district", "2026-01-01T00:00:00.000Z", { district: "esenler" }),
    photo("history", "2026-02-01T00:00:00.000Z", {
      districtPhotoCategory: "tarih",
    }),
    photo("architecture", "2025-05-01T00:00:00.000Z", {
      collections: [{ slug: "mimari" }],
    }),
    photo("animals", "2026-09-01T00:00:00.000Z"),
  ];

  assert.equal(
    isIstanbulPhoto(photo("plain", "2026-01-01T00:00:00.000Z")),
    false,
  );
  assert.equal(
    isIstanbulPhoto(
      photo("m", "2026-01-01T00:00:00.000Z", {
        collections: [{ slug: "istanbul-mimari" }],
      }),
    ),
    true,
  );
  assert.deepEqual(
    selectHomePhotos(photos, 4).map((item) => item.id),
    ["history", "district", "architecture", "nature-new"],
  );
});

test("pickFeaturedDistrict prefers a published guide with a verified photo", () => {
  const summaries = new Map([
    ["arnavutkoy", "Arnavutköy özeti."],
    ["esenler", "Esenler özeti."],
    ["kadikoy", "Kadıköy özeti."],
  ]);
  const withImage = new Set(["esenler", "kadikoy"]);

  const picked = pickFeaturedDistrict(summaries, (slug) => withImage.has(slug));
  assert.ok(picked === "esenler" || picked === "kadikoy");
  // Stable: the same input gives the same district, whatever the map order.
  const reversed = new Map([...summaries.entries()].reverse());
  assert.equal(
    pickFeaturedDistrict(reversed, (slug) => withImage.has(slug)),
    picked,
  );
});

test("pickFeaturedDistrict ignores unknown districts and empty summaries", () => {
  assert.equal(
    pickFeaturedDistrict(new Map(), () => true),
    null,
  );
  assert.equal(
    pickFeaturedDistrict(
      new Map([
        ["atlantis", "Bilinmeyen."],
        ["esenler", "   "],
      ]),
      () => true,
    ),
    null,
  );
  assert.equal(
    pickFeaturedDistrict(new Map([["sisli", "Şişli özeti."]]), () => false),
    "sisli",
  );
});

test("excerpt keeps whole words and marks a cut with an ellipsis", () => {
  assert.equal(excerpt("  Kısa   metin. "), "Kısa metin.");
  const long =
    "İstanbul’un kuzeybatısında, Karadeniz kıyısından göle uzanan ilçe";
  const cut = excerpt(long, 30);
  assert.ok(cut.length <= 30);
  assert.ok(cut.endsWith("…"));
  assert.ok(long.startsWith(cut.slice(0, -1)));
  assert.doesNotMatch(cut, /,…$/);
});
