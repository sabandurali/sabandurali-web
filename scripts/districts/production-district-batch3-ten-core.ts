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

export const districtBatch3TenTargets = [
  "sariyer",
  "silivri",
  "sultangazi",
  "sisli",
  "zeytinburnu",
  "adalar",
  "atasehir",
  "beykoz",
  "cekmekoy",
  "kadikoy",
] as const;
export const districtBatch3TenImportVersion = 7;
export const districtBatch3TenImportBatch = "districtBatch3Ten-editorial-quality-2026";
// Read-only audited Production state immediately before this ten-district
// update. Both hashes must match; the importer never learns a baseline at run time.
const districtBatch3TenProductionBaseline: Record<string, { content: string; source: string }> = {
  sariyer: { content: "0316643d360fcb5170cf3cdada133fd2a4d11f75dc601db9b46b22310d8c710e", source: "7553bb4147f717a539d5e290d03e35d61ff612d90fc0d84c09915853a3682abd" },
  silivri: { content: "2fecc3f04636e5ce52bf28e8d2c5e118bf883bae0dc33332ca8c743576703fbe", source: "0219578514550a4ffa2497281d2bfcbcc2b03a2fa642bae3e67f9cea051061af" },
  sultangazi: { content: "484179c60049872fd4946c5e0674abb7d3d92a745291614770c5f12d2ca393c1", source: "68727c46790e3ec932ad5528d11deb667131a72d1440db779d9f0897a657e163" },
  sisli: { content: "e92e12b06fc1658862508c04b70d3d521605fbe42e3cbd978091347a470b9c0b", source: "dac630335d3c418efa7f07e40bb14bfd01ddf67fc538818e427dea186cd8737c" },
  zeytinburnu: { content: "7ba21df458f6038f8259bdffe8e43d68efa133fbafa7306ab6dc538d35a2251f", source: "a181550c487a8c81fc95a191c55b92827addba91ba3577141a6e1cc0e00689bd" },
  adalar: { content: "b564f37389e876311c6d50de7c5c5683051d895549b8381f1ef7a55b2c5a6101", source: "fd9f8a3fe471b300f7dc17b50808249f272d1c95efe890f6113f668246626ed0" },
  atasehir: { content: "54ad72987d6d616aebb10bd84fff63f577a842a0d4f612c10b053ad8e588ba65", source: "676cd598884430aa3e6bf7f4a388f301414801baebb1af451a808add678e3004" },
  beykoz: { content: "555e5486820b2ae38a82591bd509176778d717a79a88784a7de3b389e307ea17", source: "88151879ec146fa997befccc3d07213d21ffe835568b8e976eb9f34c3c02e21f" },
  cekmekoy: { content: "50d37fca613c64a2c3a9fb37d2d10f231c1051d0a4f9e025ab65a2d5a2ec2e28", source: "fe5ec880ff193f919f50bbbb3991cd9f7757d952dd722fc0b68c57c848f769e9" },
  kadikoy: { content: "6634109b9b69d123ea5478b603b5d5a5fa5ee8a9e38596de7d1b6dbc59ef09fa", source: "34c85f004f18e89b8cec284aa05195ecab4057701d11beef868bb730ecdf26f6" },
} as const;

export type DistrictBatch3TenPlanCount = {
  create: number;
  update: number;
  skip: number;
  conflict: number;
};
export type DistrictBatch3TenPlanEntry = {
  action: keyof DistrictBatch3TenPlanCount;
  district: string;
  reason: string;
  row: ResearchRecord;
  existing?: ProductionImportDocument;
};
export type DistrictBatch3TenPlan = {
  count: DistrictBatch3TenPlanCount;
  entries: DistrictBatch3TenPlanEntry[];
};
export type DistrictBatch3TenPlanExpectation = "initial" | "applied";

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
      "DistrictBatch3Ten import requires the exact validated 39-district bundle.",
    );
  }
}

function desiredProvenance(
  row: ResearchRecord,
  deploymentSha: string,
  contentFingerprint: string,
): Record<string, unknown> {
  return {
    version: districtBatch3TenImportVersion,
    batch: districtBatch3TenImportBatch,
    sourceCommit: deploymentSha,
    sourceFingerprint: researchFingerprint(row),
    ...row.document,
    fingerprint: contentFingerprint,
  };
}

