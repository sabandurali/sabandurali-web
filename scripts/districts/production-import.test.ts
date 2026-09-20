import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { describeProductionDatabase } from "../vercel-build.mjs";
import {
  attachEditorial,
  batch1PopulationFacts,
  type EditorialBundle,
} from "./editorial";
import {
  fingerprint,
  importVersion,
  makeDraft,
  researchFingerprint,
  type ResearchBundle,
  type ResearchRecord,
} from "./import-core";
import {
  applyProductionImport,
  assertProductionImportEnvironment,
  buildProductionImportPlan,
  productionDryRunConfigurationStatus,
  productionImportError,
  readProductionImportPlan,
  safeProductionImportErrorCategory,
  safeProductionImportErrorReport,
  type ProductionImportDocument,
  type ProductionImportRepository,
  type ProductionImportTransaction,
} from "./production-import-core";

function readBundle(): ResearchBundle {
  const research = JSON.parse(
    readFileSync("data/districts/research.json", "utf8"),
  ) as ResearchBundle;
  const editorial = JSON.parse(
    readFileSync("data/districts/editorial.json", "utf8"),
  ) as EditorialBundle;
  return attachEditorial(research, editorial);
}

function managedDocument(
  row: ResearchRecord,
  id: number,
  sourceIsCurrent: boolean,
): ProductionImportDocument {
  const data = makeDraft(row) as Record<string, unknown>;
  return {
    id,
    ...structuredClone(data),
    importProvenance: {
      version: importVersion,
      sourceFingerprint: sourceIsCurrent
        ? researchFingerprint(row)
        : "0".repeat(64),
      ...row.document,
      fingerprint: fingerprint(data),
    },
  };
}

function batch1Fixture(): {
  bundle: ResearchBundle;
  documents: ProductionImportDocument[];
} {
  const bundle = readBundle();
  const updatedDistricts = new Set(Object.keys(batch1PopulationFacts));
  return {
    bundle,
    documents: bundle.districts.map((row, index) =>
      managedDocument(row, index + 1, !updatedDistricts.has(row.district)),
    ),
  };
}

class MemoryRepository implements ProductionImportRepository {
  documents: ProductionImportDocument[];
  failOnUpdateCall?: number;
  updateCalls = 0;

  constructor(documents: ProductionImportDocument[]) {
    this.documents = structuredClone(documents);
  }

  async readDistricts(): Promise<ProductionImportDocument[]> {
    return structuredClone(this.documents);
  }

  async transaction<T>(
    operation: (transaction: ProductionImportTransaction) => Promise<T>,
  ): Promise<T> {
    const snapshot = structuredClone(this.documents);
    const transaction: ProductionImportTransaction = {
      findDistricts: async () => structuredClone(this.documents),
      updateDistrict: async (id, data) => {
        this.updateCalls++;
        if (this.updateCalls === this.failOnUpdateCall) {
          throw new Error("fixture write failure");
        }
        const index = this.documents.findIndex((document) => document.id === id);
        if (index < 0) throw new Error("fixture document missing");
        this.documents[index] = {
          ...this.documents[index],
          ...structuredClone(data),
        };
        return structuredClone(this.documents[index]);
      },
    };
    try {
      return await operation(transaction);
    } catch (error) {
      this.documents = snapshot;
      throw error;
    }
  }
}

test("production target rejects non-PostgreSQL and wrong fingerprints", () => {
  assert.throws(
    () =>
      assertProductionImportEnvironment(
        {
          DATABASE_URL: "file:local.db",
          PAYLOAD_DATABASE: "sqlite",
          PAYLOAD_SECRET: "fixture",
        },
        false,
      ),
    /must be postgres/,
  );
  assert.throws(
    () =>
      describeProductionDatabase(
        "postgresql://fixture:fixture@preview.invalid:5432/neondb",
      ),
    /identity does not match/,
  );
});

test("apply requires explicit import and PITR approvals", () => {
  const base = {
    DATABASE_URL: "postgresql://fixture.invalid/neondb",
    PAYLOAD_DATABASE: "postgres",
    PAYLOAD_SECRET: "fixture",
  };
  assert.throws(
    () => assertProductionImportEnvironment(base, false),
    /SHA-bound Vercel Production approval/,
  );
  const approvedDryRun = {
    ...base,
    PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA: "a".repeat(40),
    VERCEL: "1",
    VERCEL_ENV: "production",
    VERCEL_GIT_COMMIT_REF: "main",
    VERCEL_GIT_COMMIT_SHA: "a".repeat(40),
  };
  assert.doesNotThrow(() =>
    assertProductionImportEnvironment(approvedDryRun, false),
  );
  assert.throws(
    () => assertProductionImportEnvironment(base, true),
    /import approval is required/,
  );
  const approvedImport = {
    ...base,
    PRODUCTION_DISTRICT_IMPORT_APPROVED: "true",
  };
  assert.throws(
    () => assertProductionImportEnvironment(approvedImport, true),
    /PITR approval is required/,
  );
  assert.doesNotThrow(() =>
    assertProductionImportEnvironment(
      {
        ...approvedImport,
        PRODUCTION_PITR_CONFIRMED: "true",
      },
      true,
    ),
  );
});

