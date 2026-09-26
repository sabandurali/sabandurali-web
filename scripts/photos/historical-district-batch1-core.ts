import { createHash } from "node:crypto";
import { districts } from "../../src/content/districts/district-registry";

export const historicalBatch1Name = "historical-district-photos-batch1";
export const historicalCollection = {
  tr: {
    title: "Tarihi İstanbul",
    slug: "tarihi-istanbul",
    description:
      "İstanbul'un ilçelerine ilişkin hak durumu doğrulanmış tarihî fotoğraf ve kartpostallar.",
  },
  en: {
    title: "Historic Istanbul",
    slug: "historic-istanbul",
    description: "Verified historical archive photographs of Istanbul districts.",
  },
} as const;

export const historicalBatch1Districts = [
  "bakirkoy",
  "besiktas",
  "beyoglu",
  "eyupsultan",
  "fatih",
  "kagithane",
  "sariyer",
  "adalar",
  "beykoz",
  "kadikoy",
  "uskudar",
] as const;

const allowedLicenses = new Set([
  "Public domain",
  "No known restrictions on publication",
  "No known restrictions on publication / Public domain",
  "CC0",
  "CC BY",
  "CC BY-SA",
]);

export type HistoricalBatch1Item = {
  district: string;
  title: string;
  depictedPlace: string;
  approximateDate: string;
  creator: string;
  archive: string;
  recordUrl: string;
  downloadUrl: string;
  license: string;
  rightsStatement: string;
  requiredAttribution: string;
  sha256: string;
  bytes: number;
  mimeType: string;
  width: number;
  height: number;
  auditedAt: string;
  publicationSafe: boolean;
};

export type HistoricalBatch1Manifest = {
  schemaVersion: number;
  batch: string;
  auditedAt: string;
  items: HistoricalBatch1Item[];
};

export type HistoricalDocument = Record<string, unknown> & {
  id: number | string;
};

export type HistoricalSnapshot = {
  collections: HistoricalDocument[];
  media: HistoricalDocument[];
  photos: HistoricalDocument[];
};

export type HistoricalPlanEntry = {
  item: HistoricalBatch1Item;
  media: "create" | "skip" | "conflict";
  photo: "create" | "skip" | "conflict";
  existingMedia?: HistoricalDocument;
  existingPhoto?: HistoricalDocument;
  reason?: string;
};

export type HistoricalPlan = {
  collection: "create" | "skip" | "conflict";
  existingCollection?: HistoricalDocument;
  count: {
    collectionCreate: number;
    mediaCreate: number;
    photoCreate: number;
    skip: number;
    conflict: number;
  };
  entries: HistoricalPlanEntry[];
};

export type HistoricalRepository = {
  readSnapshot(): Promise<HistoricalSnapshot>;
  createCollection(data: Record<string, unknown>): Promise<HistoricalDocument>;
  updateCollectionEnglish(id: number | string, data: Record<string, unknown>): Promise<void>;
  createMedia(item: HistoricalBatch1Item, filePath: string): Promise<HistoricalDocument>;
  createPhoto(data: Record<string, unknown>): Promise<HistoricalDocument>;
  deletePhoto(id: number | string): Promise<void>;
  deleteMedia(id: number | string): Promise<void>;
  deleteCollection(id: number | string): Promise<void>;
};

export class HistoricalBatch1Error extends Error {
  readonly category:
    | "approval_failed"
    | "configuration_failed"
    | "input_failed"
    | "remote_changed"
    | "conflict"
    | "write_failed"
    | "cleanup_failed"
    | "verify_failed";

  constructor(category: HistoricalBatch1Error["category"], message: string) {
    super(message);
    this.name = "HistoricalBatch1Error";
    this.category = category;
  }
}

