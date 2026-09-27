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

export const bahcelievlerTarget = "bahcelievler" as const;
export const bahcelievlerImportVersion = 5;
export const bahcelievlerImportBatch = "bahcelievler-editorial-quality-2026";
// Read-only audited Production state immediately before this single-district
// update. Both hashes must match; the importer never learns a baseline at run time.
const bahcelievlerProductionBaseline = {
  content: "63e62e765a2d35e76f394b6a74f632cfe65e968e1e34b891e25bbeffbd90894b",
  source: "6dd0a4547bc3a18ed496c0301495be10091c9f8c5c08c9a3577cf8511b13a6bf",
} as const;

export type BahcelievlerPlanCount = {
  create: number;
  update: number;
  skip: number;
  conflict: number;
};
export type BahcelievlerPlanEntry = {
  action: keyof BahcelievlerPlanCount;
  district: string;
  reason: string;
  row: ResearchRecord;
  existing?: ProductionImportDocument;
};
export type BahcelievlerPlan = {
  count: BahcelievlerPlanCount;
  entries: BahcelievlerPlanEntry[];
};
export type BahcelievlerPlanExpectation = "initial" | "applied";

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
      "Bahcelievler import requires the exact validated 39-district bundle.",
    );
  }
}

function desiredProvenance(
  row: ResearchRecord,
  deploymentSha: string,
  contentFingerprint: string,
): Record<string, unknown> {
  return {
    version: bahcelievlerImportVersion,
    batch: bahcelievlerImportBatch,
    sourceCommit: deploymentSha,
    sourceFingerprint: researchFingerprint(row),
    ...row.document,
    fingerprint: contentFingerprint,
  };
}

export function buildBahcelievlerPlan(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
  deploymentSha: string,
): BahcelievlerPlan {
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
        "Bahcelievler import found an unknown or duplicate district record.",
      );
    }
    byDistrict.set(document.district, document);
  }

  const count: BahcelievlerPlanCount = {
    create: 0,
    update: 0,
    skip: 0,
    conflict: 0,
  };
  const entries = bundle.districts.map((row): BahcelievlerPlanEntry => {
    const existing = byDistrict.get(row.district);
    let action: keyof BahcelievlerPlanCount;
    let reason: string;
    if (!existing) {
      action = "create";
      reason = "missing production district";
    } else if (row.district !== bahcelievlerTarget) {
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
      reason = "Bahcelievler is unpublished, unmanaged, or manually edited";
    } else {
      const managed = provenance(existing)!;
      const sourceFingerprint = researchFingerprint(row);
      if (
        managed.version === bahcelievlerImportVersion &&
        managed.batch === bahcelievlerImportBatch &&
        managed.sourceCommit === deploymentSha &&
        managed.sourceFingerprint === sourceFingerprint
      ) {
        action = "skip";
        reason = "Bahcelievler quality update already applied";
      } else if (
        managed.version === batch2ImportVersion &&
        managed.batch === "editorial-production-batch-2" &&
        managed.sourceCommit === batch2EditorialSourceCommit &&
        managed.sourceFingerprint === bahcelievlerProductionBaseline.source &&
        fingerprint(existing) === bahcelievlerProductionBaseline.content
      ) {
        action = "update";
        reason = "exact managed Bahcelievler Batch 2 baseline";
      } else {
        action = "conflict";
        reason = "Bahcelievler does not match the approved managed baseline";
      }
    }
    count[action]++;
    return { action, district: row.district, existing, reason, row };
  });
  return { count, entries };
}

export function assertBahcelievlerPlan(
  plan: BahcelievlerPlan,
  expectation: BahcelievlerPlanExpectation,
): void {
  const updates = plan.entries.filter((entry) => entry.action === "update");
  const exactInitial =
    plan.count.update === 1 &&
    plan.count.skip === 38 &&
    plan.count.create === 0 &&
    plan.count.conflict === 0 &&
    updates.length === 1 &&
    updates[0].district === bahcelievlerTarget;
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
      `Bahcelievler import does not match the exact ${expectation} gate.`,
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
    document.district !== bahcelievlerTarget ||
    document._status !== "published" ||
    document.publishedAt !== before.publishedAt ||
    document.createdAt !== before.createdAt ||
    !isSelfManaged(document) ||
    managed?.version !== bahcelievlerImportVersion ||
    managed?.batch !== bahcelievlerImportBatch ||
    managed?.sourceCommit !== deploymentSha ||
    managed?.sourceFingerprint !== researchFingerprint(row) ||
    !projection ||
    projection.neighborhoods.length !== 11 ||
    projection.planningDevelopments.length !== 1 ||
    projection.planningDevelopments[0]?.title !==
      "Atilla Gökçe Parkı Revizyonu" ||
    projection.sources.length === 0 ||
    JSON.stringify(projection).includes("importProvenance") ||
    JSON.stringify(projection).includes("researchNotes")
  ) {
    throw productionImportError(
      "transaction_failed",
      "Bahcelievler post-write verification failed.",
    );
  }
}

