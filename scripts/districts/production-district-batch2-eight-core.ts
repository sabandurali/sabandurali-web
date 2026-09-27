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

export const districtBatch2EightTargets = [
  "catalca",
  "esenyurt",
  "eyupsultan",
  "fatih",
  "gaziosmanpasa",
  "gungoren",
  "kagithane",
  "kucukcekmece",
] as const;
export const districtBatch2EightImportVersion = 6;
export const districtBatch2EightImportBatch = "districtBatch2Eight-editorial-quality-2026";
// Read-only audited Production state immediately before this eight-district
// update. Both hashes must match; the importer never learns a baseline at run time.
const districtBatch2EightProductionBaseline: Record<string, { content: string; source: string }> = {
  catalca: { content: "404de0e2d5d74c24d3a740d53dc566b0a2fc63e27420c28223c10d6a4fe98618", source: "a8d621e16ce3b11b4fe18d533191c5cae4490a351f2cbed66baa529aea6f26f8" },
  esenyurt: { content: "3bc94325a06dea1e4e3106777cda6333a83fea111487a87484b64eafe6e4fb3f", source: "8797563932222cc8dbd0d0577d98f8dfdf707a5814448455026930b55c04b5cc" },
  eyupsultan: { content: "f34d0b7486d438c1244a5c38c8e52140752969e97028a8b071d9492deadf2177", source: "b00d8866ee907df829d0b5192f7b719b9c098a1de399e8e50686c81667d03bba" },
  fatih: { content: "d21686b88a7a359e252990c2b7ceec8dc47f1a25b024ea98feb832a218405669", source: "9bc07843efd31c6ebf5823f65d5452664263b32700610e7c17dcf2965565933f" },
  gaziosmanpasa: { content: "8c91320e71f776a1b6ea3f570bad7a0e124b195bcdc118772b3ba7162e996a27", source: "03518136817ddbf67e787e88bd016449122d81c02eb2ddf6130b451ec8ef3dca" },
  gungoren: { content: "63c93e7417568e7a5a137e45677286768a2b8bfe0b7c6d0e363d171659ecfb60", source: "10d1f4238148ca486df98434cae0b2b02129a28037dac999734fb58491ccc85c" },
  kagithane: { content: "d1bb4a4b275abf4c6fc5a4afb860330f8cb0512d815b38a4e109267555b2877a", source: "36619e8bcd7ed5a86d22426f32a241954389d2dda7cb1bfd5d31d3b1d85e57a6" },
  kucukcekmece: { content: "94bf304a67d9ab7d7b5906a7f061d0ba48d22d88ced8dc202f40332b4f4310cc", source: "473f39fd0c0b8214ef75edbccc3361717e4f04a94790956384e5e3e02f723485" },
} as const;

export type DistrictBatch2EightPlanCount = {
  create: number;
  update: number;
  skip: number;
  conflict: number;
};
export type DistrictBatch2EightPlanEntry = {
  action: keyof DistrictBatch2EightPlanCount;
  district: string;
  reason: string;
  row: ResearchRecord;
  existing?: ProductionImportDocument;
};
export type DistrictBatch2EightPlan = {
  count: DistrictBatch2EightPlanCount;
  entries: DistrictBatch2EightPlanEntry[];
};
export type DistrictBatch2EightPlanExpectation = "initial" | "applied";

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
      "DistrictBatch2Eight import requires the exact validated 39-district bundle.",
    );
  }
}

function desiredProvenance(
  row: ResearchRecord,
  deploymentSha: string,
  contentFingerprint: string,
): Record<string, unknown> {
  return {
    version: districtBatch2EightImportVersion,
    batch: districtBatch2EightImportBatch,
    sourceCommit: deploymentSha,
    sourceFingerprint: researchFingerprint(row),
    ...row.document,
    fingerprint: contentFingerprint,
  };
}

export function buildDistrictBatch2EightPlan(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
  deploymentSha: string,
): DistrictBatch2EightPlan {
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
        "DistrictBatch2Eight import found an unknown or duplicate district record.",
      );
    }
    byDistrict.set(document.district, document);
  }

  const count: DistrictBatch2EightPlanCount = {
    create: 0,
    update: 0,
    skip: 0,
    conflict: 0,
  };
  const entries = bundle.districts.map((row): DistrictBatch2EightPlanEntry => {
    const existing = byDistrict.get(row.district);
    let action: keyof DistrictBatch2EightPlanCount;
    let reason: string;
    if (!existing) {
      action = "create";
      reason = "missing production district";
    } else if (!districtBatch2EightTargets.includes(row.district as (typeof districtBatch2EightTargets)[number])) {
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
      reason = "DistrictBatch2Eight is unpublished, unmanaged, or manually edited";
    } else {
      const managed = provenance(existing)!;
      const sourceFingerprint = researchFingerprint(row);
      if (
        managed.version === districtBatch2EightImportVersion &&
        managed.batch === districtBatch2EightImportBatch &&
        managed.sourceCommit === deploymentSha &&
        managed.sourceFingerprint === sourceFingerprint
      ) {
        action = "skip";
        reason = "DistrictBatch2Eight quality update already applied";
      } else if (
        managed.version === batch2ImportVersion &&
        managed.batch === "editorial-production-batch-2" &&
        managed.sourceCommit === batch2EditorialSourceCommit &&
        managed.sourceFingerprint === districtBatch2EightProductionBaseline[row.district]?.source &&
        fingerprint(existing) === districtBatch2EightProductionBaseline[row.district]?.content
      ) {
        action = "update";
        reason = "exact managed DistrictBatch2Eight Batch 2 baseline";
      } else {
        action = "conflict";
        reason = "DistrictBatch2Eight does not match the approved managed baseline";
      }
    }
    count[action]++;
    return { action, district: row.district, existing, reason, row };
  });
  return { count, entries };
}