function text(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function relationId(value: unknown): string | number | undefined {
  if (typeof value === "string" || typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" || typeof id === "number" ? id : undefined;
  }
  return undefined;
}

function sameId(a: unknown, b: unknown): boolean {
  return relationId(a) !== undefined && String(relationId(a)) === String(relationId(b));
}

function containsSource(document: HistoricalDocument, item: HistoricalBatch1Item): boolean {
  return [document.sourceCopyright, document.creditLicense].some(
    (value) => typeof value === "string" && value.includes(item.recordUrl),
  );
}

export function historicalFilename(item: HistoricalBatch1Item): string {
  return `historical-${item.district}-${item.sha256.slice(0, 12)}.jpg`;
}

export function historicalAlt(item: HistoricalBatch1Item): string {
  return `${item.depictedPlace}, ${item.approximateDate} tarihî görünümü`;
}

export function historicalDescription(item: HistoricalBatch1Item): string {
  return `${item.depictedPlace}. Yaklaşık tarih: ${item.approximateDate}.`;
}

export function historicalNeighborhood(item: HistoricalBatch1Item): string | null {
  const safe: Partial<Record<(typeof historicalBatch1Districts)[number], string>> = {
    bakirkoy: "Yeşilköy",
    besiktas: "Bebek",
    sariyer: "Tarabya",
  };
  return safe[item.district as (typeof historicalBatch1Districts)[number]] ?? null;
}

export function validateHistoricalManifest(manifest: HistoricalBatch1Manifest): void {
  if (
    manifest.schemaVersion !== 1 ||
    manifest.batch !== historicalBatch1Name ||
    manifest.items.length !== historicalBatch1Districts.length
  ) {
    throw new HistoricalBatch1Error("input_failed", "Historical Batch 1 manifest header is invalid.");
  }
  const knownDistricts = new Set(districts.map(({ slug }) => slug));
  const expectedDistricts = new Set<string>(historicalBatch1Districts);
  const seenDistricts = new Set<string>();
  const seenRecords = new Set<string>();
  const seenDownloads = new Set<string>();
  const seenTitles = new Set<string>();
  for (const item of manifest.items) {
    if (!item.publicationSafe || !allowedLicenses.has(item.license)) {
      throw new HistoricalBatch1Error("input_failed", "Manifest contains an unsafe rights entry.");
    }
    if (!knownDistricts.has(item.district) || !expectedDistricts.has(item.district)) {
      throw new HistoricalBatch1Error("input_failed", "Manifest contains an unexpected district.");
    }
    if (seenDistricts.has(item.district)) {
      throw new HistoricalBatch1Error("input_failed", "Manifest contains a duplicate district.");
    }
    if (!item.recordUrl.startsWith("https://") || !item.downloadUrl.startsWith("https://")) {
      throw new HistoricalBatch1Error("input_failed", "Manifest URLs must use HTTPS.");
    }
    if (!/^[a-f0-9]{64}$/.test(item.sha256)) {
      throw new HistoricalBatch1Error("input_failed", "Manifest SHA-256 is invalid.");
    }
    if (item.mimeType !== "image/jpeg" || item.bytes <= 0 || item.width <= 0 || item.height <= 0) {
      throw new HistoricalBatch1Error("input_failed", "Manifest image metadata is invalid.");
    }
    const normalizedTitle = `${item.district}:${item.title.trim().toLocaleLowerCase("tr-TR")}`;
    if (seenRecords.has(item.recordUrl) || seenDownloads.has(item.downloadUrl) || seenTitles.has(normalizedTitle)) {
      throw new HistoricalBatch1Error("input_failed", "Manifest contains a duplicate source or title.");
    }
    seenDistricts.add(item.district);
    seenRecords.add(item.recordUrl);
    seenDownloads.add(item.downloadUrl);
    seenTitles.add(normalizedTitle);
  }
  if ([...expectedDistricts].some((district) => !seenDistricts.has(district))) {
    throw new HistoricalBatch1Error("input_failed", "Manifest district set is incomplete.");
  }
}

function collectionMatches(document: HistoricalDocument): boolean {
  return [document.title, document.slug].some(
    (value) =>
      value === historicalCollection.tr.title ||
      value === historicalCollection.en.title ||
      value === historicalCollection.tr.slug ||
      value === historicalCollection.en.slug,
  );
}

function mediaMatches(document: HistoricalDocument, item: HistoricalBatch1Item): boolean {
  return (
    text(document.alt) === historicalAlt(item) &&
    text(document.description) === historicalDescription(item) &&
    text(document.sourceCopyright) === item.requiredAttribution &&
    text(document.mimeType) === item.mimeType &&
    Number(document.filesize) === item.bytes &&
    Number(document.width) === item.width &&
    Number(document.height) === item.height
  );
}

function photoMatches(
  document: HistoricalDocument,
  item: HistoricalBatch1Item,
  media: HistoricalDocument,
  collection: HistoricalDocument,
): boolean {
  const collections = Array.isArray(document.collections) ? document.collections : [];
  return (
    text(document.title) === item.title &&
    text(document.description) === historicalDescription(item) &&
    text(document.altText) === historicalAlt(item) &&
    sameId(document.image, media.id) &&
    collections.some((value) => sameId(value, collection.id)) &&
    text(document.district) === item.district &&
    (document.neighborhood ?? null) === historicalNeighborhood(item) &&
    text(document.districtPhotoCategory) === "tarih" &&
    (document.dayPeriod ?? null) === null &&
    (document.takenAt ?? null) === null &&
    text(document.photographer) === item.creator &&
    text(document.creditLicense) === item.requiredAttribution &&
    document.featured === false &&
    document._status === "published"
  );
}

export function buildHistoricalPlan(
  manifest: HistoricalBatch1Manifest,
  snapshot: HistoricalSnapshot,
): HistoricalPlan {
  validateHistoricalManifest(manifest);
  const collections = snapshot.collections.filter(collectionMatches);
  const collection = collections.length === 1 ? collections[0] : undefined;
  const collectionAction = collections.length === 0 ? "create" : collections.length === 1 ? "skip" : "conflict";
  const entries: HistoricalPlanEntry[] = manifest.items.map((item) => {
    const mediaCandidates = snapshot.media.filter((document) => containsSource(document, item));
    if (mediaCandidates.length > 1) {
      return { item, media: "conflict", photo: "conflict", reason: "duplicate source media" };
    }
    const existingMedia = mediaCandidates[0];
    if (existingMedia && !mediaMatches(existingMedia, item)) {
      return { item, media: "conflict", photo: "conflict", existingMedia, reason: "source media metadata differs" };
    }
    const photoCandidates = snapshot.photos.filter(
      (document) =>
        containsSource(document, item) ||
        (document.district === item.district && document.title === item.title),
    );
    if (photoCandidates.length > 1) {
      return { item, media: existingMedia ? "skip" : "create", photo: "conflict", existingMedia, reason: "duplicate source photo" };
    }
    const existingPhoto = photoCandidates[0];
    if (existingPhoto) {
      if (!existingMedia || !collection || !photoMatches(existingPhoto, item, existingMedia, collection)) {
        return { item, media: existingMedia ? "skip" : "create", photo: "conflict", existingMedia, existingPhoto, reason: "source photo metadata differs" };
      }
      return { item, media: "skip", photo: "skip", existingMedia, existingPhoto };
    }
    return {
      item,
      media: existingMedia ? "skip" : "create",
      photo: "create",
      existingMedia,
    };
  });
  const conflict = (collectionAction === "conflict" ? 1 : 0) + entries.filter((entry) => entry.media === "conflict" || entry.photo === "conflict").length;
  return {
    collection: collectionAction,
    existingCollection: collection,
    count: {
      collectionCreate: collectionAction === "create" ? 1 : 0,
      mediaCreate: entries.filter((entry) => entry.media === "create").length,
      photoCreate: entries.filter((entry) => entry.photo === "create").length,
      skip: entries.filter((entry) => entry.media === "skip" && entry.photo === "skip").length,
      conflict,
    },
    entries,
  };
}

export function makeHistoricalPhotoData(
  item: HistoricalBatch1Item,
  mediaId: number | string,
  collectionId: number | string,
): Record<string, unknown> {
  return {
    title: item.title,
    description: historicalDescription(item),
    altText: historicalAlt(item),
    image: mediaId,
    collections: [collectionId],
    district: item.district,
    neighborhood: historicalNeighborhood(item),
    districtPhotoCategory: "tarih",
    dayPeriod: null,
    tags: [],
    takenAt: null,
    locationName: item.depictedPlace,
    photographer: item.creator,
    creditLicense: item.requiredAttribution,
    featured: false,
    _status: "published",
  };
}

export function assertHistoricalEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  mode: "dry-run" | "apply" | "verify",
): void {
  if (
    env.PAYLOAD_DATABASE !== "postgres" ||
    env.PAYLOAD_STORAGE !== "vercel-blob" ||
    !env.DATABASE_URL ||
    !env.PAYLOAD_SECRET ||
    !env.BLOB_READ_WRITE_TOKEN
  ) {
    throw new HistoricalBatch1Error("configuration_failed", "Production PostgreSQL and Vercel Blob configuration is required.");
  }
  const shaBound =
    env.VERCEL === "1" &&
    env.VERCEL_ENV === "production" &&
    env.VERCEL_GIT_COMMIT_REF === "main" &&
    Boolean(env.VERCEL_GIT_COMMIT_SHA) &&
    env.PRODUCTION_HISTORICAL_PHOTO_BATCH1_DRY_RUN_APPROVED_SHA === env.VERCEL_GIT_COMMIT_SHA;
  if (!shaBound) {
    throw new HistoricalBatch1Error("approval_failed", "Historical Batch 1 requires SHA-bound Production approval.");
  }
  if (
    mode === "apply" &&
    (env.PRODUCTION_HISTORICAL_PHOTO_BATCH1_IMPORT_APPROVED !== "true" ||
      env.PRODUCTION_HISTORICAL_PHOTO_BATCH1_PITR_CONFIRMED !== "true")
  ) {
    throw new HistoricalBatch1Error("approval_failed", "Historical Batch 1 apply requires import and PITR approvals.");
  }
}

