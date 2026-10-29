/**
 * Batch-independent engine of the verified historical district photo
 * importers: manifest validation, planning, SHA-bound approval gates, apply
 * and verify. Each batch supplies a `HistoricalBatchConfig` in its own
 * `historical-district-batch<N>-config.ts`; the engine never defaults to one.
 */
import { createHash } from "node:crypto";
import type { RequiredDataFromCollectionSlug } from "payload";
import { districts } from "../../src/content/districts/district-registry";
import { normalizeSlug } from "../../src/lib/localizedSlug";

/** What `payload.create` accepts for each collection the importer writes. */
export type HistoricalPhotoData = RequiredDataFromCollectionSlug<"photos">;
export type HistoricalCollectionData =
  RequiredDataFromCollectionSlug<"photo-collections">;
type PhotoDistrict = NonNullable<HistoricalPhotoData["district"]>;

function isPhotoDistrict(value: string): value is PhotoDistrict {
  return districts.some((district) => district.slug === value);
}

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
    description:
      "Verified historical archive photographs of Istanbul districts.",
  },
} as const;

export type HistoricalBatchConfig = {
  name: string;
  label: string;
  districts: readonly string[];
  envPrefix: string;
  requireExistingCollection: boolean;
};

const allowedLicenses = new Set([
  "Public domain",
  "No known restrictions on publication",
  "No known restrictions on publication / Public domain",
  "CC0",
  "CC BY",
  "CC BY-SA",
]);