export function assertDistrictBatch2EightPlan(
  plan: DistrictBatch2EightPlan,
  expectation: DistrictBatch2EightPlanExpectation,
): void {
  const updates = plan.entries.filter((entry) => entry.action === "update");
  const exactInitial =
    plan.count.update === 8 &&
    plan.count.skip === 31 &&
    plan.count.create === 0 &&
    plan.count.conflict === 0 &&
    updates.length === 8 &&
    updates.every((entry) => districtBatch2EightTargets.includes(entry.district as (typeof districtBatch2EightTargets)[number]));
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
      `DistrictBatch2Eight import does not match the exact ${expectation} gate.`,
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
    managed?.version !== districtBatch2EightImportVersion ||
    managed?.batch !== districtBatch2EightImportBatch ||
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
      "DistrictBatch2Eight post-write verification failed.",
    );
  }
}

export async function readDistrictBatch2EightPlan(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  expectation: DistrictBatch2EightPlanExpectation,
  deploymentSha: string,
): Promise<DistrictBatch2EightPlan> {
  let documents: ProductionImportDocument[];
  try {
    documents = await repository.readDistricts();
  } catch {
    throw productionImportError("query_failed", "District read failed.");
  }
  const plan = buildDistrictBatch2EightPlan(documents, bundle, deploymentSha);
  assertDistrictBatch2EightPlan(plan, expectation);
  return plan;
}

export async function applyDistrictBatch2Eight(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  deploymentSha: string,
): Promise<DistrictBatch2EightPlan> {
  return repository.transaction(async (transaction) => {
    const beforeDocuments = await transaction.findDistricts();
    const plan = buildDistrictBatch2EightPlan(beforeDocuments, bundle, deploymentSha);
    assertDistrictBatch2EightPlan(plan, "initial");
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
        !districtBatch2EightTargets.includes(document.district as (typeof districtBatch2EightTargets)[number]) &&
        fingerprint(document) !== beforeFingerprints.get(document.district)
      ) {
        throw productionImportError(
          "transaction_failed",
          "A non-target district changed.",
        );
      }
    }
    const appliedPlan = buildDistrictBatch2EightPlan(
      afterDocuments,
      bundle,
      deploymentSha,
    );
    assertDistrictBatch2EightPlan(appliedPlan, "applied");
    return plan;
  });
}

export const districtBatch2EightConfigurationVariables = [
  "PAYLOAD_DATABASE",
  "DATABASE_URL",
  "PAYLOAD_SECRET",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "PRODUCTION_DISTRICT_BATCH2_EIGHT_EDITORIAL_DRY_RUN_APPROVED_SHA",
] as const;

type ConfigurationStatus = "MISSING" | "PRESENT_INVALID" | "PRESENT_VALID";

export function districtBatch2EightConfigurationStatus(
  env: Readonly<Record<string, string | undefined>>,
): Record<(typeof districtBatch2EightConfigurationVariables)[number], ConfigurationStatus> {
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
    PRODUCTION_DISTRICT_BATCH2_EIGHT_EDITORIAL_DRY_RUN_APPROVED_SHA: exact(
      env.PRODUCTION_DISTRICT_BATCH2_EIGHT_EDITORIAL_DRY_RUN_APPROVED_SHA,
      env.VERCEL_GIT_COMMIT_SHA || "__missing_commit_sha__",
    ),
  };
}

export function assertDistrictBatch2EightEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  apply: boolean,
): void {
  const status = districtBatch2EightConfigurationStatus(env);
  if (
    districtBatch2EightConfigurationVariables.some(
      (name) => status[name] !== "PRESENT_VALID",
    )
  ) {
    throw productionImportError(
      "approval_failed",
      "DistrictBatch2Eight import requires an exact SHA-bound Production environment.",
    );
  }
  if (
    apply &&
    (env.PRODUCTION_DISTRICT_BATCH2_EIGHT_EDITORIAL_IMPORT_APPROVED !== "true" ||
      env.PRODUCTION_DISTRICT_BATCH2_EIGHT_EDITORIAL_PITR_CONFIRMED !== "true")
  ) {
    throw productionImportError(
      "approval_failed",
      "DistrictBatch2Eight apply requires explicit import and PITR confirmation.",
    );
  }
}