export function configurationStatus(env: Readonly<Record<string, string | undefined>>) {
  const required = [
    "DATABASE_URL",
    "PAYLOAD_SECRET",
    "BLOB_READ_WRITE_TOKEN",
  ] as const;
  return {
    PAYLOAD_DATABASE: env.PAYLOAD_DATABASE === "postgres" ? "PRESENT_VALID" : env.PAYLOAD_DATABASE ? "PRESENT_INVALID" : "MISSING",
    PAYLOAD_STORAGE: env.PAYLOAD_STORAGE === "vercel-blob" ? "PRESENT_VALID" : env.PAYLOAD_STORAGE ? "PRESENT_INVALID" : "MISSING",
    ...Object.fromEntries(required.map((name) => [name, env[name] ? "PRESENT_VALID" : "MISSING"])),
    VERCEL_ENV: env.VERCEL_ENV === "production" ? "PRESENT_VALID" : env.VERCEL_ENV ? "PRESENT_INVALID" : "MISSING",
    VERCEL_GIT_COMMIT_REF: env.VERCEL_GIT_COMMIT_REF === "main" ? "PRESENT_VALID" : env.VERCEL_GIT_COMMIT_REF ? "PRESENT_INVALID" : "MISSING",
    SHA_APPROVAL: env.VERCEL_GIT_COMMIT_SHA && env.PRODUCTION_HISTORICAL_PHOTO_BATCH1_DRY_RUN_APPROVED_SHA === env.VERCEL_GIT_COMMIT_SHA ? "PRESENT_VALID" : "PRESENT_INVALID",
    IMPORT_APPROVAL: env.PRODUCTION_HISTORICAL_PHOTO_BATCH1_IMPORT_APPROVED === "true" ? "PRESENT_VALID" : "MISSING",
    PITR_CONFIRMATION: env.PRODUCTION_HISTORICAL_PHOTO_BATCH1_PITR_CONFIRMED === "true" ? "PRESENT_VALID" : "MISSING",
  };
}

