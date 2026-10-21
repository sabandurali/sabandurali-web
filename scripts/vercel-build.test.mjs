import assert from "node:assert/strict";
import test from "node:test";
import { compareMigrationState, runBuild } from "./vercel-build.mjs";

const productionEnvironment = {
  BLOB_READ_WRITE_TOKEN: "test-blob-token",
  DATABASE_URL: "postgresql://test:test@example.invalid:5432/neondb",
  PAYLOAD_DATABASE: "postgres",
  PAYLOAD_SECRET: "test-payload-secret",
  PAYLOAD_STORAGE: "vercel-blob",
  VERCEL: "1",
  VERCEL_ENV: "production",
  VERCEL_GIT_COMMIT_REF: "main",
};

function createHarness({ env, pendingMigrationNames, unreadable = false }) {
  const calls = [];
  const logs = [];
  return {
    calls,
    logs,
    options: {
      detectMigrationState: async () => {
        if (unreadable) throw new Error("unreadable");
        return { pendingMigrationNames };
      },
      env,
      log: (message) => logs.push(message),
      runNpmScript: (scriptName) => calls.push(scriptName),
    },
  };
}

test("A: Production main without pending migrations builds without approvals", async () => {
  const harness = createHarness({
    env: productionEnvironment,
    pendingMigrationNames: [],
  });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["build"]);
  assert.match(harness.logs.join("\n"), /No pending migrations/);
});

test("B: Production approvals do not run migrate when nothing is pending", async () => {
  const harness = createHarness({
    env: {
      ...productionEnvironment,
      PRODUCTION_MIGRATION_APPROVED: "true",
      PRODUCTION_PITR_CONFIRMED: "true",
    },
    pendingMigrationNames: [],
  });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["build"]);
});

for (const [name, approvals] of [
  ["C: no approvals", {}],
  ["D: only migration approval", { PRODUCTION_MIGRATION_APPROVED: "true" }],
  ["E: only PITR approval", { PRODUCTION_PITR_CONFIRMED: "true" }],
]) {
  test(`${name} stops when a Production migration is pending`, async () => {
    const harness = createHarness({
      env: { ...productionEnvironment, ...approvals },
      pendingMigrationNames: ["20260914_000000_pending"],
    });
    await assert.rejects(
      runBuild(harness.options),
      /Pending migrations detected; approval required/,
    );
    assert.deepEqual(harness.calls, []);
  });
}

test("F: both approvals allow migrate before build when pending", async () => {
  const harness = createHarness({
    env: {
      ...productionEnvironment,
      PRODUCTION_MIGRATION_APPROVED: "true",
      PRODUCTION_PITR_CONFIRMED: "true",
    },
    pendingMigrationNames: ["20260914_000000_pending"],
  });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["payload:migrate", "build"]);
});

test("G: an unreadable migration state stops before migrate and build", async () => {
  const harness = createHarness({
    env: productionEnvironment,
    pendingMigrationNames: [],
    unreadable: true,
  });
  await assert.rejects(
    runBuild(harness.options),
    /Migration state could not be verified; stopping/,
  );
  assert.deepEqual(harness.calls, []);
});

test("SHA-approved Production dry-run runs read-only script and stops before deployment", async () => {
  const sha = "a".repeat(40);
  const harness = createHarness({
    env: {
      ...productionEnvironment,
      PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA: sha,
      VERCEL_GIT_COMMIT_SHA: sha,
    },
    pendingMigrationNames: [],
  });
  await assert.rejects(
    runBuild(harness.options),
    /dry-run completed; stopping before deployment/,
  );
  assert.deepEqual(harness.calls, ["district:import:production:dry-run"]);
});

test("Production dry-run rejects stale commit approval before any script", async () => {
  const harness = createHarness({
    env: {
      ...productionEnvironment,
      PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA: "a".repeat(40),
      VERCEL_GIT_COMMIT_SHA: "b".repeat(40),
    },
    pendingMigrationNames: [],
  });
  await assert.rejects(runBuild(harness.options), /does not match this commit/);
  assert.deepEqual(harness.calls, []);
});

test("Production dry-run never migrates when a migration is pending", async () => {
  const sha = "a".repeat(40);
  const harness = createHarness({
    env: {
      ...productionEnvironment,
      PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA: sha,
      PRODUCTION_MIGRATION_APPROVED: "true",
      PRODUCTION_PITR_CONFIRMED: "true",
      VERCEL_GIT_COMMIT_SHA: sha,
    },
    pendingMigrationNames: ["20260914_000000_pending"],
  });
  await assert.rejects(runBuild(harness.options), /zero pending migrations/);
  assert.deepEqual(harness.calls, []);
});

test("H: designated Preview keeps migrate then build behavior", async () => {
  const harness = createHarness({
    env: {
      ...productionEnvironment,
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "codex/project-day-17-production-infra",
    },
    pendingMigrationNames: [],
  });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["payload:migrate", "build"]);
});

test("I: normal Preview skips migrate and builds", async () => {
  const harness = createHarness({
    env: {
      VERCEL: "1",
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "codex/ordinary-preview",
    },
    pendingMigrationNames: [],
  });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["build"]);
});

test("J: local execution skips migrate and builds", async () => {
  const harness = createHarness({ env: {}, pendingMigrationNames: [] });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["build"]);
});

test("migration comparison fails closed for duplicate and unknown state", () => {
  assert.deepEqual(compareMigrationState(["one", "two"], []), {
    pendingMigrationNames: ["one", "two"],
  });
  assert.throws(
    () => compareMigrationState(["one", "one"], []),
    /Duplicate migration name/,
  );
  assert.throws(
    () => compareMigrationState(["one"], ["one", "one"]),
    /Duplicate migration name/,
  );
  assert.throws(
    () => compareMigrationState(["one"], ["unknown"]),
    /Unexpected applied migration/,
  );
  assert.throws(
    () => compareMigrationState(["one", "two"], ["two"]),
    /not a registry prefix/,
  );
});
