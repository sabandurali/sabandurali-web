import { createHash } from "node:crypto";
import { districts } from "../../src/content/districts/district-registry";
import { projectPublishedDistrictGuide } from "../../src/content/districts/district-guide-projection";
import { makePublishedEditorialUpdate } from "./production-editorial-batch2-core";
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

export const esenlerFinalTarget = "esenler" as const;
export const esenlerFinalImportVersion = 6;
export const esenlerFinalImportBatch = "esenler-final-editorial-quality-2026";

// User-approved, read-only audited Production snapshot. The importer cannot
// learn or replace this manual baseline at runtime (no TOFU/adoption path).
export const esenlerApprovedManualBaseline = {
  district: esenlerFinalTarget,
  documentId: "4c3d4d0b-3303-4bdf-b46c-0b2ac4b2acb8",
  createdAt: "2026-09-13T18:38:00.001Z",
  publishedAt: "2026-09-20T11:37:45.327Z",
  contentFingerprint:
    "fd45106eea0200e4439ecc927ffa5c22bf77d6d5f83324793c687a64630f8c45",
  storedProvenanceFingerprint:
    "1422128f173e23dac3f34351367e81b0a805e26353bb44f683d90346f65b6454",
  provenanceCanonicalHash:
    "a9e4685d89cdb604536cc0ed36389fc3854d16815b353a7a81914d768ab2c6ed",
  provenance: {
    file: "Esenler İlçe Rehberi Araştırması.pdf",
    pages: 12,
    sha256:
      "31c2d5e501f27e7ee6a8bef07dbefd2fd117bab42d601fa598701e1d19e0327c",
    version: 3,
    fingerprint:
      "1422128f173e23dac3f34351367e81b0a805e26353bb44f683d90346f65b6454",
    sourceFingerprint:
      "c057ffa6f8442c787a6e8aca68aa48ded992c5b479e70c9c397d8e6b2a8c6e5e",
  },
} as const;

export type EsenlerFinalPlanCount = {
  create: number;
  update: number;
  skip: number;
  conflict: number;
};
export type EsenlerFinalPlanEntry = {
  action: keyof EsenlerFinalPlanCount;
  district: string;
  reason: string;
  row: ResearchRecord;
  existing?: ProductionImportDocument;
};
export type EsenlerFinalPlan = {
  count: EsenlerFinalPlanCount;
  entries: EsenlerFinalPlanEntry[];
};
export type EsenlerFinalPlanExpectation = "initial" | "applied";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, child]) =>
          key !== "id" && child !== undefined && child !== null
        )
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonical(child)]),
    );
  return value;
}

export function canonicalHash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
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

export function isEsenlerFinalSelfManaged(
  document: ProductionImportDocument,
): boolean {
  const managed = provenance(document);
  return (
    typeof managed?.fingerprint === "string" &&
    managed.fingerprint === fingerprint(document)
  );
}

export function isExactApprovedEsenlerManualBaseline(
  document: ProductionImportDocument,
): boolean {
  const managed = provenance(document);
  return (
    document.district === esenlerApprovedManualBaseline.district &&
    document.id === esenlerApprovedManualBaseline.documentId &&
    document._status === "published" &&
    document.createdAt === esenlerApprovedManualBaseline.createdAt &&
    document.publishedAt === esenlerApprovedManualBaseline.publishedAt &&
    fingerprint(document) ===
      esenlerApprovedManualBaseline.contentFingerprint &&
    managed?.fingerprint ===
      esenlerApprovedManualBaseline.storedProvenanceFingerprint &&
    canonicalHash(managed) ===
      esenlerApprovedManualBaseline.provenanceCanonicalHash
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
      "Esenler final import requires the exact validated 39-district bundle.",
    );
  }
}

function desiredProvenance(
  row: ResearchRecord,
  deploymentSha: string,
  contentFingerprint: string,
): Record<string, unknown> {
  return {
    version: esenlerFinalImportVersion,
    batch: esenlerFinalImportBatch,
    sourceCommit: deploymentSha,
    sourceFingerprint: researchFingerprint(row),
    ...row.document,
    fingerprint: contentFingerprint,
  };
}

export function buildEsenlerFinalPlan(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
  deploymentSha: string,
): EsenlerFinalPlan {
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
        "Esenler final import found an unknown or duplicate district record.",
      );
    }
    byDistrict.set(document.district, document);
  }

  const count: EsenlerFinalPlanCount = {
    create: 0,
    update: 0,
    skip: 0,
    conflict: 0,
  };
  const entries = bundle.districts.map((row): EsenlerFinalPlanEntry => {
    const existing = byDistrict.get(row.district);
    let action: keyof EsenlerFinalPlanCount;
    let reason: string;
    if (!existing) {
      action = "create";
      reason = "missing production district";
    } else if (row.district !== esenlerFinalTarget) {
      if (existing._status === "published" && existing.publishedAt) {
        action = "skip";
        reason = "protected non-target district; never written";
      } else {
        action = "conflict";
        reason = "protected non-target district is not published";
      }
    } else {
      const managed = provenance(existing);
      const alreadyApplied =
        existing._status === "published" &&
        isEsenlerFinalSelfManaged(existing) &&
        managed?.version === esenlerFinalImportVersion &&
        managed.batch === esenlerFinalImportBatch &&
        managed.sourceCommit === deploymentSha &&
        managed.sourceFingerprint === researchFingerprint(row);
      if (alreadyApplied) {
        action = "skip";
        reason = "Esenler final quality update already applied";
      } else if (isExactApprovedEsenlerManualBaseline(existing)) {
        action = "update";
        reason = "exact user-approved Esenler manual baseline";
      } else {
        action = "conflict";
        reason = "Esenler does not match the approved manual baseline";
      }
    }
    count[action]++;
    return { action, district: row.district, existing, reason, row };
  });
  return { count, entries };
}

