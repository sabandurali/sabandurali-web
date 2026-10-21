import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  selectDistrictGalleryPhotos,
  selectDistrictHeroPhoto,
} from "../../src/content/photos/district-photo-selection";
import type { PublicPhoto } from "../../src/content/photos/types";
import {
  applyHistoricalPlan,
  assertHistoricalEnvironment,
  buildHistoricalPlan,
  historicalAlt,
  historicalBatch1Districts,
  historicalCollection,
  historicalDescription,
  makeHistoricalPhotoData,
  type HistoricalBatch1Item,
  type HistoricalBatch1Manifest,
  type HistoricalDocument,
  type HistoricalRepository,
  type HistoricalSnapshot,
  validateHistoricalManifest,
  verifyDownloadedBytes,
} from "./historical-district-batch1-core";

function readManifest(): HistoricalBatch1Manifest {
  return JSON.parse(
    readFileSync("data/districts/historical-photo-batch1.json", "utf8"),
  ) as HistoricalBatch1Manifest;
}

function historicalPublicPhoto(overrides: Partial<PublicPhoto> = {}): PublicPhoto {
  return {
    id: "historical",
    language: "tr",
    title: "Tarihî fotoğraf",
    slug: "tarihi-fotograf",
    description: "Yaklaşık tarih: 1900.",
    image: { src: "/historical.jpg", alt: "Tarihî görünüm" },
    collections: [],
    tags: [],
    takenAt: null,
    locationName: "İstanbul",
    district: "fatih",
    neighborhood: null,
    districtPhotoCategory: "tarih",
    dayPeriod: null,
    photographer: "Bilinmiyor",
    creditLicense: "Public domain",
    exif: { camera: null, lens: null, focalLength: null, aperture: null, shutterSpeed: null, iso: null },
    featured: false,
    publishedAt: "2026-09-26T00:00:00Z",
    createdAt: "2026-09-26T00:00:00Z",
    updatedAt: "2026-09-26T00:00:00Z",
    seo: { title: "", description: "", openGraphImage: null },
    ...overrides,
  };
}

class MemoryRepository implements HistoricalRepository {
  snapshot: HistoricalSnapshot;
  created = { collection: 0, media: 0, photo: 0 };
  deleted: Array<string | number> = [];
  failPhoto = false;
  nextId = 100;

  constructor(snapshot: HistoricalSnapshot = { collections: [], media: [], photos: [] }) {
    this.snapshot = structuredClone(snapshot);
  }

  async readSnapshot() { return structuredClone(this.snapshot); }
  async createCollection(data: Record<string, unknown>) {
    this.created.collection++;
    const document = { id: this.nextId++, ...data };
    this.snapshot.collections.push(document);
    return structuredClone(document);
  }
  async updateCollectionEnglish() {}
  async createMedia(item: HistoricalBatch1Item) {
    this.created.media++;
    const document = {
      id: this.nextId++,
      alt: historicalAlt(item),
      description: historicalDescription(item),
      sourceCopyright: item.requiredAttribution,
      mimeType: item.mimeType,
      filesize: item.bytes,
      width: item.width,
      height: item.height,
    };
    this.snapshot.media.push(document);
    return structuredClone(document);
  }
  async createPhoto(data: Record<string, unknown>) {
    if (this.failPhoto) throw new Error("fixture photo failure");
    this.created.photo++;
    const document = { id: this.nextId++, ...data };
    this.snapshot.photos.push(document);
    return structuredClone(document);
  }
  async deletePhoto(id: string | number) {
    this.deleted.push(id);
    this.snapshot.photos = this.snapshot.photos.filter((document) => document.id !== id);
  }
  async deleteMedia(id: string | number) {
    this.deleted.push(id);
    this.snapshot.media = this.snapshot.media.filter((document) => document.id !== id);
  }
  async deleteCollection(id: string | number) {
    this.deleted.push(id);
    this.snapshot.collections = this.snapshot.collections.filter((document) => document.id !== id);
  }
}

function fileMap(manifest: HistoricalBatch1Manifest): Map<string, string> {
  return new Map(manifest.items.map((item) => [item.recordUrl, `/tmp/${item.district}.jpg`]));
}

test("A: manifest contains only publication-safe allowed rights", () => {
  const manifest = readManifest();
  assert.doesNotThrow(() => validateHistoricalManifest(manifest));
  assert.ok(manifest.items.every((item) => item.publicationSafe));
  assert.ok(manifest.items.every((item) => !/NC|ND|All rights reserved/i.test(item.license)));
});

test("B: manifest has the exact 11 district matches", () => {
  assert.deepEqual(new Set(readManifest().items.map(({ district }) => district)), new Set(historicalBatch1Districts));
});

test("C: source and download URLs are HTTPS", () => {
  assert.ok(readManifest().items.every((item) => item.recordUrl.startsWith("https://") && item.downloadUrl.startsWith("https://")));
});

test("D: every source identity has a SHA-256 hash", () => {
  assert.ok(readManifest().items.every((item) => /^[a-f0-9]{64}$/.test(item.sha256)));
});

test("E: manifest rejects duplicate URLs and district-title pairs", () => {
  const manifest = readManifest();
  const duplicate = structuredClone(manifest);
  duplicate.items[1].downloadUrl = duplicate.items[0].downloadUrl;
  assert.throws(() => validateHistoricalManifest(duplicate), /duplicate source or title/);
});

