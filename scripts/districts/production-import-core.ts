import {
  assertBatch1PopulationImportPlan,
  type Batch1PopulationImportPlan,
} from "./editorial";
import {
  decideImport,
  fingerprint,
  importVersion,
  makeDraft,
  researchFingerprint,
  type ResearchBundle,
  type ResearchRecord,
} from "./import-core";

export type ProductionImportDocument = Record<string, unknown> & {
  id: number | string;
  district?: unknown;
};

export type ProductionImportEntry = {
  action: "create" | "update" | "skip" | "conflict";
  district: string;
  existing?: ProductionImportDocument;
  reason: string;
  row: ResearchRecord;
};

export type ProductionImportPlan = {
  count: Batch1PopulationImportPlan;
  entries: ProductionImportEntry[];
};

export type ProductionImportTransaction = {
  findDistricts(): Promise<ProductionImportDocument[]>;
  updateDistrict(
    id: number | string,
    data: Record<string, unknown>,
  ): Promise<ProductionImportDocument>;
};

export type ProductionImportRepository = {
  readDistricts(): Promise<ProductionImportDocument[]>;
  transaction<T>(
    operation: (transaction: ProductionImportTransaction) => Promise<T>,
  ): Promise<T>;
};

export type ProductionImportErrorCategory =
  | "approval_failed"
  | "authentication_failed"
  | "configuration_failed"
  | "connection_failed"
  | "fingerprint_failed"
  | "initialization_failed"
  | "input_failed"
  | "planning_failed"
  | "query_failed"
  | "rollback_failed"
  | "schema_mismatch"
  | "transaction_failed"
  | "unknown_failed";

export type ProductionImportConfigurationStatus =
  | "MISSING"
  | "PRESENT_INVALID"
  | "PRESENT_VALID";

export const productionDryRunConfigurationVariables = [
  "PAYLOAD_DATABASE",
  "DATABASE_URL",
  "PAYLOAD_SECRET",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA",
] as const;

export type ProductionDryRunConfigurationVariable =
  (typeof productionDryRunConfigurationVariables)[number];

export class ProductionImportSafetyError extends Error {
  readonly category: ProductionImportErrorCategory;

  constructor(category: ProductionImportErrorCategory, message: string) {
    super(message);
    this.name = "ProductionImportSafetyError";
    this.category = category;
  }
}

export function productionImportError(
  category: ProductionImportErrorCategory,
  message: string,
): ProductionImportSafetyError {
  return new ProductionImportSafetyError(category, message);
}

export function safeProductionImportErrorCategory(
  error: unknown,
): ProductionImportErrorCategory {
  return error instanceof ProductionImportSafetyError
    ? error.category
    : "unknown_failed";
}

function requiredValueStatus(
  value: string | undefined,
): ProductionImportConfigurationStatus {
  return value?.trim() ? "PRESENT_VALID" : "MISSING";
}

function exactValueStatus(
  value: string | undefined,
  expected: string,
): ProductionImportConfigurationStatus {
  if (!value?.trim()) return "MISSING";
  return value === expected ? "PRESENT_VALID" : "PRESENT_INVALID";
}

export function productionDryRunConfigurationStatus(
  env: Readonly<Record<string, string | undefined>>,
): Record<
  ProductionDryRunConfigurationVariable,
  ProductionImportConfigurationStatus
> {
  return {
    PAYLOAD_DATABASE: exactValueStatus(env.PAYLOAD_DATABASE, "postgres"),
    DATABASE_URL: requiredValueStatus(env.DATABASE_URL),
    PAYLOAD_SECRET: requiredValueStatus(env.PAYLOAD_SECRET),
    VERCEL: exactValueStatus(env.VERCEL, "1"),
    VERCEL_ENV: exactValueStatus(env.VERCEL_ENV, "production"),
    VERCEL_GIT_COMMIT_REF: exactValueStatus(
      env.VERCEL_GIT_COMMIT_REF,
      "main",
    ),
    VERCEL_GIT_COMMIT_SHA: requiredValueStatus(env.VERCEL_GIT_COMMIT_SHA),
    PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA: exactValueStatus(
      env.PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA,
      env.VERCEL_GIT_COMMIT_SHA || "__missing_commit_sha__",
    ),
  };
}

const requiredApproval = "true";