export type HistoricalPhotoItem = {
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

export type HistoricalPhotoManifest = {
  schemaVersion: number;
  batch: string;
  auditedAt: string;
  items: HistoricalPhotoItem[];
};

export type HistoricalDocument = Record<string, unknown> & {
  id: string;
};

export type HistoricalSnapshot = {
  collections: HistoricalDocument[];
  media: HistoricalDocument[];
  photos: HistoricalDocument[];
};

export type HistoricalPlanEntry = {
  item: HistoricalPhotoItem;
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
  createCollection(data: HistoricalCollectionData): Promise<HistoricalDocument>;
  updateCollectionEnglish(
    id: string,
    data: HistoricalCollectionData,
  ): Promise<void>;
  createMedia(
    item: HistoricalPhotoItem,
    filePath: string,
  ): Promise<HistoricalDocument>;
  createPhoto(data: HistoricalPhotoData): Promise<HistoricalDocument>;
  deletePhoto(id: string): Promise<void>;
  deleteMedia(id: string): Promise<void>;
  deleteCollection(id: string): Promise<void>;
};

export class HistoricalPhotoImportError extends Error {
  readonly category:
    | "approval_failed"
    | "configuration_failed"
    | "input_failed"
    | "remote_changed"
    | "conflict"
    | "write_failed"
    | "cleanup_failed"
    | "verify_failed";

  constructor(
    category: HistoricalPhotoImportError["category"],
    message: string,
  ) {
    super(message);
    this.name = "HistoricalPhotoImportError";
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
  return (
    relationId(a) !== undefined &&
    String(relationId(a)) === String(relationId(b))
  );
}

function containsSource(
  document: HistoricalDocument,
  item: HistoricalPhotoItem,
): boolean {
  return [document.sourceCopyright, document.creditLicense].some(
    (value) => typeof value === "string" && value.includes(item.recordUrl),
  );
}

export function historicalFilename(item: HistoricalPhotoItem): string {
  return `historical-${item.district}-${item.sha256.slice(0, 12)}.jpg`;
}

export function historicalAlt(item: HistoricalPhotoItem): string {
  return `${item.depictedPlace}, ${item.approximateDate} tarihî görünümü`;
}

export function historicalDescription(item: HistoricalPhotoItem): string {
  return `${item.depictedPlace}. Yaklaşık tarih: ${item.approximateDate}.`;
}

export function historicalNeighborhood(
  item: HistoricalPhotoItem,
): string | null {
  const safe: Readonly<Partial<Record<string, string>>> = {
    bakirkoy: "Yeşilköy",
    besiktas: "Bebek",
    sariyer: "Tarabya",
  };
  return safe[item.district] ?? null;
}

export function validateHistoricalManifest(
  manifest: HistoricalPhotoManifest,
  batchConfig: HistoricalBatchConfig,
): void {
  if (
    manifest.schemaVersion !== 1 ||
    manifest.batch !== batchConfig.name ||
    manifest.items.length !== batchConfig.districts.length
  ) {
    throw new HistoricalPhotoImportError(
      "input_failed",
      `${batchConfig.label} manifest header is invalid.`,
    );
  }
  const knownDistricts = new Set(districts.map(({ slug }) => slug));
  const expectedDistricts = new Set<string>(batchConfig.districts);
  const seenDistricts = new Set<string>();
  const seenRecords = new Set<string>();
  const seenDownloads = new Set<string>();
  const seenTitles = new Set<string>();
  for (const item of manifest.items) {
    if (!item.publicationSafe || !allowedLicenses.has(item.license)) {
      throw new HistoricalPhotoImportError(
        "input_failed",
        "Manifest contains an unsafe rights entry.",
      );
    }
    if (
      !knownDistricts.has(item.district) ||
      !expectedDistricts.has(item.district)
    ) {
      throw new HistoricalPhotoImportError(
        "input_failed",
        "Manifest contains an unexpected district.",
      );
    }
    if (seenDistricts.has(item.district)) {
      throw new HistoricalPhotoImportError(
        "input_failed",
        "Manifest contains a duplicate district.",
      );
    }
    if (
      !item.recordUrl.startsWith("https://") ||
      !item.downloadUrl.startsWith("https://")
    ) {
      throw new HistoricalPhotoImportError(
        "input_failed",
        "Manifest URLs must use HTTPS.",
      );
    }
    if (!/^[a-f0-9]{64}$/.test(item.sha256)) {
      throw new HistoricalPhotoImportError(
        "input_failed",
        "Manifest SHA-256 is invalid.",
      );
    }
    if (
      item.mimeType !== "image/jpeg" ||
      item.bytes <= 0 ||
      item.width <= 0 ||
      item.height <= 0
    ) {
      throw new HistoricalPhotoImportError(
        "input_failed",
        "Manifest image metadata is invalid.",
      );
    }
    const normalizedTitle = `${item.district}:${item.title.trim().toLocaleLowerCase("tr-TR")}`;
    if (
      seenRecords.has(item.recordUrl) ||
      seenDownloads.has(item.downloadUrl) ||
      seenTitles.has(normalizedTitle)
    ) {
      throw new HistoricalPhotoImportError(
        "input_failed",
        "Manifest contains a duplicate source or title.",
      );
    }
    seenDistricts.add(item.district);
    seenRecords.add(item.recordUrl);
    seenDownloads.add(item.downloadUrl);
    seenTitles.add(normalizedTitle);
  }
  if ([...expectedDistricts].some((district) => !seenDistricts.has(district))) {
    throw new HistoricalPhotoImportError(
      "input_failed",
      "Manifest district set is incomplete.",
    );
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

/**
 * Exact identity of an imported Media document with its audited manifest
 * item, including the original file size and dimensions.
 *
 * Since Phase B the Media collection re-encodes every image (long edge capped
 * at 3200 px, EXIF removed; `src/collections/Media.ts`). Records imported
 * before that keep the original bytes and still match. An import into a
 * fresh database, however, stores a re-encoded file, and a later
 * dry-run or verify reports every item as "source media metadata differs"
 * (`filesize` always, `width`/`height` for the two batch 1 items above
 * 3200 px). This is deliberate: relaxing the comparison would let the gate
 * adopt a file it cannot prove to be the audited one (PROJECT-STATE §K, rule
 * 11), so the comparison stays exact. See PROJECT-STATE §L.
 */
function mediaMatches(
  document: HistoricalDocument,
  item: HistoricalPhotoItem,
): boolean {
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
  item: HistoricalPhotoItem,
  media: HistoricalDocument,
  collection: HistoricalDocument,
): boolean {
  const collections = Array.isArray(document.collections)
    ? document.collections
    : [];
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
  manifest: HistoricalPhotoManifest,
  snapshot: HistoricalSnapshot,
  batchConfig: HistoricalBatchConfig,
): HistoricalPlan {
  validateHistoricalManifest(manifest, batchConfig);
  const collections = snapshot.collections.filter(collectionMatches);
  const collection = collections.length === 1 ? collections[0] : undefined;
  const collectionAction =
    collections.length === 0
      ? batchConfig.requireExistingCollection
        ? "conflict"
        : "create"
      : collections.length === 1
        ? "skip"
        : "conflict";
  const entries: HistoricalPlanEntry[] = manifest.items.map((item) => {
    const mediaCandidates = snapshot.media.filter((document) =>
      containsSource(document, item),
    );
    if (mediaCandidates.length > 1) {
      return {
        item,
        media: "conflict",
        photo: "conflict",
        reason: "duplicate source media",
      };
    }
    const existingMedia = mediaCandidates[0];
    if (existingMedia && !mediaMatches(existingMedia, item)) {
      return {
        item,
        media: "conflict",
        photo: "conflict",
        existingMedia,
        reason: "source media metadata differs",
      };
    }
    const photoCandidates = snapshot.photos.filter(
      (document) =>
        containsSource(document, item) ||
        (document.district === item.district && document.title === item.title),
    );
    if (photoCandidates.length > 1) {
      return {
        item,
        media: existingMedia ? "skip" : "create",
        photo: "conflict",
        existingMedia,
        reason: "duplicate source photo",
      };
    }
    const existingPhoto = photoCandidates[0];
    if (existingPhoto) {
      if (
        !existingMedia ||
        !collection ||
        !photoMatches(existingPhoto, item, existingMedia, collection)
      ) {
        return {
          item,
          media: existingMedia ? "skip" : "create",
          photo: "conflict",
          existingMedia,
          existingPhoto,
          reason: "source photo metadata differs",
        };
      }
      return {
        item,
        media: "skip",
        photo: "skip",
        existingMedia,
        existingPhoto,
      };
    }
    return {
      item,
      media: existingMedia ? "skip" : "create",
      photo: "create",
      existingMedia,
    };
  });
  const conflict =
    (collectionAction === "conflict" ? 1 : 0) +
    entries.filter(
      (entry) => entry.media === "conflict" || entry.photo === "conflict",
    ).length;
  return {
    collection: collectionAction,
    existingCollection: collection,
    count: {
      collectionCreate: collectionAction === "create" ? 1 : 0,
      mediaCreate: entries.filter((entry) => entry.media === "create").length,
      photoCreate: entries.filter((entry) => entry.photo === "create").length,
      skip: entries.filter(
        (entry) => entry.media === "skip" && entry.photo === "skip",
      ).length,
      conflict,
    },
    entries,
  };
}

export function makeHistoricalPhotoData(
  item: HistoricalPhotoItem,
  mediaId: string,
  collectionId: string,
): HistoricalPhotoData {
  if (!isPhotoDistrict(item.district)) {
    throw new HistoricalPhotoImportError(
      "input_failed",
      "Historical photo district is not a registered Istanbul district.",
    );
  }
  return {
    title: item.title,
    // The value the slug hook derives from the title; explicit because the
    // create type requires it.
    slug: normalizeSlug(item.title),
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
  batchConfig: HistoricalBatchConfig,
): void {
  if (
    env.PAYLOAD_DATABASE !== "postgres" ||
    env.PAYLOAD_STORAGE !== "vercel-blob" ||
    !env.DATABASE_URL ||
    !env.PAYLOAD_SECRET ||
    !env.BLOB_READ_WRITE_TOKEN
  ) {
    throw new HistoricalPhotoImportError(
      "configuration_failed",
      "Production PostgreSQL and Vercel Blob configuration is required.",
    );
  }
  const retired = retiredHistoricalApprovalVariables(env, batchConfig);
  if (retired.length > 0) {
    throw new HistoricalPhotoImportError(
      "approval_failed",
      `${batchConfig.label} refuses retired boolean approvals; remove ${retired.join(", ")}.`,
    );
  }
  const shaBound =
    env.VERCEL === "1" &&
    env.VERCEL_ENV === "production" &&
    env.VERCEL_GIT_COMMIT_REF === "main" &&
    Boolean(env.VERCEL_GIT_COMMIT_SHA) &&
    env[`${batchConfig.envPrefix}_DRY_RUN_APPROVED_SHA`] ===
      env.VERCEL_GIT_COMMIT_SHA;
  if (!shaBound) {
    throw new HistoricalPhotoImportError(
      "approval_failed",
      `${batchConfig.label} requires SHA-bound Production approval.`,
    );
  }
  // Apply needs its own import approval and a PITR confirmation, each bound to
  // the deployed commit like the migration gate (PROJECT-STATE §K rules 4-5):
  // approving a later commit means verifying PITR again.
  if (
    mode === "apply" &&
    (env[`${batchConfig.envPrefix}_IMPORT_APPROVED_SHA`] !==
      env.VERCEL_GIT_COMMIT_SHA ||
      env[`${batchConfig.envPrefix}_PITR_CONFIRMED_SHA`] !==
        env.VERCEL_GIT_COMMIT_SHA)
  ) {
    throw new HistoricalPhotoImportError(
      "approval_failed",
      `${batchConfig.label} apply requires import and PITR approvals bound to the deployed SHA.`,
    );
  }
}

/**
 * The boolean `<prefix>_IMPORT_APPROVED` and `<prefix>_PITR_CONFIRMED` are
 * retired, like the build's boolean `PRODUCTION_PITR_CONFIRMED` (§K.1): a
 * forgotten `true` would approve every later commit. The importer refuses to
 * run in any mode while one of them is still set.
 */
export function retiredHistoricalApprovalVariables(
  env: Readonly<Record<string, string | undefined>>,
  batchConfig: HistoricalBatchConfig,
): string[] {
  return [
    `${batchConfig.envPrefix}_IMPORT_APPROVED`,
    `${batchConfig.envPrefix}_PITR_CONFIRMED`,
  ].filter((name) => env[name] !== undefined);
}

function shaApprovalStatus(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): "PRESENT_VALID" | "PRESENT_INVALID" | "MISSING" {
  const value = env[name];
  if (!value) return "MISSING";
  return env.VERCEL_GIT_COMMIT_SHA && value === env.VERCEL_GIT_COMMIT_SHA
    ? "PRESENT_VALID"
    : "PRESENT_INVALID";
}

export function configurationStatus(
  env: Readonly<Record<string, string | undefined>>,
  batchConfig: HistoricalBatchConfig,
) {
  const required = [
    "DATABASE_URL",
    "PAYLOAD_SECRET",
    "BLOB_READ_WRITE_TOKEN",
  ] as const;
  return {
    PAYLOAD_DATABASE:
      env.PAYLOAD_DATABASE === "postgres"
        ? "PRESENT_VALID"
        : env.PAYLOAD_DATABASE
          ? "PRESENT_INVALID"
          : "MISSING",
    PAYLOAD_STORAGE:
      env.PAYLOAD_STORAGE === "vercel-blob"
        ? "PRESENT_VALID"
        : env.PAYLOAD_STORAGE
          ? "PRESENT_INVALID"
          : "MISSING",
    ...Object.fromEntries(
      required.map((name) => [name, env[name] ? "PRESENT_VALID" : "MISSING"]),
    ),
    VERCEL_ENV:
      env.VERCEL_ENV === "production"
        ? "PRESENT_VALID"
        : env.VERCEL_ENV
          ? "PRESENT_INVALID"
          : "MISSING",
    VERCEL_GIT_COMMIT_REF:
      env.VERCEL_GIT_COMMIT_REF === "main"
        ? "PRESENT_VALID"
        : env.VERCEL_GIT_COMMIT_REF
          ? "PRESENT_INVALID"
          : "MISSING",
    SHA_APPROVAL:
      env.VERCEL_GIT_COMMIT_SHA &&
      env[`${batchConfig.envPrefix}_DRY_RUN_APPROVED_SHA`] ===
        env.VERCEL_GIT_COMMIT_SHA
        ? "PRESENT_VALID"
        : "PRESENT_INVALID",
    IMPORT_APPROVAL: shaApprovalStatus(
      env,
      `${batchConfig.envPrefix}_IMPORT_APPROVED_SHA`,
    ),
    PITR_CONFIRMATION: shaApprovalStatus(
      env,
      `${batchConfig.envPrefix}_PITR_CONFIRMED_SHA`,
    ),
    RETIRED_BOOLEAN_APPROVALS:
      retiredHistoricalApprovalVariables(env, batchConfig).length > 0
        ? "PRESENT_INVALID"
        : "ABSENT",
  };
}

export function verifyDownloadedBytes(
  item: HistoricalPhotoItem,
  bytes: Uint8Array,
): void {
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength !== item.bytes || digest !== item.sha256) {
    throw new HistoricalPhotoImportError(
      "remote_changed",
      "A historical source file changed after audit.",
    );
  }
}

export async function applyHistoricalPlan(
  manifest: HistoricalPhotoManifest,
  repository: HistoricalRepository,
  filePaths: ReadonlyMap<string, string>,
  batchConfig: HistoricalBatchConfig,
): Promise<HistoricalPlan> {
  const plan = buildHistoricalPlan(
    manifest,
    await repository.readSnapshot(),
    batchConfig,
  );
  if (plan.count.conflict > 0) {
    throw new HistoricalPhotoImportError(
      "conflict",
      `${batchConfig.label} plan contains a conflict.`,
    );
  }
  const createdPhotos: string[] = [];
  const createdMedia: string[] = [];
  let createdCollection: HistoricalDocument | undefined;
  try {
    const collection =
      plan.existingCollection ??
      (createdCollection = await repository.createCollection(
        historicalCollection.tr,
      ));
    if (createdCollection) {
      await repository.updateCollectionEnglish(
        collection.id,
        historicalCollection.en,
      );
    }
    for (const entry of plan.entries) {
      let media = entry.existingMedia;
      if (!media) {
        const filePath = filePaths.get(entry.item.recordUrl);
        if (!filePath)
          throw new HistoricalPhotoImportError(
            "input_failed",
            "Verified local source file is missing.",
          );
        media = await repository.createMedia(entry.item, filePath);
        createdMedia.push(media.id);
      }
      if (entry.photo === "create") {
        const photo = await repository.createPhoto(
          makeHistoricalPhotoData(entry.item, media.id, collection.id),
        );
        createdPhotos.push(photo.id);
      }
    }
    const verified = buildHistoricalPlan(
      manifest,
      await repository.readSnapshot(),
      batchConfig,
    );
    if (
      verified.count.conflict !== 0 ||
      verified.count.collectionCreate !== 0 ||
      verified.count.mediaCreate !== 0 ||
      verified.count.photoCreate !== 0 ||
      verified.count.skip !== manifest.items.length
    ) {
      throw new HistoricalPhotoImportError(
        "verify_failed",
        "Historical Batch 1 post-apply verification failed.",
      );
    }
  } catch (error) {
    try {
      for (const id of createdPhotos.reverse())
        await repository.deletePhoto(id);
      for (const id of createdMedia.reverse()) await repository.deleteMedia(id);
      if (createdCollection)
        await repository.deleteCollection(createdCollection.id);
    } catch {
      throw new HistoricalPhotoImportError(
        "cleanup_failed",
        "Historical Batch 1 compensating cleanup failed.",
      );
    }
    if (error instanceof HistoricalPhotoImportError) throw error;
    throw new HistoricalPhotoImportError(
      "write_failed",
      "Historical Batch 1 write failed and created records were cleaned up.",
    );
  }
  return plan;
}
