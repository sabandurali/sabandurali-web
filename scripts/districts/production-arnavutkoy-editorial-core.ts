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

export const arnavutkoyTarget = "arnavutkoy" as const;
export const arnavutkoyImportVersion = 5;
export const arnavutkoyImportBatch = "arnavutkoy-editorial-quality-2026";
// Read-only audited Production state immediately before this single-district
// update. Both hashes must match; the importer never learns a baseline at run time.
const arnavutkoyProductionBaseline = {
  content: "333fb18cd5985c17b692894405c5caa1a6fb2d3d8e6d508a7793793ed5653a76",
  source: "5f098478277a3cd5140cd6c2793512e7a140da49815f8bbd9ecd8fe0689555ca",
} as const;

export type ArnavutkoyPlanCount = {
  create: number;
  update: number;
  skip: number;
  conflict: number;
};
export type ArnavutkoyPlanEntry = {
  action: keyof ArnavutkoyPlanCount;
  district: string;
  reason: string;
  row: ResearchRecord;
  existing?: ProductionImportDocument;
};
export type ArnavutkoyPlan = {
  count: ArnavutkoyPlanCount;
  entries: ArnavutkoyPlanEntry[];
};
export type ArnavutkoyPlanExpectation = "initial" | "applied";

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
      "Arnavutkoy import requires the exact validated 39-district bundle.",
    );
  }
}

function desiredProvenance(
  row: ResearchRecord,
  deploymentSha: string,
  contentFingerprint: string,
): Record<string, unknown> {
  return {
    version: arnavutkoyImportVersion,
    batch: arnavutkoyImportBatch,
    sourceCommit: deploymentSha,
    sourceFingerprint: researchFingerprint(row),
    ...row.document,
    fingerprint: contentFingerprint,
  };
}

export function buildArnavutkoyPlan(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
  deploymentSha: string,
): ArnavutkoyPlan {
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
        "Arnavutkoy import found an unknown or duplicate district record.",
      );
    }
    byDistrict.set(document.district, document);
  }

  const count: ArnavutkoyPlanCount = {
    create: 0,
    update: 0,
    skip: 0,
    conflict: 0,
  };
  const entries = bundle.districts.map((row): ArnavutkoyPlanEntry => {
    const existing = byDistrict.get(row.district);
    let action: keyof ArnavutkoyPlanCount;
    let reason: string;
    if (!existing) {
      action = "create";
      reason = "missing production district";
    } else if (row.district !== arnavutkoyTarget) {
      const managed = provenance(existing);
      if (
        existing._status === "published" &&
        publishedAt(existing) &&
        managed?.sourceFingerprint === researchFingerprint(row)
      ) {
        action = "skip";
        reason = "protected non-target district is unchanged";
      } else {
        action = "conflict";
        reason = "protected non-target district source changed";
      }
    } else if (
      existing._status !== "published" ||
      !publishedAt(existing) ||
      !isSelfManaged(existing)
    ) {
      action = "conflict";
      reason = "Arnavutkoy is unpublished, unmanaged, or manually edited";
    } else {
      const managed = provenance(existing)!;
      const sourceFingerprint = researchFingerprint(row);
      if (
        managed.version === arnavutkoyImportVersion &&
        managed.batch === arnavutkoyImportBatch &&
        managed.sourceCommit === deploymentSha &&
        managed.sourceFingerprint === sourceFingerprint
      ) {
        action = "skip";
        reason = "Arnavutkoy quality update already applied";
      } else if (
        managed.version === batch2ImportVersion &&
        managed.batch === "editorial-production-batch-2" &&
        managed.sourceCommit === batch2EditorialSourceCommit &&
        managed.sourceFingerprint === arnavutkoyProductionBaseline.source &&
        fingerprint(existing) === arnavutkoyProductionBaseline.content
      ) {
        action = "update";
        reason = "exact managed Arnavutkoy Batch 2 baseline";
      } else {
        action = "conflict";
        reason = "Arnavutkoy does not match the approved managed baseline";
      }
    }
    count[action]++;
    return { action, district: row.district, existing, reason, row };
  });
  return { count, entries };
}