export function assertProductionImportEnvironment(
  env: Readonly<Record<string, string | undefined>>,
  apply: boolean,
): void {
  const status = productionDryRunConfigurationStatus(env);
  if (status.PAYLOAD_DATABASE !== "PRESENT_VALID") {
    throw productionImportError(
      "configuration_failed",
      "PAYLOAD_DATABASE must be postgres.",
    );
  }
  if (status.DATABASE_URL !== "PRESENT_VALID") {
    throw productionImportError(
      "configuration_failed",
      "DATABASE_URL is required.",
    );
  }
  if (status.PAYLOAD_SECRET !== "PRESENT_VALID") {
    throw productionImportError(
      "configuration_failed",
      "PAYLOAD_SECRET is required.",
    );
  }
  if (apply) {
    if (env.PRODUCTION_DISTRICT_IMPORT_APPROVED !== requiredApproval) {
      throw productionImportError(
        "approval_failed",
        "Production district import approval is required.",
      );
    }
    if (env.PRODUCTION_PITR_CONFIRMED !== requiredApproval) {
      throw productionImportError(
        "approval_failed",
        "Production district import PITR approval is required for apply.",
      );
    }
  } else {
    for (const variableName of [
      "VERCEL",
      "VERCEL_ENV",
      "VERCEL_GIT_COMMIT_REF",
      "VERCEL_GIT_COMMIT_SHA",
      "PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA",
    ] as const) {
      if (status[variableName] !== "PRESENT_VALID") {
        throw productionImportError(
          "approval_failed",
          "Production dry-run requires a SHA-bound Vercel Production approval.",
        );
      }
    }
  }
}

export function buildProductionImportPlan(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
): ProductionImportPlan {
  const byDistrict = new Map<string, ProductionImportDocument>();
  for (const document of existingDocuments) {
    if (typeof document.district !== "string") continue;
    if (byDistrict.has(document.district)) {
      throw productionImportError(
        "planning_failed",
        "Production contains a duplicate district record.",
      );
    }
    byDistrict.set(document.district, document);
  }

  const count: Batch1PopulationImportPlan = {
    create: 0,
    update: 0,
    skip: 0,
    conflict: 0,
  };
  const entries = bundle.districts.map((row): ProductionImportEntry => {
    const existing = byDistrict.get(row.district);
    const decision = decideImport(existing, row);
    const action =
      decision.action === "skip" && decision.reason !== "unchanged source"
        ? "conflict"
        : decision.action;
    count[action]++;
    return {
      action,
      district: row.district,
      existing,
      reason: decision.reason,
      row,
    };
  });

  return { count, entries };
}

export function assertProductionImportPlan(plan: ProductionImportPlan): void {
  try {
    assertBatch1PopulationImportPlan(plan.count);
  } catch {
    throw productionImportError(
      "planning_failed",
      "Production import plan does not match the exact 8/31 gate.",
    );
  }
  if (
    plan.entries.some(
      (entry) => entry.action === "create" || entry.action === "conflict",
    )
  ) {
    throw productionImportError(
      "planning_failed",
      "Production import cannot create or overwrite conflicts.",
    );
  }
}

export async function readProductionImportPlan(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
): Promise<ProductionImportPlan> {
  let documents: ProductionImportDocument[];
  try {
    documents = await repository.readDistricts();
  } catch {
    throw productionImportError(
      "query_failed",
      "Production district read failed.",
    );
  }
  const plan = buildProductionImportPlan(documents, bundle);
  assertProductionImportPlan(plan);
  return plan;
}

export async function applyProductionImport(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
): Promise<ProductionImportPlan> {
  return repository.transaction(async (transaction) => {
    // The complete, transaction-consistent plan is materialized and checked
    // before the first update is allowed to start.
    const plan = buildProductionImportPlan(
      await transaction.findDistricts(),
      bundle,
    );
    assertProductionImportPlan(plan);

    for (const entry of plan.entries) {
      if (entry.action !== "update") continue;
      if (!entry.existing) {
        throw new Error("An update target disappeared before write.");
      }
      const saved = await transaction.updateDistrict(
        entry.existing.id,
        makeDraft(entry.row) as Record<string, unknown>,
      );
      await transaction.updateDistrict(entry.existing.id, {
        importProvenance: {
          version: importVersion,
          sourceFingerprint: researchFingerprint(entry.row),
          ...entry.row.document,
          fingerprint: fingerprint(saved),
        },
      });
    }

    return plan;
  });
}
