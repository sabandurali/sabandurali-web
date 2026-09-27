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

export const bakirkoyTarget = "bakirkoy" as const;
export const bakirkoyImportVersion = 5;
export const bakirkoyImportBatch = "bakirkoy-editorial-quality-2026";
// Read-only audited Production state immediately before this single-district
// update. Both hashes must match; the importer never learns a baseline at run time.
const bakirkoyProductionBaseline = {
  content: "e2c202d4d358660eb162c77478605deca3e68060cbde1c0c41b8bacd8c4f1104",
  source: "567b8b5bf91a87fafd22f6f3af8478e58ca4069d70f264d5f50c1f37ae5debe1",
} as const;

export type BakirkoyPlanCount = {
  create: number;
  update: number;
  skip: number;
  conflict: number;
};
export type BakirkoyPlanEntry = {
  action: keyof BakirkoyPlanCount;
  district: string;
  reason: string;
  row: ResearchRecord;
  existing?: ProductionImportDocument;
};
export type BakirkoyPlan = {
  count: BakirkoyPlanCount;
  entries: BakirkoyPlanEntry[];
};
export type BakirkoyPlanExpectation = "initial" | "applied";

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
      "Bakirkoy import requires the exact validated 39-district bundle.",
    );
  }
}

function desiredProvenance(
  row: ResearchRecord,
  deploymentSha: string,
  contentFingerprint: string,
): Record<string, unknown> {
  return {
    version: bakirkoyImportVersion,
    batch: bakirkoyImportBatch,
    sourceCommit: deploymentSha,
    sourceFingerprint: researchFingerprint(row),
    ...row.document,
    fingerprint: contentFingerprint,
  };
}

export function buildBakirkoyPlan(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
  deploymentSha: string,
): BakirkoyPlan {
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
        "Bakirkoy import found an unknown or duplicate district record.",
      );
    }
    byDistrict.set(document.district, document);
  }

  const count: BakirkoyPlanCount = {
    create: 0,
    update: 0,
    skip: 0,
    conflict: 0,
  };
  const entries = bundle.districts.map((row): BakirkoyPlanEntry => {
    const existing = byDistrict.get(row.district);
    let action: keyof BakirkoyPlanCount;
    let reason: string;
    if (!existing) {
      action = "create";
      reason = "missing production district";
    } else if (row.district !== bakirkoyTarget) {
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
      reason = "Bakirkoy is unpublished, unmanaged, or manually edited";
    } else {
      const managed = provenance(existing)!;
      const sourceFingerprint = researchFingerprint(row);
      if (
        managed.version === bakirkoyImportVersion &&
        managed.batch === bakirkoyImportBatch &&
        managed.sourceCommit === deploymentSha &&
        managed.sourceFingerprint === sourceFingerprint
      ) {
        action = "skip";
        reason = "Bakirkoy quality update already applied";
      } else if (
        managed.version === batch2ImportVersion &&
        managed.batch === "editorial-production-batch-2" &&
        managed.sourceCommit === batch2EditorialSourceCommit &&
        managed.sourceFingerprint === bakirkoyProductionBaseline.source &&
        fingerprint(existing) === bakirkoyProductionBaseline.content
      ) {
        action = "update";
        reason = "exact managed Bakirkoy Batch 2 baseline";
      } else {
        action = "conflict";
        reason = "Bakirkoy does not match the approved managed baseline";
      }
    }
    count[action]++;
    return { action, district: row.district, existing, reason, row };
  });
  return { count, entries };
}