export function buildDistrictBatch3TenPlan(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
  deploymentSha: string,
): DistrictBatch3TenPlan {
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
        "DistrictBatch3Ten import found an unknown or duplicate district record.",
      );
    }
    byDistrict.set(document.district, document);
  }

  const count: DistrictBatch3TenPlanCount = {
    create: 0,
    update: 0,
    skip: 0,
    conflict: 0,
  };
  const entries = bundle.districts.map((row): DistrictBatch3TenPlanEntry => {
    const existing = byDistrict.get(row.district);
    let action: keyof DistrictBatch3TenPlanCount;
    let reason: string;
    if (!existing) {
      action = "create";
      reason = "missing production district";
    } else if (!districtBatch3TenTargets.includes(row.district as (typeof districtBatch3TenTargets)[number])) {
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
      reason = "DistrictBatch3Ten is unpublished, unmanaged, or manually edited";
    } else {
      const managed = provenance(existing)!;
      const sourceFingerprint = researchFingerprint(row);
      if (
        managed.version === districtBatch3TenImportVersion &&
        managed.batch === districtBatch3TenImportBatch &&
        managed.sourceCommit === deploymentSha &&
        managed.sourceFingerprint === sourceFingerprint
      ) {
        action = "skip";
        reason = "DistrictBatch3Ten quality update already applied";
      } else if (
        managed.version === batch2ImportVersion &&
        managed.batch === "editorial-production-batch-2" &&
        managed.sourceCommit === batch2EditorialSourceCommit &&
        managed.sourceFingerprint === districtBatch3TenProductionBaseline[row.district]?.source &&
        fingerprint(existing) === districtBatch3TenProductionBaseline[row.district]?.content
      ) {
        action = "update";
        reason = "exact managed DistrictBatch3Ten Batch 2 baseline";
      } else {
        action = "conflict";
        reason = "DistrictBatch3Ten does not match the approved managed baseline";
      }
    }
    count[action]++;
    return { action, district: row.district, existing, reason, row };
  });
  return { count, entries };
}

export function assertDistrictBatch3TenPlan(
  plan: DistrictBatch3TenPlan,
  expectation: DistrictBatch3TenPlanExpectation,
): void {
  const updates = plan.entries.filter((entry) => entry.action === "update");
  const exactInitial =
    plan.count.update === 10 &&
    plan.count.skip === 29 &&
    plan.count.create === 0 &&
    plan.count.conflict === 0 &&
    updates.length === 10 &&
    updates.every((entry) => districtBatch3TenTargets.includes(entry.district as (typeof districtBatch3TenTargets)[number]));
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
      `DistrictBatch3Ten import does not match the exact ${expectation} gate.`,
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
    managed?.version !== districtBatch3TenImportVersion ||
    managed?.batch !== districtBatch3TenImportBatch ||
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
      "DistrictBatch3Ten post-write verification failed.",
    );
  }
}

export async function readDistrictBatch3TenPlan(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  expectation: DistrictBatch3TenPlanExpectation,
  deploymentSha: string,
): Promise<DistrictBatch3TenPlan> {
  let documents: ProductionImportDocument[];
  try {
    documents = await repository.readDistricts();
  } catch {
    throw productionImportError("query_failed", "District read failed.");
  }
  const plan = buildDistrictBatch3TenPlan(documents, bundle, deploymentSha);
  assertDistrictBatch3TenPlan(plan, expectation);
  return plan;
}

export async function applyDistrictBatch3Ten(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  deploymentSha: string,
): Promise<DistrictBatch3TenPlan> {
  return repository.transaction(async (transaction) => {
    const beforeDocuments = await transaction.findDistricts();
    const plan = buildDistrictBatch3TenPlan(beforeDocuments, bundle, deploymentSha);
    assertDistrictBatch3TenPlan(plan, "initial");
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
        !districtBatch3TenTargets.includes(document.district as (typeof districtBatch3TenTargets)[number]) &&
        fingerprint(document) !== beforeFingerprints.get(document.district)
      ) {
        throw productionImportError(
          "transaction_failed",
          "A non-target district changed.",
        );
      }
    }
    const appliedPlan = buildDistrictBatch3TenPlan(
      afterDocuments,
      bundle,
      deploymentSha,
    );
    assertDistrictBatch3TenPlan(appliedPlan, "applied");
    return plan;
  });
}

export const districtBatch3TenConfigurationVariables = [
  "PAYLOAD_DATABASE",
  "DATABASE_URL",
  "PAYLOAD_SECRET",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "PRODUCTION_DISTRICT_BATCH3_TEN_EDITORIAL_DRY_RUN_APPROVED_SHA",
] as const;

type ConfigurationStatus = "MISSING" | "PRESENT_INVALID" | "PRESENT_VALID";

export function districtBatch3TenConfigurationStatus(
  env: Readonly<Record<string, string | undefined>>,
): Record<(typeof districtBatch3TenConfigurationVariables)[number], ConfigurationStatus> {
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
    PRODUCTION_DISTRICT_BATCH3_TEN_EDITORIAL_DRY_RUN_APPROVED_SHA: exact(
      env.PRODUCTION_DISTRICT_BATCH3_TEN_EDITORIAL_DRY_RUN_APPROVED_SHA,
      env.VERCEL_GIT_COMMIT_SHA || "__missing_commit_sha__",
    ),
  };
}

export function assertDistrictBatch3TenEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  apply: boolean,
): void {
  const status = districtBatch3TenConfigurationStatus(env);
  if (
    districtBatch3TenConfigurationVariables.some(
      (name) => status[name] !== "PRESENT_VALID",
    )
  ) {
    throw productionImportError(
      "approval_failed",
      "DistrictBatch3Ten import requires an exact SHA-bound Production environment.",
    );
  }
  if (
    apply &&
    (env.PRODUCTION_DISTRICT_BATCH3_TEN_EDITORIAL_IMPORT_APPROVED !== "true" ||
      env.PRODUCTION_DISTRICT_BATCH3_TEN_EDITORIAL_PITR_CONFIRMED !== "true")
  ) {
    throw productionImportError(
      "approval_failed",
      "DistrictBatch3Ten apply requires explicit import and PITR confirmation.",
    );
  }
}