export function assertEsenlerFinalPlan(
  plan: EsenlerFinalPlan,
  expectation: EsenlerFinalPlanExpectation,
): void {
  const updates = plan.entries.filter((entry) => entry.action === "update");
  const exactInitial =
    plan.count.update === 1 &&
    plan.count.skip === 38 &&
    plan.count.create === 0 &&
    plan.count.conflict === 0 &&
    updates.length === 1 &&
    updates[0].district === esenlerFinalTarget;
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
      `Esenler final import does not match the exact ${expectation} gate.`,
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
  const population = String(projection?.facts?.population ?? "").replaceAll(
    ".",
    "",
  );
  if (
    document.id !== before.id ||
    document.createdAt !== before.createdAt ||
    document.publishedAt !== before.publishedAt ||
    document.district !== esenlerFinalTarget ||
    document._status !== "published" ||
    !isEsenlerFinalSelfManaged(document) ||
    managed?.version !== esenlerFinalImportVersion ||
    managed?.batch !== esenlerFinalImportBatch ||
    managed?.sourceCommit !== deploymentSha ||
    managed?.sourceFingerprint !== researchFingerprint(row) ||
    !projection ||
    population !== "419878" ||
    projection.facts?.populationYear !== 2025 ||
    projection.facts?.areaKm2 !== 18.43 ||
    projection.facts?.neighborhoodCount !== 19 ||
    projection.neighborhoods.length !== 19 ||
    projection.planningDevelopments.length !== 0 ||
    !Array.isArray(document.sources) ||
    document.sources.length !== 12 ||
    JSON.stringify(projection).includes("importProvenance") ||
    JSON.stringify(projection).includes("researchNotes")
  ) {
    throw productionImportError(
      "transaction_failed",
      "Esenler final post-write verification failed.",
    );
  }
}

export async function readEsenlerFinalPlan(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  expectation: EsenlerFinalPlanExpectation,
  deploymentSha: string,
): Promise<EsenlerFinalPlan> {
  let documents: ProductionImportDocument[];
  try {
    documents = await repository.readDistricts();
  } catch {
    throw productionImportError("query_failed", "District read failed.");
  }
  const plan = buildEsenlerFinalPlan(documents, bundle, deploymentSha);
  assertEsenlerFinalPlan(plan, expectation);
  return plan;
}

export async function applyEsenlerFinal(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  deploymentSha: string,
): Promise<EsenlerFinalPlan> {
  return repository.transaction(async (transaction) => {
    const beforeDocuments = await transaction.findDistricts();
    const plan = buildEsenlerFinalPlan(beforeDocuments, bundle, deploymentSha);
    assertEsenlerFinalPlan(plan, "initial");
    const beforeFingerprints = new Map(
      beforeDocuments.map((document) => [document.district, fingerprint(document)]),
    );
    const target = plan.entries.find(
      (entry) => entry.district === esenlerFinalTarget,
    )!;
    if (!target.existing || target.action !== "update")
      throw productionImportError(
        "transaction_failed",
        "Esenler final update target disappeared.",
      );

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
    if (afterDocuments.length !== 39)
      throw productionImportError(
        "transaction_failed",
        "District record count changed.",
      );
    for (const document of afterDocuments)
      if (
        document.district !== esenlerFinalTarget &&
        fingerprint(document) !== beforeFingerprints.get(document.district)
      )
        throw productionImportError(
          "transaction_failed",
          "A non-target district changed.",
        );

    const appliedPlan = buildEsenlerFinalPlan(
      afterDocuments,
      bundle,
      deploymentSha,
    );
    assertEsenlerFinalPlan(appliedPlan, "applied");
    return plan;
  });
}

export const esenlerFinalConfigurationVariables = [
  "PAYLOAD_DATABASE",
  "DATABASE_URL",
  "PAYLOAD_SECRET",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "PRODUCTION_ESENLER_FINAL_DRY_RUN_APPROVED_SHA",
] as const;
type ConfigurationStatus = "MISSING" | "PRESENT_INVALID" | "PRESENT_VALID";

export function esenlerFinalConfigurationStatus(
  env: Readonly<Record<string, string | undefined>>,
): Record<(typeof esenlerFinalConfigurationVariables)[number], ConfigurationStatus> {
  const required = (value: string | undefined): ConfigurationStatus =>
    value?.trim() ? "PRESENT_VALID" : "MISSING";
  const exact = (value: string | undefined, expected: string): ConfigurationStatus =>
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
    PRODUCTION_ESENLER_FINAL_DRY_RUN_APPROVED_SHA: exact(
      env.PRODUCTION_ESENLER_FINAL_DRY_RUN_APPROVED_SHA,
      env.VERCEL_GIT_COMMIT_SHA || "__missing_commit_sha__",
    ),
  };
}

export function assertEsenlerFinalEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  apply: boolean,
): void {
  const status = esenlerFinalConfigurationStatus(env);
  if (
    esenlerFinalConfigurationVariables.some(
      (name) => status[name] !== "PRESENT_VALID",
    )
  )
    throw productionImportError(
      "approval_failed",
      "Esenler final import requires an exact SHA-bound Production environment.",
    );
  if (
    apply &&
    (env.PRODUCTION_ESENLER_FINAL_IMPORT_APPROVED !== "true" ||
      env.PRODUCTION_ESENLER_FINAL_PITR_CONFIRMED !== "true")
  )
    throw productionImportError(
      "approval_failed",
      "Esenler final apply requires explicit import and PITR confirmation.",
    );
}
