import assert from "node:assert/strict";
import test from "node:test";
import { selectSameDistrictPhotos } from "./district-photo-selection";
import type { PublicPhoto } from "./types";

function photo(
  id: string,
  district: string | null,
  language: "tr" | "en" = "tr",
): PublicPhoto {
  return {
    id,
    language,
    title: id,
    slug: id,
    description: null,
    image: { src: `/api/media/file/${id}.jpg`, alt: id },
    collections: [],
    tags: [],
    takenAt: null,
    locationName: null,
    district,
    neighborhood: null,
    districtPhotoCategory: null,
    dayPeriod: null,
    photographer: "Şaban Durali",
    creditLicense: null,
    exif: {
      camera: null,
      lens: null,
      focalLength: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
    },
    featured: false,
    publishedAt: "2026-06-01T09:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
    seo: { title: "", description: "", openGraphImage: null },
  };
}

test("PHOTO-DETAIL-POLISH: same-district photos skip the photo and the related ones", () => {
  const current = photo("a", "kadikoy");
  const candidates = [
    current,
    photo("b", "kadikoy"),
    photo("c", "kadikoy"),
    photo("d", "besiktas"),
    photo("e", "kadikoy", "en"),
    photo("f", "kadikoy"),
  ];
  assert.deepEqual(
    selectSameDistrictPhotos(current, candidates, [photo("c", "kadikoy")]).map(
      (item) => item.id,
    ),
    ["b", "f"],
  );
});

test("PHOTO-DETAIL-POLISH: same-district photos are capped and need a district", () => {
  const current = photo("a", "kadikoy");
  const many = ["b", "c", "d", "e", "f", "g"].map((id) => photo(id, "kadikoy"));
  assert.equal(selectSameDistrictPhotos(current, many).length, 4);
  assert.deepEqual(selectSameDistrictPhotos(photo("x", null), many), []);
});
