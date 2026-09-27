import { districts } from "../../src/content/districts/district-registry";
import { projectPublishedDistrictGuide } from "../../src/content/districts/district-guide-projection";
import {
  batch2EditorialSourceCommit,
  batch2ImportVersion,
  makePublishedEditorialUpdate,
} from "./production-editorial-batch2-core";
import {
  fingerprint,
  researchFingerprint,
  type ResearchBundle,
  type ResearchRecord,
} from "./import-core";
import {
  productionImportError,
  type ProductionImportDocument,
  type ProductionImportRepository,
} from "./production-import-core";

export const districtBatch4NineTargets = [
  "kartal",
  "maltepe",
  "pendik",
  "sancaktepe",
  "sultanbeyli",
  "sile",
  "tuzla",
  "umraniye",
  "uskudar",
] as const;
export const districtBatch4NineImportVersion = 8;
export const districtBatch4NineImportBatch = "districtBatch4Nine-editorial-quality-2026";
// Read-only audited Production state immediately before this nine-district
// update. Both hashes must match; the importer never learns a baseline at run time.
const districtBatch4NineProductionBaseline: Record<string, { content: string; source: string }> = {
  kartal: { content: "1a4ccacd51ddcdf996bfcdc540edda748197cbea3ab3523f83da0145158737d2", source: "0402c10ca56f2983d5e462bdbef4e53766f983089814a8f0cb175cf93aaea508" },
  maltepe: { content: "5071978b605ef664c9f490c179fc03a6579a921f0d70dadb6db5ac11d2473543", source: "bd7d6ff460cc86522f575f2dd0c1053987415250077618c181c005417982c7fe" },
  pendik: { content: "736290dc7c2987d8c5f2206139602838fa453923be6dace80cd925231505cb77", source: "3fbeac577bd20851fdb09db5623db743ee34cb9f8c1ff6c1fdedd2fb8583f677" },
  sancaktepe: { content: "0527beb7cc4c15aa722ec032eb5f0cb58fe30443e2d38c02d2dd5d06b20dc25d", source: "e19fabf7b336a1351c1553d8b7f3b3d6a6bf89b7b666d7158c1c8262439ef69b" },
  sultanbeyli: { content: "afa5d84da80b72205bf4ab7539a23dde2af53ac5a7f21121bc90596989832a24", source: "8720af437001fc3c1e2015183ed8c010e7039a98daa68d0f1a1aad44b306f571" },
  sile: { content: "65ab193de986115c440dc5e0c2fc1d22c38f1d6b8e333fae021c299ec7c62fcc", source: "6bc229aa66c4b9a827273b902f469847c5dbdfc9873383dcee856faa5fc78f9a" },
  tuzla: { content: "0786ad594dd1a6871ac2abc9d0bc12c18306717eb9fa442c054d9d09a46962c7", source: "d6289496e532ab52b35a8eb5f368c6718c8ba945fff5b0d6156e70ee9ff67080" },
  umraniye: { content: "a233a1b161058a80b4b83658031990a3a23d7185f15e6d1a40c94e73762284c5", source: "4d571588fe6a009bbce2246d28eeb0cd818f63ca75bee0f2ff8120d1e6c9fba9" },
  uskudar: { content: "bf6de93b642512f9ef1824943b2bd66e11d61e6ebb4fa575b2d7e10a650dcfc7", source: "002afa98438d8b3dcbceffad5e11347e5db84b999006e7b6d482cf0c162051a7" },
} as const;

export type DistrictBatch4NinePlanCount = {
  create: number;
  update: number;
  skip: number;
  conflict: number;
};
export type DistrictBatch4NinePlanEntry = {
  action: keyof DistrictBatch4NinePlanCount;
  district: string;
  reason: string;
  row: ResearchRecord;
  existing?: ProductionImportDocument;
};
export type DistrictBatch4NinePlan = {
  count: DistrictBatch4NinePlanCount;
  entries: DistrictBatch4NinePlanEntry[];
};
export type DistrictBatch4NinePlanExpectation = "initial" | "applied";

