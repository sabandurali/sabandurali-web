/** Verified historical district photo importer. Defaults to a read-only dry-run. */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { getPayload, type Payload } from "payload";
import sharp from "sharp";
import {
  describeProductionDatabase,
  readProductionMigrationState,
} from "../vercel-build.mjs";
import {
  applyHistoricalPlan,
  assertHistoricalEnvironment,
  buildHistoricalPlan,
  configurationStatus,
  historicalAlt,
  historicalDescription,
  historicalFilename,
  HistoricalBatch1Error,
  type HistoricalBatch1Item,
  type HistoricalBatch1Manifest,
  type HistoricalDocument,
  type HistoricalRepository,
  type HistoricalSnapshot,
  validateHistoricalManifest,
  verifyDownloadedBytes,
} from "./historical-district-batch1-core";

const downloadDirectory = "/tmp/historical-district-photos";

function payloadRepository(payload: Payload): HistoricalRepository {
  return {
    async readSnapshot(): Promise<HistoricalSnapshot> {
      const [collections, media, photos] = await Promise.all([
        payload.find({
          collection: "photo-collections",
          depth: 0,
          fallbackLocale: false,
          limit: 1000,
          locale: "tr",
          overrideAccess: true,
          pagination: false,
        }),
        payload.find({
          collection: "media",
          depth: 0,
          limit: 1000,
          overrideAccess: true,
          pagination: false,
        }),
        payload.find({
          collection: "photos",
          depth: 0,
          draft: true,
          fallbackLocale: false,
          limit: 1000,
          locale: "tr",
          overrideAccess: true,
          pagination: false,
        }),
      ]);
      return {
        collections: collections.docs as unknown as HistoricalDocument[],
        media: media.docs as unknown as HistoricalDocument[],
        photos: photos.docs as unknown as HistoricalDocument[],
      };
    },
    async createCollection(data) {
      return (await payload.create({
        collection: "photo-collections",
        data: data as never,
        draft: false,
        locale: "tr",
        overrideAccess: true,
      })) as unknown as HistoricalDocument;
    },
    async updateCollectionEnglish(id, data) {
      await payload.update({
        collection: "photo-collections",
        data,
        id,
        locale: "en",
        overrideAccess: true,
      });
    },
    async createMedia(item, filePath) {
      return (await payload.create({
        collection: "media",
        data: {
          alt: historicalAlt(item),
          description: historicalDescription(item),
          sourceCopyright: item.requiredAttribution,
        },
        filePath,
        overrideAccess: true,
      })) as unknown as HistoricalDocument;
    },
    async createPhoto(data) {
      return (await payload.create({
        collection: "photos",
        data: data as never,
        draft: false,
        locale: "tr",
        overrideAccess: true,
      })) as unknown as HistoricalDocument;
    },
    async deletePhoto(id) {
      await payload.delete({ collection: "photos", id, overrideAccess: true });
    },
    async deleteMedia(id) {
      await payload.delete({ collection: "media", id, overrideAccess: true });
    },
    async deleteCollection(id) {
      await payload.delete({ collection: "photo-collections", id, overrideAccess: true });
    },
  };
}

async function downloadAndVerify(
  item: HistoricalBatch1Item,
): Promise<string> {
  const response = await fetch(item.downloadUrl, {
    headers: { "User-Agent": "sabandurali.com historical-photo verifier/1.0" },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new HistoricalBatch1Error("remote_changed", "A historical source file is no longer available.");
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  verifyDownloadedBytes(item, bytes);
  const metadata = await sharp(bytes).metadata();
  if (
    metadata.format !== "jpeg" ||
    metadata.width !== item.width ||
    metadata.height !== item.height
  ) {
    throw new HistoricalBatch1Error("remote_changed", "Historical source image metadata changed after audit.");
  }
  await mkdir(downloadDirectory, { recursive: true });
  const filePath = path.join(downloadDirectory, historicalFilename(item));
  await writeFile(filePath, bytes);
  return filePath;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      apply: { type: "boolean" },
      "dry-run": { type: "boolean" },
      verify: { type: "boolean" },
      manifest: {
        type: "string",
        default: "data/districts/historical-photo-batch1.json",
      },
    },
    strict: true,
  });
  const selectedModes = [values.apply, values["dry-run"], values.verify].filter(Boolean).length;
  if (selectedModes > 1) {
    throw new HistoricalBatch1Error("configuration_failed", "Choose only one Historical Batch 1 mode.");
  }
  const mode = values.apply ? "apply" : values.verify ? "verify" : "dry-run";
  assertHistoricalEnvironment(process.env, mode);
  describeProductionDatabase(process.env.DATABASE_URL!);

  const migrationState = await readProductionMigrationState(process.env);
  if (
    migrationState.pendingMigrationNames.length !== 0 ||
    migrationState.appliedCount !== migrationState.registeredCount
  ) {
    throw new HistoricalBatch1Error("configuration_failed", "Production schema is not at the registered migration baseline.");
  }

  const manifest = JSON.parse(
    await readFile(values.manifest!, "utf8"),
  ) as HistoricalBatch1Manifest;
  validateHistoricalManifest(manifest);

  const downloaded = new Map<string, string>();
  for (const item of manifest.items) {
    downloaded.set(item.recordUrl, await downloadAndVerify(item));
  }

  const { default: configPromise } = await import("../../src/payload.config");
  const config = await configPromise;
  config.typescript.autoGenerate = false;
  const payload = await getPayload({ config });
  try {
    const repository = payloadRepository(payload);
    const plan =
      mode === "apply"
        ? await applyHistoricalPlan(manifest, repository, downloaded)
        : buildHistoricalPlan(manifest, await repository.readSnapshot());
    if (plan.count.conflict > 0) {
      throw new HistoricalBatch1Error("conflict", "Historical Batch 1 plan contains conflicts.");
    }
    if (
      mode === "verify" &&
      (plan.count.collectionCreate !== 0 ||
        plan.count.mediaCreate !== 0 ||
        plan.count.photoCreate !== 0 ||
        plan.count.skip !== manifest.items.length)
    ) {
      throw new HistoricalBatch1Error("verify_failed", "Historical Batch 1 is not fully applied.");
    }
    console.log(
      JSON.stringify({
        mode,
        ...plan.count,
        writes:
          mode === "apply"
            ? plan.count.collectionCreate + plan.count.mediaCreate + plan.count.photoCreate
            : 0,
        districts: plan.entries.map(({ item }) => item.district),
      }),
    );
  } finally {
    await payload.destroy();
  }
}

main().catch((error) => {
  const category =
    error instanceof HistoricalBatch1Error ? error.category : "unknown_failed";
  console.error(
    JSON.stringify({
      error: category,
      ...((category === "configuration_failed" || category === "approval_failed") && {
        configuration: configurationStatus(process.env),
      }),
    }),
  );
  process.exitCode = 1;
});