test("F: imported historical photo metadata is never featured", () => {
  const item = readManifest().items[0];
  const data = makeHistoricalPhotoData(item, 1, 2);
  assert.equal(data.featured, false);
  assert.equal(data.districtPhotoCategory, "tarih");
  assert.equal(data.takenAt, null);
  assert.equal(data.dayPeriod, null);
});

test("G: an unfeatured historical photo is not selected as hero", () => {
  const historical = historicalPublicPhoto();
  assert.equal(selectDistrictHeroPhoto([historical]), undefined);
  assert.deepEqual(selectDistrictGalleryPhotos([historical], undefined), [historical]);
});

test("H: an existing normal photo remains the fallback hero", () => {
  const historical = historicalPublicPhoto();
  const normal = historicalPublicPhoto({ id: "normal", districtPhotoCategory: "sokak", title: "Normal" });
  assert.equal(selectDistrictHeroPhoto([historical, normal])?.id, "normal");
  assert.deepEqual(selectDistrictGalleryPhotos([historical, normal], normal).map(({ id }) => id), ["historical"]);
});

test("I: initial dry-run is exactly 1 collection, 11 media, 11 photos and zero writes", async () => {
  const plan = buildHistoricalPlan(readManifest(), await new MemoryRepository().readSnapshot());
  assert.deepEqual(plan.count, { collectionCreate: 1, mediaCreate: 11, photoCreate: 11, skip: 0, conflict: 0 });
});

test("J: a completed apply is idempotent and verifies as all skip", async () => {
  const manifest = readManifest();
  const repository = new MemoryRepository();
  await applyHistoricalPlan(manifest, repository, fileMap(manifest));
  const writes = structuredClone(repository.created);
  const second = buildHistoricalPlan(manifest, await repository.readSnapshot());
  assert.deepEqual(second.count, { collectionCreate: 0, mediaCreate: 0, photoCreate: 0, skip: 11, conflict: 0 });
  assert.deepEqual(repository.created, writes);
});

test("K: remote SHA mismatch fails before any repository write", () => {
  const repository = new MemoryRepository();
  assert.throws(() => verifyDownloadedBytes(readManifest().items[0], new Uint8Array([1, 2, 3])), /changed after audit/);
  assert.deepEqual(repository.created, { collection: 0, media: 0, photo: 0 });
});

test("L: photo creation failure removes only records created by this run", async () => {
  const manifest = readManifest();
  const repository = new MemoryRepository();
  repository.failPhoto = true;
  await assert.rejects(() => applyHistoricalPlan(manifest, repository, fileMap(manifest)), /cleaned up/);
  assert.deepEqual(repository.snapshot, { collections: [], media: [], photos: [] });
  assert.equal(repository.deleted.length, 2);
});

test("M: compensating cleanup never deletes pre-existing media or photos", async () => {
  const existingMedia: HistoricalDocument = { id: "keep-media", sourceCopyright: "unrelated" };
  const existingPhoto: HistoricalDocument = { id: "keep-photo", title: "unrelated" };
  const repository = new MemoryRepository({ collections: [], media: [existingMedia], photos: [existingPhoto] });
  repository.failPhoto = true;
  const manifest = readManifest();
  await assert.rejects(() => applyHistoricalPlan(manifest, repository, fileMap(manifest)));
  assert.ok(repository.snapshot.media.some(({ id }) => id === existingMedia.id));
  assert.ok(repository.snapshot.photos.some(({ id }) => id === existingPhoto.id));
  assert.ok(!repository.deleted.includes(existingMedia.id));
  assert.ok(!repository.deleted.includes(existingPhoto.id));
});

test("N: public photo metadata omits private audit and raw source fields", () => {
  const data = makeHistoricalPhotoData(readManifest().items[0], 1, 2);
  for (const privateField of ["sha256", "bytes", "downloadUrl", "rightsStatement", "auditedAt", "publicationSafe"]) {
    assert.equal(privateField in data, false);
  }
});

test("O: apply approvals are separate and SHA-bound", () => {
  const sha = "a".repeat(40);
  const base = {
    PAYLOAD_DATABASE: "postgres",
    PAYLOAD_STORAGE: "vercel-blob",
    DATABASE_URL: "postgresql://fixture.invalid/neondb",
    PAYLOAD_SECRET: "fixture",
    BLOB_READ_WRITE_TOKEN: "fixture",
    VERCEL: "1",
    VERCEL_ENV: "production",
    VERCEL_GIT_COMMIT_REF: "main",
    VERCEL_GIT_COMMIT_SHA: sha,
    PRODUCTION_HISTORICAL_PHOTO_BATCH1_DRY_RUN_APPROVED_SHA: sha,
  };
  assert.doesNotThrow(() => assertHistoricalEnvironment(base, "dry-run"));
  assert.throws(() => assertHistoricalEnvironment(base, "apply"), /import and PITR approvals/);
  assert.doesNotThrow(() => assertHistoricalEnvironment({
    ...base,
    PRODUCTION_HISTORICAL_PHOTO_BATCH1_IMPORT_APPROVED: "true",
    PRODUCTION_HISTORICAL_PHOTO_BATCH1_PITR_CONFIRMED: "true",
  }, "apply"));
  assert.throws(() => assertHistoricalEnvironment({ ...base, PRODUCTION_HISTORICAL_PHOTO_BATCH1_DRY_RUN_APPROVED_SHA: "b".repeat(40) }, "dry-run"), /SHA-bound/);
  assert.equal(historicalCollection.tr.title, "Tarihi İstanbul");
  assert.equal(historicalCollection.en.title, "Historic Istanbul");
});
