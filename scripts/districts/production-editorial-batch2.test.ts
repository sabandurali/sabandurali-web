import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projectPublishedDistrictGuide } from "../../src/content/districts/district-guide-projection";
import { districts } from "../../src/content/districts/district-registry";
import { attachEditorial, type EditorialBundle } from "./editorial";
import {
  fingerprint,
  importVersion,
  makeDraft,
  researchFingerprint,
  type ResearchBundle,
  type ResearchRecord,
} from "./import-core";
import {
  applyBatch2ForTest,
  assertBatch2Environment,
  assertBatch2Plan,
  batch2ConfigurationStatus,
  batch2ExcludedDistrict,
  batch2ImportVersion,
  batch2TargetSlugs,
  batch2VerifiedBaseline,
  batch2VerifiedBaselineDeploymentSha,
  buildBatch2PlanForTest,
  buildBatch2Plan,
  makePublishedEditorialUpdate,
  readBatch2PlanForTest,
  validateBatch2VerifiedBaseline,
  type Batch2BaselineFingerprints,
} from "./production-editorial-batch2-core";
import type {
  ProductionImportDocument,
  ProductionImportRepository,
  ProductionImportTransaction,
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

function managedPublishedDocument(
  row: ResearchRecord,
  id: number,
): ProductionImportDocument {
  const document = {
    id,
    ...(makeDraft(row) as Record<string, unknown>),
    _status: "published",
    publishedAt: "2026-09-01T10:00:00.000Z",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    unrelatedField: `preserve-${row.district}`,
  } as ProductionImportDocument;
  if (row.district !== batch2ExcludedDistrict) {
    document.summary = `BATCH 2 BASELINE — ${row.district}`;
  }
  document.importProvenance = {
    version: importVersion,
    sourceFingerprint:
      row.district === batch2ExcludedDistrict
        ? researchFingerprint(row)
        : batch2VerifiedBaseline.districts[row.district].sourceFingerprint,
    ...row.document,
    fingerprint: fingerprint(document),
  };
  return document;
}

function batch2Fixture(): {
  baseline: Batch2BaselineFingerprints;
  bundle: ResearchBundle;
  documents: ProductionImportDocument[];
} {
  const bundle = readBundle();
  const documents = bundle.districts.map((row, index) =>
    managedPublishedDocument(row, index + 1),
  );
  return {
    baseline: Object.fromEntries(
      documents
        .filter((document) => document.district !== batch2ExcludedDistrict)
        .map((document) => [
          document.district as string,
          {
            content: fingerprint(document),
            source: String(
              (document.importProvenance as Record<string, unknown>)
                .sourceFingerprint,
            ),
          },
        ]),
    ),
    bundle,
    documents,
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
          throw new Error("fixture Batch 2 write failure");
        }
        const index = this.documents.findIndex((document) => document.id === id);
        if (index < 0) throw new Error("fixture district missing");
        this.documents[index] = {
          ...this.documents[index],
          ...structuredClone(data),
          updatedAt: "2026-09-26T19:00:00.000Z",
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

function target(
  documents: ProductionImportDocument[],
): ProductionImportDocument {
  return documents.find(
    (document) => document.district === batch2TargetSlugs[0],
  )!;
}

test("A: verified baseline contains the exact 38 target districts", () => {
  assert.equal(batch2VerifiedBaseline.targetCount, 38);
  assert.equal(Object.keys(batch2VerifiedBaseline.districts).length, 38);
  assert.equal(batch2TargetSlugs.length, 38);
  assert.deepEqual(
    new Set(Object.keys(batch2VerifiedBaseline.districts)),
    new Set(
      districts
        .map((district) => district.slug)
        .filter((slug) => slug !== batch2ExcludedDistrict),
    ),
  );
  assert.doesNotThrow(() =>
    validateBatch2VerifiedBaseline(batch2VerifiedBaseline),
  );
});

test("B: Esenler is absent from the verified baseline", () => {
  assert.equal(batch2VerifiedBaseline.excludedDistrict, "esenler");
  assert.equal("esenler" in batch2VerifiedBaseline.districts, false);
  assert.ok(!batch2TargetSlugs.includes(batch2ExcludedDistrict));
});

test("C: every verified baseline fingerprint is a SHA-256 hash", () => {
  assert.ok(
    Object.values(batch2VerifiedBaseline.districts).every(
      ({ sourceFingerprint, contentFingerprint }) =>
        /^[a-f0-9]{64}$/.test(sourceFingerprint) &&
        /^[a-f0-9]{64}$/.test(contentFingerprint),
    ),
  );
});

test("D: verified baseline is bound to the audited Production deployment", () => {
  assert.equal(
    batch2VerifiedBaseline.productionDeploymentSha,
    "61294853c29348512a37541bc1c4efdd4f473fec",
  );
  assert.equal(
    batch2VerifiedBaseline.productionDeploymentSha,
    batch2VerifiedBaselineDeploymentSha,
  );
});

test("Batch 2 uses separate SHA, import, and PITR approvals", () => {
  const sha = "a".repeat(40);
  const base = {
    PAYLOAD_DATABASE: "postgres",
    DATABASE_URL: "postgresql://fixture.invalid/neondb",
    PAYLOAD_SECRET: "fixture",
    VERCEL: "1",
    VERCEL_ENV: "production",
    VERCEL_GIT_COMMIT_REF: "main",
    VERCEL_GIT_COMMIT_SHA: sha,
    PRODUCTION_DISTRICT_BATCH2_DRY_RUN_APPROVED_SHA: sha,
  };
  assert.doesNotThrow(() => assertBatch2Environment(base, false));
  assert.throws(() => assertBatch2Environment(base, true), /import approval/);
  assert.throws(
    () =>
      assertBatch2Environment(
        { ...base, PRODUCTION_DISTRICT_BATCH2_IMPORT_APPROVED: "true" },
        true,
      ),
    /PITR confirmation/,
  );
  assert.doesNotThrow(() =>
    assertBatch2Environment(
      {
        ...base,
        PRODUCTION_DISTRICT_BATCH2_IMPORT_APPROVED: "true",
        PRODUCTION_DISTRICT_BATCH2_PITR_CONFIRMED: "true",
      },
      true,
    ),
  );
  assert.throws(
    () =>
      assertBatch2Environment(
        {
          ...base,
          PRODUCTION_DISTRICT_BATCH2_DRY_RUN_APPROVED_SHA: "b".repeat(40),
        },
        false,
      ),
    /SHA-bound Production environment/,
  );
  const status = JSON.stringify(
    batch2ConfigurationStatus({
      ...base,
      DATABASE_URL: "postgresql://secret:do-not-log@example.invalid/neondb",
      PAYLOAD_SECRET: "do-not-log",
    }),
  );
  assert.doesNotMatch(status, /secret|do-not-log|postgresql:/);
});

test("E: verified fixture plans exactly 38 updates and one Esenler skip", async () => {
  const { baseline, bundle, documents } = batch2Fixture();
  const repository = new MemoryRepository(documents);
  const plan = await readBatch2PlanForTest(
    bundle,
    repository,
    "initial",
    baseline,
  );
  assert.deepEqual(plan.count, {
    create: 0,
    update: 38,
    skip: 1,
    conflict: 0,
  });
  assert.deepEqual(
    plan.entries.filter((entry) => entry.action === "skip").map((entry) => entry.district),
    [batch2ExcludedDistrict],
  );
  assert.deepEqual(
    new Set(plan.entries.filter((entry) => entry.action === "update").map((entry) => entry.district)),
    new Set(batch2TargetSlugs),
  );
  assert.equal(repository.updateCalls, 0);
});

test("B: a plan that updates Esenler fails closed", () => {
  const { baseline, bundle, documents } = batch2Fixture();
  const plan = buildBatch2PlanForTest(documents, bundle, baseline);
  const esenler = plan.entries.find(
    (entry) => entry.district === batch2ExcludedDistrict,
  )!;
  esenler.action = "update";
  plan.count.skip--;
  plan.count.update++;
  assert.throws(() => assertBatch2Plan(plan, "initial"), /exact initial gate/);
});

test("F: one changed baseline hash creates one conflict and zero writes", async () => {
  const { baseline, bundle, documents } = batch2Fixture();
  const changedBaseline = structuredClone(baseline) as Record<
    string,
    { content: string; source: string }
  >;
  changedBaseline[batch2TargetSlugs[0]].content = "0".repeat(64);
  const repository = new MemoryRepository(documents);
  const plan = buildBatch2PlanForTest(
    repository.documents,
    bundle,
    changedBaseline,
  );
  assert.deepEqual(plan.count, {
    create: 0,
    update: 37,
    skip: 1,
    conflict: 1,
  });
  await assert.rejects(
    applyBatch2ForTest(bundle, repository, changedBaseline),
    /exact initial gate/,
  );
  assert.equal(repository.updateCalls, 0);
});

test("G: Production planner cannot auto-adopt runtime fingerprints", () => {
  const { bundle, documents } = batch2Fixture();
  const plan = buildBatch2Plan(documents, bundle);
  assert.deepEqual(plan.count, {
    create: 0,
    update: 0,
    skip: 1,
    conflict: 38,
  });
});

for (const [label, mutate] of [
  [
    "H: one manual edit",
    (document: ProductionImportDocument) => {
      document.history = "manual production edit";
    },
  ],
  [
    "I: one unmanaged target",
    (document: ProductionImportDocument) => {
      delete document.importProvenance;
    },
  ],
  [
    "I: one provenance fingerprint mismatch",
    (document: ProductionImportDocument) => {
      (document.importProvenance as Record<string, unknown>).fingerprint =
        "0".repeat(64);
    },
  ],
  [
    "J: one unpublished target",
    (document: ProductionImportDocument) => {
      document._status = "draft";
    },
  ],
] as const) {
  test(`${label} produces conflict and zero writes`, async () => {
    const { baseline, bundle, documents } = batch2Fixture();
    mutate(target(documents));
    const repository = new MemoryRepository(documents);
    const plan = buildBatch2PlanForTest(
      repository.documents,
      bundle,
      baseline,
    );
    assert.deepEqual(plan.count, {
      create: 0,
      update: 37,
      skip: 1,
      conflict: 1,
    });
    await assert.rejects(
      applyBatch2ForTest(bundle, repository, baseline),
      /exact initial gate/,
    );
    assert.equal(repository.updateCalls, 0);
  });
}

test("K: update 20 failure rolls back every persistent change", async () => {
  const { baseline, bundle, documents } = batch2Fixture();
  const repository = new MemoryRepository(documents);
  const before = structuredClone(repository.documents);
  repository.failOnUpdateCall = 20;
  await assert.rejects(
    applyBatch2ForTest(bundle, repository, baseline),
    /fixture Batch 2 write failure/,
  );
  assert.equal(repository.updateCalls, 20);
  assert.deepEqual(repository.documents, before);
});

test("J–L: success preserves publication/private fields and becomes 0/39", async () => {
  const { baseline, bundle, documents } = batch2Fixture();
  const repository = new MemoryRepository(documents);
  const before = structuredClone(repository.documents);
  const esenlerBefore = before.find(
    (document) => document.district === batch2ExcludedDistrict,
  )!;
  const plan = await applyBatch2ForTest(bundle, repository, baseline);
  assert.deepEqual(plan.count, {
    create: 0,
    update: 38,
    skip: 1,
    conflict: 0,
  });
  assert.equal(repository.updateCalls, 38);
  assert.deepEqual(
    repository.documents.find(
      (document) => document.district === batch2ExcludedDistrict,
    ),
    esenlerBefore,
  );
  for (const slug of batch2TargetSlugs) {
    const previous = before.find((document) => document.district === slug)!;
    const current = repository.documents.find(
      (document) => document.district === slug,
    )!;
    assert.notEqual(fingerprint(current), fingerprint(previous));
    assert.equal(current.id, previous.id);
    assert.equal(current.district, previous.district);
    assert.equal(current.createdAt, previous.createdAt);
    assert.equal(current.publishedAt, previous.publishedAt);
    assert.equal(current._status, "published");
    assert.equal(current.unrelatedField, previous.unrelatedField);
    assert.equal(
      (current.importProvenance as Record<string, unknown>).version,
      batch2ImportVersion,
    );
    const projection = projectPublishedDistrictGuide(current)!;
    assert.ok(projection);
    assert.equal(projection.marketData, null);
    assert.deepEqual(projection.planningDevelopments, []);
    assert.equal("researchNotes" in projection, false);
    assert.equal("importProvenance" in projection, false);
  }
  const secondPlan = await readBatch2PlanForTest(
    bundle,
    repository,
    "applied",
    baseline,
  );
  assert.deepEqual(secondPlan.count, {
    create: 0,
    update: 0,
    skip: 39,
    conflict: 0,
  });
  await assert.rejects(
    applyBatch2ForTest(bundle, repository, baseline),
    /exact initial gate/,
  );
  assert.equal(repository.updateCalls, 38);
});

test("published update owns only explicit fields and preserves identity metadata", () => {
  const { bundle, documents } = batch2Fixture();
  const row = bundle.districts.find(
    (district) => district.district === batch2TargetSlugs[0],
  )!;
  const existing = target(documents);
  const update = makePublishedEditorialUpdate(row, existing);
  assert.equal(update._status, "published");
  assert.equal(update.publishedAt, existing.publishedAt);
  for (const key of ["id", "district", "createdAt", "unrelatedField"]) {
    assert.equal(key in update, false, key);
  }
});