export function verifyDownloadedBytes(item: HistoricalBatch1Item, bytes: Uint8Array): void {
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength !== item.bytes || digest !== item.sha256) {
    throw new HistoricalBatch1Error("remote_changed", "A historical source file changed after audit.");
  }
}

export async function applyHistoricalPlan(
  manifest: HistoricalBatch1Manifest,
  repository: HistoricalRepository,
  filePaths: ReadonlyMap<string, string>,
): Promise<HistoricalPlan> {
  const plan = buildHistoricalPlan(manifest, await repository.readSnapshot());
  if (plan.count.conflict > 0) {
    throw new HistoricalBatch1Error("conflict", "Historical Batch 1 plan contains a conflict.");
  }
  const createdPhotos: Array<string | number> = [];
  const createdMedia: Array<string | number> = [];
  let createdCollection: HistoricalDocument | undefined;
  try {
    const collection = plan.existingCollection ?? (createdCollection = await repository.createCollection(historicalCollection.tr));
    if (createdCollection) {
      await repository.updateCollectionEnglish(collection.id, historicalCollection.en);
    }
    for (const entry of plan.entries) {
      let media = entry.existingMedia;
      if (!media) {
        const filePath = filePaths.get(entry.item.recordUrl);
        if (!filePath) throw new HistoricalBatch1Error("input_failed", "Verified local source file is missing.");
        media = await repository.createMedia(entry.item, filePath);
        createdMedia.push(media.id);
      }
      if (entry.photo === "create") {
        const photo = await repository.createPhoto(makeHistoricalPhotoData(entry.item, media.id, collection.id));
        createdPhotos.push(photo.id);
      }
    }
    const verified = buildHistoricalPlan(manifest, await repository.readSnapshot());
    if (
      verified.count.conflict !== 0 ||
      verified.count.collectionCreate !== 0 ||
      verified.count.mediaCreate !== 0 ||
      verified.count.photoCreate !== 0 ||
      verified.count.skip !== manifest.items.length
    ) {
      throw new HistoricalBatch1Error("verify_failed", "Historical Batch 1 post-apply verification failed.");
    }
  } catch (error) {
    try {
      for (const id of createdPhotos.reverse()) await repository.deletePhoto(id);
      for (const id of createdMedia.reverse()) await repository.deleteMedia(id);
      if (createdCollection) await repository.deleteCollection(createdCollection.id);
    } catch {
      throw new HistoricalBatch1Error("cleanup_failed", "Historical Batch 1 compensating cleanup failed.");
    }
    if (error instanceof HistoricalBatch1Error) throw error;
    throw new HistoricalBatch1Error("write_failed", "Historical Batch 1 write failed and created records were cleaned up.");
  }
  return plan;
}