export async function readBahcelievlerPlan(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  expectation: BahcelievlerPlanExpectation,
  deploymentSha: string,
): Promise<BahcelievlerPlan> {
  let documents: ProductionImportDocument[];
  try {
    documents = await repository.readDistricts();
  } catch {
    throw productionImportError("query_failed", "District read failed.");
  }
  const plan = buildBahcelievlerPlan(documents, bundle, deploymentSha);
  assertBahcelievlerPlan(plan, expectation);
  return plan;
}

export async function applyBahcelievler(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  deploymentSha: string,
): Promise<BahcelievlerPlan> {
  return repository.transaction(async (transaction) => {
    const beforeDocuments = await transaction.findDistricts();
    const plan = buildBahcelievlerPlan(beforeDocuments, bundle, deploymentSha);
    assertBahcelievlerPlan(plan, "initial");
    const beforeFingerprints = new Map(
      beforeDocuments.map((document) => [document.district, fingerprint(document)]),
    );
    const target = plan.entries.find(
      (entry) => entry.district === bahcelievlerTarget,
    )!;
    if (!target.existing || target.action !== "update") {
      throw productionImportError(
        "transaction_failed",
        "Bahcelievler update target disappeared.",
      );
    }
    const persisted = await transaction.updateDistrict(
      target.existing.id,
      makePublishedEditorialUpdate(target.row, target.existing, false),
    );
    const saved = await transaction.updateDistrict(target.existing.id, {
      _status: "published",
      publishedAt: target.existing.publishedAt,
      importProvenance: desiredProvenance(
        target.row,
        deploymentSha,
        fingerprint(persisted),
      ),
    });
    assertAppliedDocument(saved, target.existing, target.row, deploymentSha);

    const afterDocuments = await transaction.findDistricts();
    if (afterDocuments.length !== 39) {
      throw productionImportError(
        "transaction_failed",
        "District record count changed.",
      );
    }
    for (const document of afterDocuments) {
      if (
        document.district !== bahcelievlerTarget &&
        fingerprint(document) !== beforeFingerprints.get(document.district)
      ) {
        throw productionImportError(
          "transaction_failed",
          "A non-target district changed.",
        );
      }
    }
    const appliedPlan = buildBahcelievlerPlan(
      afterDocuments,
      bundle,
      deploymentSha,
    );
    assertBahcelievlerPlan(appliedPlan, "applied");
    return plan;
  });
}

export const bahcelievlerConfigurationVariables = [
  "PAYLOAD_DATABASE",
  "DATABASE_URL",
  "PAYLOAD_SECRET",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "PRODUCTION_BAHCELIEVLER_EDITORIAL_DRY_RUN_APPROVED_SHA",
] as const;

type ConfigurationStatus = "MISSING" | "PRESENT_INVALID" | "PRESENT_VALID";

export function bahcelievlerConfigurationStatus(
  env: Readonly<Record<string, string | undefined>>,
): Record<(typeof bahcelievlerConfigurationVariables)[number], ConfigurationStatus> {
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
    PRODUCTION_BAHCELIEVLER_EDITORIAL_DRY_RUN_APPROVED_SHA: exact(
      env.PRODUCTION_BAHCELIEVLER_EDITORIAL_DRY_RUN_APPROVED_SHA,
      env.VERCEL_GIT_COMMIT_SHA || "__missing_commit_sha__",
    ),
  };
}

export function assertBahcelievlerEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  apply: boolean,
): void {
  const status = bahcelievlerConfigurationStatus(env);
  if (
    bahcelievlerConfigurationVariables.some(
      (name) => status[name] !== "PRESENT_VALID",
    )
  ) {
    throw productionImportError(
      "approval_failed",
      "Bahcelievler import requires an exact SHA-bound Production environment.",
    );
  }
  if (
    apply &&
    (env.PRODUCTION_BAHCELIEVLER_EDITORIAL_IMPORT_APPROVED !== "true" ||
      env.PRODUCTION_BAHCELIEVLER_EDITORIAL_PITR_CONFIRMED !== "true")
  ) {
    throw productionImportError(
      "approval_failed",
      "Bahcelievler apply requires explicit import and PITR confirmation.",
    );
  }
}