function publishedAt(document: ProductionImportDocument): string | null {
  return typeof document.publishedAt === "string" &&
    Number.isFinite(Date.parse(document.publishedAt))
    ? document.publishedAt
    : null;
}

function provenance(
  document: ProductionImportDocument,
): Record<string, unknown> | null {
  return document.importProvenance &&
    typeof document.importProvenance === "object" &&
    !Array.isArray(document.importProvenance)
    ? (document.importProvenance as Record<string, unknown>)
    : null;
}

function isSelfManaged(document: ProductionImportDocument): boolean {
  const managed = provenance(document);
  return (
    typeof managed?.fingerprint === "string" &&
    managed.fingerprint === fingerprint(document)
  );
}

function assertCompleteInput(bundle: ResearchBundle): void {
  const expected = new Set(districts.map((district) => district.slug));
  const actual = new Set(bundle.districts.map((row) => row.district));
  if (
    bundle.districts.length !== 39 ||
    actual.size !== 39 ||
    [...expected].some((slug) => !actual.has(slug)) ||
    bundle.districts.some((row) => !row.editorial)
  ) {
    throw productionImportError(
      "input_failed",
      "DistrictBatch4Nine import requires the exact validated 39-district bundle.",
    );
  }
}

function desiredProvenance(
  row: ResearchRecord,
  deploymentSha: string,
  contentFingerprint: string,
): Record<string, unknown> {
  return {
    version: districtBatch4NineImportVersion,
    batch: districtBatch4NineImportBatch,
    sourceCommit: deploymentSha,
    sourceFingerprint: researchFingerprint(row),
    ...row.document,
    fingerprint: contentFingerprint,
  };
}

export function buildDistrictBatch4NinePlan(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
  deploymentSha: string,
): DistrictBatch4NinePlan {
  assertCompleteInput(bundle);
  const registry = new Set(districts.map((district) => district.slug));
  const byDistrict = new Map<string, ProductionImportDocument>();
  for (const document of existingDocuments) {
    if (
      typeof document.district !== "string" ||
      !registry.has(document.district as (typeof districts)[number]["slug"]) ||
      byDistrict.has(document.district)
    ) {
      throw productionImportError(
        "planning_failed",
        "DistrictBatch4Nine import found an unknown or duplicate district record.",
      );
    }
    byDistrict.set(document.district, document);
  }

  const count: DistrictBatch4NinePlanCount = {
    create: 0,
    update: 0,
    skip: 0,
    conflict: 0,
  };
  const entries = bundle.districts.map((row): DistrictBatch4NinePlanEntry => {
    const existing = byDistrict.get(row.district);
    let action: keyof DistrictBatch4NinePlanCount;
    let reason: string;
    if (!existing) {
      action = "create";
      reason = "missing production district";
    } else if (!districtBatch4NineTargets.includes(row.district as (typeof districtBatch4NineTargets)[number])) {
      if (
        existing._status === "published" &&
        publishedAt(existing)
      ) {
        action = "skip";
        reason = "protected non-target district; never written by this batch";
      } else {
        action = "conflict";
        reason = "protected non-target district is not published";
      }
    } else if (
      existing._status !== "published" ||
      !publishedAt(existing) ||
      !isSelfManaged(existing)
    ) {
      action = "conflict";
      reason = "DistrictBatch4Nine is unpublished, unmanaged, or manually edited";
    } else {
      const managed = provenance(existing)!;
      const sourceFingerprint = researchFingerprint(row);
      if (
        managed.version === districtBatch4NineImportVersion &&
        managed.batch === districtBatch4NineImportBatch &&
        managed.sourceCommit === deploymentSha &&
        managed.sourceFingerprint === sourceFingerprint
      ) {
        action = "skip";
        reason = "DistrictBatch4Nine quality update already applied";
      } else if (
        managed.version === batch2ImportVersion &&
        managed.batch === "editorial-production-batch-2" &&
        managed.sourceCommit === batch2EditorialSourceCommit &&
        managed.sourceFingerprint === districtBatch4NineProductionBaseline[row.district]?.source &&
        fingerprint(existing) === districtBatch4NineProductionBaseline[row.district]?.content
      ) {
        action = "update";
        reason = "exact managed DistrictBatch4Nine Batch 2 baseline";
      } else {
        action = "conflict";
        reason = "DistrictBatch4Nine does not match the approved managed baseline";
      }
    }
    count[action]++;
    return { action, district: row.district, existing, reason, row };
  });
  return { count, entries };
}