export function assertArnavutkoyPlan(
  plan: ArnavutkoyPlan,
  expectation: ArnavutkoyPlanExpectation,
): void {
  const updates = plan.entries.filter((entry) => entry.action === "update");
  const exactInitial =
    plan.count.update === 1 &&
    plan.count.skip === 38 &&
    plan.count.create === 0 &&
    plan.count.conflict === 0 &&
    updates.length === 1 &&
    updates[0].district === arnavutkoyTarget;
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
      `Arnavutkoy import does not match the exact ${expectation} gate.`,
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
    document.district !== arnavutkoyTarget ||
    document._status !== "published" ||
    document.publishedAt !== before.publishedAt ||
    document.createdAt !== before.createdAt ||
    !isSelfManaged(document) ||
    managed?.version !== arnavutkoyImportVersion ||
    managed?.batch !== arnavutkoyImportBatch ||
    managed?.sourceCommit !== deploymentSha ||
    managed?.sourceFingerprint !== researchFingerprint(row) ||
    !projection ||
    projection.neighborhoods.length !== 38 ||
    projection.planningDevelopments.length !== 1 ||
    !projection.transportation?.includes("19 Haziran 2026") ||
    projection.sources.length === 0 ||
    JSON.stringify(projection).includes("importProvenance") ||
    JSON.stringify(projection).includes("researchNotes")
  ) {
    throw productionImportError(
      "transaction_failed",
      "Arnavutkoy post-write verification failed.",
    );
  }
}

export async function readArnavutkoyPlan(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  expectation: ArnavutkoyPlanExpectation,
  deploymentSha: string,
): Promise<ArnavutkoyPlan> {
  let documents: ProductionImportDocument[];
  try {
    documents = await repository.readDistricts();
  } catch {
    throw productionImportError("query_failed", "District read failed.");
  }
  const plan = buildArnavutkoyPlan(documents, bundle, deploymentSha);
  assertArnavutkoyPlan(plan, expectation);
  return plan;
}

export async function applyArnavutkoy(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  deploymentSha: string,
): Promise<ArnavutkoyPlan> {
  return repository.transaction(async (transaction) => {
    const beforeDocuments = await transaction.findDistricts();
    const plan = buildArnavutkoyPlan(beforeDocuments, bundle, deploymentSha);
    assertArnavutkoyPlan(plan, "initial");
    const beforeFingerprints = new Map(
      beforeDocuments.map((document) => [document.district, fingerprint(document)]),
    );
    const target = plan.entries.find(
      (entry) => entry.district === arnavutkoyTarget,
    )!;
    if (!target.existing || target.action !== "update") {
      throw productionImportError(
        "transaction_failed",
        "Arnavutkoy update target disappeared.",
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
        document.district !== arnavutkoyTarget &&
        fingerprint(document) !== beforeFingerprints.get(document.district)
      ) {
        throw productionImportError(
          "transaction_failed",
          "A non-target district changed.",
        );
      }
    }
    const appliedPlan = buildArnavutkoyPlan(
      afterDocuments,
      bundle,
      deploymentSha,
    );
    assertArnavutkoyPlan(appliedPlan, "applied");
    return plan;
  });
}

export const arnavutkoyConfigurationVariables = [
  "PAYLOAD_DATABASE",
  "DATABASE_URL",
  "PAYLOAD_SECRET",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "PRODUCTION_ARNAVUTKOY_EDITORIAL_DRY_RUN_APPROVED_SHA",
] as const;

type ConfigurationStatus = "MISSING" | "PRESENT_INVALID" | "PRESENT_VALID";

export function arnavutkoyConfigurationStatus(
  env: Readonly<Record<string, string | undefined>>,
): Record<(typeof arnavutkoyConfigurationVariables)[number], ConfigurationStatus> {
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
    PRODUCTION_ARNAVUTKOY_EDITORIAL_DRY_RUN_APPROVED_SHA: exact(
      env.PRODUCTION_ARNAVUTKOY_EDITORIAL_DRY_RUN_APPROVED_SHA,
      env.VERCEL_GIT_COMMIT_SHA || "__missing_commit_sha__",
    ),
  };
}

export function assertArnavutkoyEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  apply: boolean,
): void {
  const status = arnavutkoyConfigurationStatus(env);
  if (
    arnavutkoyConfigurationVariables.some(
      (name) => status[name] !== "PRESENT_VALID",
    )
  ) {
    throw productionImportError(
      "approval_failed",
      "Arnavutkoy import requires an exact SHA-bound Production environment.",
    );
  }
  if (
    apply &&
    (env.PRODUCTION_ARNAVUTKOY_EDITORIAL_IMPORT_APPROVED !== "true" ||
      env.PRODUCTION_ARNAVUTKOY_EDITORIAL_PITR_CONFIRMED !== "true")
  ) {
    throw productionImportError(
      "approval_failed",
      "Arnavutkoy apply requires explicit import and PITR confirmation.",
    );
  }
}