export function assertBakirkoyPlan(
  plan: BakirkoyPlan,
  expectation: BakirkoyPlanExpectation,
): void {
  const updates = plan.entries.filter((entry) => entry.action === "update");
  const exactInitial =
    plan.count.update === 1 &&
    plan.count.skip === 38 &&
    plan.count.create === 0 &&
    plan.count.conflict === 0 &&
    updates.length === 1 &&
    updates[0].district === bakirkoyTarget;
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
      `Bakirkoy import does not match the exact ${expectation} gate.`,
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
    document.district !== bakirkoyTarget ||
    document._status !== "published" ||
    document.publishedAt !== before.publishedAt ||
    document.createdAt !== before.createdAt ||
    !isSelfManaged(document) ||
    managed?.version !== bakirkoyImportVersion ||
    managed?.batch !== bakirkoyImportBatch ||
    managed?.sourceCommit !== deploymentSha ||
    managed?.sourceFingerprint !== researchFingerprint(row) ||
    !projection ||
    projection.neighborhoods.length !== 15 ||
    projection.planningDevelopments.length !== 1 ||
    projection.planningDevelopments[0]?.title !==
      "M3 Bakırköy Sahil Uzatmasının Hizmete Açılması" ||
    projection.sources.length === 0 ||
    JSON.stringify(projection).includes("importProvenance") ||
    JSON.stringify(projection).includes("researchNotes")
  ) {
    throw productionImportError(
      "transaction_failed",
      "Bakirkoy post-write verification failed.",
    );
  }
}

export async function readBakirkoyPlan(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  expectation: BakirkoyPlanExpectation,
  deploymentSha: string,
): Promise<BakirkoyPlan> {
  let documents: ProductionImportDocument[];
  try {
    documents = await repository.readDistricts();
  } catch {
    throw productionImportError("query_failed", "District read failed.");
  }
  const plan = buildBakirkoyPlan(documents, bundle, deploymentSha);
  assertBakirkoyPlan(plan, expectation);
  return plan;
}

export async function applyBakirkoy(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  deploymentSha: string,
): Promise<BakirkoyPlan> {
  return repository.transaction(async (transaction) => {
    const beforeDocuments = await transaction.findDistricts();
    const plan = buildBakirkoyPlan(beforeDocuments, bundle, deploymentSha);
    assertBakirkoyPlan(plan, "initial");
    const beforeFingerprints = new Map(
      beforeDocuments.map((document) => [document.district, fingerprint(document)]),
    );
    const target = plan.entries.find(
      (entry) => entry.district === bakirkoyTarget,
    )!;
    if (!target.existing || target.action !== "update") {
      throw productionImportError(
        "transaction_failed",
        "Bakirkoy update target disappeared.",
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
        document.district !== bakirkoyTarget &&
        fingerprint(document) !== beforeFingerprints.get(document.district)
      ) {
        throw productionImportError(
          "transaction_failed",
          "A non-target district changed.",
        );
      }
    }
    const appliedPlan = buildBakirkoyPlan(
      afterDocuments,
      bundle,
      deploymentSha,
    );
    assertBakirkoyPlan(appliedPlan, "applied");
    return plan;
  });
}

export const bakirkoyConfigurationVariables = [
  "PAYLOAD_DATABASE",
  "DATABASE_URL",
  "PAYLOAD_SECRET",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "PRODUCTION_BAKIRKOY_EDITORIAL_DRY_RUN_APPROVED_SHA",
] as const;

type ConfigurationStatus = "MISSING" | "PRESENT_INVALID" | "PRESENT_VALID";

export function bakirkoyConfigurationStatus(
  env: Readonly<Record<string, string | undefined>>,
): Record<(typeof bakirkoyConfigurationVariables)[number], ConfigurationStatus> {
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
    PRODUCTION_BAKIRKOY_EDITORIAL_DRY_RUN_APPROVED_SHA: exact(
      env.PRODUCTION_BAKIRKOY_EDITORIAL_DRY_RUN_APPROVED_SHA,
      env.VERCEL_GIT_COMMIT_SHA || "__missing_commit_sha__",
    ),
  };
}

export function assertBakirkoyEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  apply: boolean,
): void {
  const status = bakirkoyConfigurationStatus(env);
  if (
    bakirkoyConfigurationVariables.some(
      (name) => status[name] !== "PRESENT_VALID",
    )
  ) {
    throw productionImportError(
      "approval_failed",
      "Bakirkoy import requires an exact SHA-bound Production environment.",
    );
  }
  if (
    apply &&
    (env.PRODUCTION_BAKIRKOY_EDITORIAL_IMPORT_APPROVED !== "true" ||
      env.PRODUCTION_BAKIRKOY_EDITORIAL_PITR_CONFIRMED !== "true")
  ) {
    throw productionImportError(
      "approval_failed",
      "Bakirkoy apply requires explicit import and PITR confirmation.",
    );
  }
}