export function assertDistrictBatch4NinePlan(
  plan: DistrictBatch4NinePlan,
  expectation: DistrictBatch4NinePlanExpectation,
): void {
  const updates = plan.entries.filter((entry) => entry.action === "update");
  const exactInitial =
    plan.count.update === 9 &&
    plan.count.skip === 30 &&
    plan.count.create === 0 &&
    plan.count.conflict === 0 &&
    updates.length === 9 &&
    updates.every((entry) => districtBatch4NineTargets.includes(entry.district as (typeof districtBatch4NineTargets)[number]));
  const exactApplied =
    plan.count.update === 0 &&
    plan.count.skip === 39 &&
    plan.count.create === 0 &&
    plan.count.conflict === 0;
  if (
    (expectation === "initial" && !exactInitial) ||
    (expectation === "applied" && !exactApplied)
  ) {
    throw productionImportError(
      "planning_failed",
      `DistrictBatch4Nine import does not match the exact ${expectation} gate.`,
      plan.count,
    );
  }
}

function assertAppliedDocument(
  document: ProductionImportDocument,
  before: ProductionImportDocument,
  row: ResearchRecord,
  deploymentSha: string,
): void {
  const managed = provenance(document);
  const projection = projectPublishedDistrictGuide(document);
  if (
    document.id !== before.id ||
    document.district !== row.district ||
    document._status !== "published" ||
    document.publishedAt !== before.publishedAt ||
    document.createdAt !== before.createdAt ||
    !isSelfManaged(document) ||
    managed?.version !== districtBatch4NineImportVersion ||
    managed?.batch !== districtBatch4NineImportBatch ||
    managed?.sourceCommit !== deploymentSha ||
    managed?.sourceFingerprint !== researchFingerprint(row) ||
    !projection ||
    projection.neighborhoods.length !== row.editorial!.neighborhoods.length ||
    projection.planningDevelopments.length !== (row.editorial!.planningDevelopments?.length ?? 0) ||
    projection.sources.length === 0 ||
    JSON.stringify(projection).includes("importProvenance") ||
    JSON.stringify(projection).includes("researchNotes")
  ) {
    throw productionImportError(
      "transaction_failed",
      "DistrictBatch4Nine post-write verification failed.",
    );
  }
}

export async function readDistrictBatch4NinePlan(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  expectation: DistrictBatch4NinePlanExpectation,
  deploymentSha: string,
): Promise<DistrictBatch4NinePlan> {
  let documents: ProductionImportDocument[];
  try {
    documents = await repository.readDistricts();
  } catch {
    throw productionImportError("query_failed", "District read failed.");
  }
  const plan = buildDistrictBatch4NinePlan(documents, bundle, deploymentSha);
  assertDistrictBatch4NinePlan(plan, expectation);
  return plan;
}

