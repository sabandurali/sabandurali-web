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
  historicalCollection,
  historicalDescription,
  type HistoricalBatch1Item,
  type HistoricalBatch1Manifest,
  type HistoricalDocument,
  type HistoricalRepository,
  type HistoricalSnapshot,
  validateHistoricalManifest,
  verifyDownloadedBytes,
} from "./historical-district-batch1-core";
import {
  historicalBatch2Config,
  historicalBatch2Districts,
} from "./historical-district-batch2-config";

function readManifest(): HistoricalBatch1Manifest {
  return JSON.parse(
    readFileSync("data/districts/historical-photo-batch2.json", "utf8"),
  ) as HistoricalBatch1Manifest;
}

class MemoryRepository implements HistoricalRepository {
  snapshot: HistoricalSnapshot;
  created = { collection: 0, media: 0, photo: 0 };
  deleted: Array<string | number> = [];
  failPhoto = false;
  nextId = 100;

  constructor(snapshot: HistoricalSnapshot) {
    this.snapshot = structuredClone(snapshot);
  }

  async readSnapshot() { return structuredClone(this.snapshot); }
  async createCollection(): Promise<HistoricalDocument> {
    this.created.collection++;
    throw new Error("Batch 2 must never create a collection");
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

const existingCollection: HistoricalDocument = {
  id: "historical-collection",
  title: historicalCollection.tr.title,
  slug: historicalCollection.tr.slug,
};

function repositoryWithCollection(extra: Partial<HistoricalSnapshot> = {}) {
  return new MemoryRepository({
    collections: [existingCollection],
    media: [],
    photos: [],
    ...extra,
  });
}

function fileMap(manifest: HistoricalBatch1Manifest): Map<string, string> {
  return new Map(manifest.items.map((item) => [item.recordUrl, `/tmp/${item.district}.jpg`]));
}

function historicalPublicPhoto(): PublicPhoto {
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
    district: "sile",
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
  };
}

test("A: Batch 2 manifest is safe and contains the exact verified district set", () => {
  const manifest = readManifest();
  assert.doesNotThrow(() => validateHistoricalManifest(manifest, historicalBatch2Config));
  assert.deepEqual(new Set(manifest.items.map(({ district }) => district)), new Set(historicalBatch2Districts));
  assert.ok(manifest.items.every((item) => item.publicationSafe && /^[a-f0-9]{64}$/.test(item.sha256)));
  assert.ok(manifest.items.every((item) => !/NC|ND|All rights reserved/i.test(item.license)));
});

test("B: Batch 2 rejects duplicate sources", () => {
  const duplicate = structuredClone(readManifest());
  duplicate.items[1].recordUrl = duplicate.items[0].recordUrl;
  assert.throws(() => validateHistoricalManifest(duplicate, historicalBatch2Config), /duplicate source or title/);
});

test("C: Batch 2 requires the existing historical collection", async () => {
  const plan = buildHistoricalPlan(readManifest(), { collections: [], media: [], photos: [] }, historicalBatch2Config);
  assert.deepEqual(plan.count, { collectionCreate: 0, mediaCreate: 4, photoCreate: 4, skip: 0, conflict: 1 });
});

test("D: first dry-run is 0 collection, 4 media, 4 photos and zero conflicts", async () => {
  const repository = repositoryWithCollection();
  const plan = buildHistoricalPlan(readManifest(), await repository.readSnapshot(), historicalBatch2Config);
  assert.deepEqual(plan.count, { collectionCreate: 0, mediaCreate: 4, photoCreate: 4, skip: 0, conflict: 0 });
});

test("E: a completed apply is idempotent and preserves the existing collection", async () => {
  const manifest = readManifest();
  const repository = repositoryWithCollection();
  await applyHistoricalPlan(manifest, repository, fileMap(manifest), historicalBatch2Config);
  const second = buildHistoricalPlan(manifest, await repository.readSnapshot(), historicalBatch2Config);
  assert.deepEqual(second.count, { collectionCreate: 0, mediaCreate: 0, photoCreate: 0, skip: 4, conflict: 0 });
  assert.equal(repository.created.collection, 0);
  assert.ok(repository.snapshot.collections.some(({ id }) => id === existingCollection.id));
});

test("F: SHA mismatch fails before any write", () => {
  const repository = repositoryWithCollection();
  assert.throws(() => verifyDownloadedBytes(readManifest().items[0], new Uint8Array([1, 2, 3])), /changed after audit/);
  assert.deepEqual(repository.created, { collection: 0, media: 0, photo: 0 });
});

test("G: failed apply removes only Batch 2 media and keeps existing records", async () => {
  const keepMedia: HistoricalDocument = { id: "keep-media", sourceCopyright: "unrelated" };
  const keepPhoto: HistoricalDocument = { id: "keep-photo", title: "unrelated" };
  const repository = repositoryWithCollection({ media: [keepMedia], photos: [keepPhoto] });
  repository.failPhoto = true;
  const manifest = readManifest();
  await assert.rejects(() => applyHistoricalPlan(manifest, repository, fileMap(manifest), historicalBatch2Config), /cleaned up/);
  assert.ok(repository.snapshot.collections.some(({ id }) => id === existingCollection.id));
  assert.ok(repository.snapshot.media.some(({ id }) => id === keepMedia.id));
  assert.ok(repository.snapshot.photos.some(({ id }) => id === keepPhoto.id));
  assert.ok(!repository.deleted.includes(existingCollection.id));
  assert.ok(!repository.deleted.includes(keepMedia.id));
  assert.ok(!repository.deleted.includes(keepPhoto.id));
});

test("H: Batch 2 uses distinct SHA-bound apply approvals", () => {
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
    PRODUCTION_HISTORICAL_PHOTO_BATCH2_DRY_RUN_APPROVED_SHA: sha,
  };
  assert.doesNotThrow(() => assertHistoricalEnvironment(base, "dry-run", historicalBatch2Config));
  assert.throws(() => assertHistoricalEnvironment(base, "apply", historicalBatch2Config), /import and PITR approvals/);
  assert.doesNotThrow(() => assertHistoricalEnvironment({
    ...base,
    PRODUCTION_HISTORICAL_PHOTO_BATCH2_IMPORT_APPROVED: "true",
    PRODUCTION_HISTORICAL_PHOTO_BATCH2_PITR_CONFIRMED: "true",
  }, "apply", historicalBatch2Config));
});

test("I: Batch 2 historical photo remains gallery-only and never becomes hero", () => {
  const historical = historicalPublicPhoto();
  assert.equal(selectDistrictHeroPhoto([historical]), undefined);
  assert.deepEqual(selectDistrictGalleryPhotos([historical], undefined), [historical]);
});