test("error reporting exposes only a fixed safe category", () => {
  const secret = "postgresql://user:do-not-print@example.invalid/neondb";
  const error = productionImportError(
    "connection_failed",
    `unsafe driver detail: ${secret}`,
  );
  const output = JSON.stringify({
    error: safeProductionImportErrorCategory(error),
  });
  assert.equal(output, '{"error":"connection_failed"}');
  assert.doesNotMatch(output, /do-not-print|postgresql:/);
});

test("configuration reporting returns statuses without values", () => {
  const secret = "postgresql://user:do-not-print@example.invalid/neondb";
  const status = productionDryRunConfigurationStatus({
    DATABASE_URL: secret,
    PAYLOAD_DATABASE: "sqlite",
    PAYLOAD_SECRET: "do-not-print",
    PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA: "different",
    VERCEL: "1",
    VERCEL_ENV: "preview",
    VERCEL_GIT_COMMIT_REF: "feature",
    VERCEL_GIT_COMMIT_SHA: "expected",
  });
  assert.deepEqual(status, {
    PAYLOAD_DATABASE: "PRESENT_INVALID",
    DATABASE_URL: "PRESENT_VALID",
    PAYLOAD_SECRET: "PRESENT_VALID",
    VERCEL: "PRESENT_VALID",
    VERCEL_ENV: "PRESENT_INVALID",
    VERCEL_GIT_COMMIT_REF: "PRESENT_INVALID",
    VERCEL_GIT_COMMIT_SHA: "PRESENT_VALID",
    PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA: "PRESENT_INVALID",
  });
  const output = JSON.stringify(status);
  assert.doesNotMatch(output, /do-not-print|postgresql:|sqlite/);
});

test("PostgreSQL dry-run plan is exactly 8 update and 31 skip", async () => {
  const { bundle, documents } = batch1Fixture();
  const repository = new MemoryRepository(documents);
  const plan = await readProductionImportPlan(bundle, repository);
  assert.deepEqual(plan.count, {
    create: 0,
    update: 8,
    skip: 31,
    conflict: 0,
  });
  assert.equal(repository.updateCalls, 0);
});

test("manual, unmanaged and published records fail before the first write", async () => {
  for (const protection of ["manual", "unmanaged", "published"] as const) {
    const { bundle, documents } = batch1Fixture();
    const target = documents.find(
      (document) => document.district === Object.keys(batch1PopulationFacts)[0],
    )!;
    if (protection === "manual") target.history = "manual production edit";
    if (protection === "unmanaged") delete target.importProvenance;
    if (protection === "published") target._status = "published";
    const repository = new MemoryRepository(documents);
    let failure: unknown;
    try {
      await applyProductionImport(bundle, repository);
    } catch (error) {
      failure = error;
    }
    assert.match((failure as Error).message, /exact 8\/31 gate/);
    assert.deepEqual(safeProductionImportErrorReport(failure), {
      error: "planning_failed",
      plan: { update: 7, skip: 31, create: 0, conflict: 1 },
    });
    assert.equal(repository.updateCalls, 0);
    assert.equal(
      buildProductionImportPlan(repository.documents, bundle).count.conflict,
      1,
    );
  }
});

test("all writes roll back when any update fails", async () => {
  const { bundle, documents } = batch1Fixture();
  const repository = new MemoryRepository(documents);
  const before = structuredClone(repository.documents);
  repository.failOnUpdateCall = 3;
  await assert.rejects(
    applyProductionImport(bundle, repository),
    /fixture write failure/,
  );
  assert.deepEqual(repository.documents, before);
});

test("successful transaction is idempotent on its second plan", async () => {
  const { bundle, documents } = batch1Fixture();
  const repository = new MemoryRepository(documents);
  const first = await applyProductionImport(bundle, repository);
  assert.deepEqual(first.count, {
    create: 0,
    update: 8,
    skip: 31,
    conflict: 0,
  });
  const second = buildProductionImportPlan(repository.documents, bundle);
  assert.deepEqual(second.count, {
    create: 0,
    update: 0,
    skip: 39,
    conflict: 0,
  });
});