export async function applyDistrictBatch4Nine(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  deploymentSha: string,
): Promise<DistrictBatch4NinePlan> {
  return repository.transaction(async (transaction) => {
    const beforeDocuments = await transaction.findDistricts();
    const plan = buildDistrictBatch4NinePlan(beforeDocuments, bundle, deploymentSha);
    assertDistrictBatch4NinePlan(plan, "initial");
    const beforeFingerprints = new Map(
      beforeDocuments.map((document) => [document.district, fingerprint(document)]),
    );
    for (const target of plan.entries.filter((entry) => entry.action === "update")) {
      if (!target.existing) throw productionImportError("transaction_failed", "District Batch 2 target disappeared.");
      const persisted = await transaction.updateDistrict(target.existing.id, makePublishedEditorialUpdate(target.row, target.existing, false));
      const saved = await transaction.updateDistrict(target.existing.id, {
        _status: "published",
        publishedAt: target.existing.publishedAt,
        importProvenance: desiredProvenance(target.row, deploymentSha, fingerprint(persisted)),
      });
      assertAppliedDocument(saved, target.existing, target.row, deploymentSha);
    }

    const afterDocuments = await transaction.findDistricts();
    if (afterDocuments.length !== 39) {
      throw productionImportError(
        "transaction_failed",
        "District record count changed.",
      );
    }
    for (const document of afterDocuments) {
      if (
        !districtBatch4NineTargets.includes(document.district as (typeof districtBatch4NineTargets)[number]) &&
        fingerprint(document) !== beforeFingerprints.get(document.district)
      ) {
        throw productionImportError(
          "transaction_failed",
          "A non-target district changed.",
        );
      }
    }
    const appliedPlan = buildDistrictBatch4NinePlan(
      afterDocuments,
      bundle,
      deploymentSha,
    );
    assertDistrictBatch4NinePlan(appliedPlan, "applied");
    return plan;
  });
}

export const districtBatch4NineConfigurationVariables = [
  "PAYLOAD_DATABASE",
  "DATABASE_URL",
  "PAYLOAD_SECRET",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "PRODUCTION_DISTRICT_BATCH4_NINE_EDITORIAL_DRY_RUN_APPROVED_SHA",
] as const;

type ConfigurationStatus = "MISSING" | "PRESENT_INVALID" | "PRESENT_VALID";

export function districtBatch4NineConfigurationStatus(
  env: Readonly<Record<string, string | undefined>>,
): Record<(typeof districtBatch4NineConfigurationVariables)[number], ConfigurationStatus> {
  const required = (value: string | undefined): ConfigurationStatus =>
    value?.trim() ? "PRESENT_VALID" : "MISSING";
  const exact = (
    value: string | undefined,
    expected: string,
  ): ConfigurationStatus =>
    !value?.trim()
      ? "MISSING"
      : value === expected
        ? "PRESENT_VALID"
        : "PRESENT_INVALID";
  return {
    PAYLOAD_DATABASE: exact(env.PAYLOAD_DATABASE, "postgres"),
    DATABASE_URL: required(env.DATABASE_URL),
    PAYLOAD_SECRET: required(env.PAYLOAD_SECRET),
    VERCEL: exact(env.VERCEL, "1"),
    VERCEL_ENV: exact(env.VERCEL_ENV, "production"),
    VERCEL_GIT_COMMIT_REF: exact(env.VERCEL_GIT_COMMIT_REF, "main"),
    VERCEL_GIT_COMMIT_SHA: required(env.VERCEL_GIT_COMMIT_SHA),
    PRODUCTION_DISTRICT_BATCH4_NINE_EDITORIAL_DRY_RUN_APPROVED_SHA: exact(
      env.PRODUCTION_DISTRICT_BATCH4_NINE_EDITORIAL_DRY_RUN_APPROVED_SHA,
      env.VERCEL_GIT_COMMIT_SHA || "__missing_commit_sha__",
    ),
  };
}

export function assertDistrictBatch4NineEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  apply: boolean,
): void {
  const status = districtBatch4NineConfigurationStatus(env);
  if (
    districtBatch4NineConfigurationVariables.some(
      (name) => status[name] !== "PRESENT_VALID",
    )
  ) {
    throw productionImportError(
      "approval_failed",
      "DistrictBatch4Nine import requires an exact SHA-bound Production environment.",
    );
  }
  if (
    apply &&
    (env.PRODUCTION_DISTRICT_BATCH4_NINE_EDITORIAL_IMPORT_APPROVED !== "true" ||
      env.PRODUCTION_DISTRICT_BATCH4_NINE_EDITORIAL_PITR_CONFIRMED !== "true")
  ) {
    throw productionImportError(
      "approval_failed",
      "DistrictBatch4Nine apply requires explicit import and PITR confirmation.",
    );
  }
}
