// Vercel build gate (`npm run vercel:build`). It protects the Production
// database: every change must make it stricter, never looser. The approval
// procedure and the failure reasons are documented in docs/PROJECT-STATE.md §K.
//
// - Production (VERCEL_ENV=production) builds only from `main`, on Vercel,
//   for a full commit SHA; anything else stops before reading the database.
// - Pending migrations run only with an approval bound to this commit SHA,
//   to the exact ordered list of pending migration names and to a PITR
//   confirmation for the same commit. The state is re-read after migrating.
// - Every other context never migrates and refuses to build against the
//   Production database.
// - Failure messages name a category (and a standard error code) but never a
//   connection string, host, user, password or driver message.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import pg from "pg";

export const productionBranch = "main";

/**
 * sha256 of `host:port/database` of the Production Neon database. It is a
 * reviewed constant on purpose: after a point-in-time restore onto a new
 * endpoint, compute the new value with `scripts/database-fingerprint.mjs` and
 * change it in a reviewed commit (docs/PROJECT-STATE.md §K).
 */
export const productionDatabaseFingerprint =
  "644954dc80bcc57f619b1d9bfd3502144a6d43a1cc005910aa993667da531ecd";

/** Environment variables of the SHA-bound Production migration approval. */
export const migrationApprovalVariables = Object.freeze({
  approvedSha: "PRODUCTION_MIGRATION_APPROVED_SHA",
  approvedNames: "PRODUCTION_MIGRATION_APPROVED_NAMES",
  pitrConfirmedSha: "PRODUCTION_MIGRATION_PITR_CONFIRMED_SHA",
});

// Boolean approvals of the previous gate. They never approve a migration any
// more; `PRODUCTION_PITR_CONFIRMED` was also shared with the import scripts.
const legacyApprovalVariables = [
  "PRODUCTION_MIGRATION_APPROVED",
  "PRODUCTION_PITR_CONFIRMED",
];

// The build-time dry-run of the original district importer, retired together
// with the applied importers in scripts/districts/archive/.
const retiredDryRunVariable = "PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const commitShaPattern = /^[0-9a-f]{40}$/;
const migrationNamePattern = /^[0-9]{8}_[a-z0-9_]+$/i;
const migrationRegistryUrl = new URL(
  "../src/migrations/index.ts",
  import.meta.url,
);

const noPendingMessage = "No pending migrations; skipping migrate.";
const pendingMessage = "Pending migrations detected; approval required.";
const unverifiableMessage = "Migration state could not be verified";

class BuildFailure extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

function fail(message, exitCode = 1) {
  throw new BuildFailure(message, exitCode);
}

/** A migration state failure with a secret-free category. */
export class MigrationStateError extends Error {
  constructor(category, message) {
    super(message);
    this.name = "MigrationStateError";
    this.category = category;
  }
}

const connectionErrorCodes = new Set([
  "EAI_AGAIN",
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "EPIPE",
  "ETIMEDOUT",
]);

/**
 * Maps any error of the migration state check to a category and, when it is a
 * standard identifier (PostgreSQL SQLSTATE or a Node.js/TLS error code), that
 * code. Messages are never returned: driver messages can contain the host or
 * the database user.
 */
export function classifyMigrationStateError(error) {
  if (error instanceof MigrationStateError) {
    return { category: error.category };
  }
  const rawCode =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  const isSqlState = /^[0-9A-Z]{5}$/.test(rawCode);
  const isSystemCode = /^[A-Z][A-Z0-9_]{2,63}$/.test(rawCode);
  const code = isSqlState || isSystemCode ? rawCode : undefined;
  const message = error instanceof Error ? error.message : "";

  if (rawCode === "28P01" || rawCode === "28000") {
    return { category: "authentication_failed", code };
  }
  if (rawCode === "3D000") return { category: "database_not_found", code };
  if (connectionErrorCodes.has(rawCode)) {
    return { category: "connection_failed", code };
  }
  if (/CERT|TLS|SSL/.test(rawCode)) return { category: "tls_failed", code };
  if (isSqlState) return { category: "query_failed", code };
  // node-postgres reports a dropped or timed-out connection without a code.
  if (
    /connection terminated|connection timeout|timeout expired/i.test(message)
  ) {
    return { category: "connection_failed", code };
  }
  return { category: "unknown_failed", code };
}

function describeFailureCategory(error) {
  const { category, code } = classifyMigrationStateError(error);
  return code ? `${category}, ${code}` : category;
}

function requireExactEnvironmentValue(env, variableName, expectedValue) {
  if (env[variableName] !== expectedValue) {
    fail(`${variableName} must be ${expectedValue} for this migration target.`);
  }
}

function requireEnvironmentValue(env, variableName) {
  if (!env[variableName]?.trim()) {
    fail(`${variableName} is required for this migration target.`);
  }
}

function requireMigrationInfrastructure(env) {
  requireExactEnvironmentValue(env, "PAYLOAD_DATABASE", "postgres");
  requireExactEnvironmentValue(env, "PAYLOAD_STORAGE", "vercel-blob");
  requireEnvironmentValue(env, "DATABASE_URL");
  requireEnvironmentValue(env, "PAYLOAD_SECRET");
  requireEnvironmentValue(env, "BLOB_READ_WRITE_TOKEN");
}

function runNpmScript(scriptName, env) {
  const result = spawnSync(npmCommand, ["run", scriptName], {
    env,
    stdio: "inherit",
  });

  if (result.error) {
    fail(`Unable to start npm run ${scriptName}.`);
  }

  if (result.signal) {
    fail(`npm run ${scriptName} terminated by a signal.`);
  }

  if (result.status !== 0) {
    fail(`npm run ${scriptName} failed.`, result.status ?? 1);
  }
}

function assertUniqueMigrationNames(
  names,
  { allowEmpty = false, category = "migration_registry_invalid" } = {},
) {
  if (
    (!allowEmpty && names.length === 0) ||
    names.some((name) => typeof name !== "string" || !name.trim())
  ) {
    throw new MigrationStateError(category, "Invalid migration name list.");
  }
  if (new Set(names).size !== names.length) {
    throw new MigrationStateError(category, "Duplicate migration name.");
  }
}

export function compareMigrationState(registeredNames, appliedNames) {
  assertUniqueMigrationNames(registeredNames);
  assertUniqueMigrationNames(appliedNames, {
    allowEmpty: true,
    category: "migration_state_inconsistent",
  });

  const registeredSet = new Set(registeredNames);
  if (appliedNames.some((name) => !registeredSet.has(name))) {
    throw new MigrationStateError(
      "migration_state_inconsistent",
      "Unexpected applied migration.",
    );
  }

  const appliedSet = new Set(appliedNames);
  let pendingFound = false;
  const pendingMigrationNames = [];
  for (const name of registeredNames) {
    if (!appliedSet.has(name)) {
      pendingFound = true;
      pendingMigrationNames.push(name);
    } else if (pendingFound) {
      throw new MigrationStateError(
        "migration_state_inconsistent",
        "Applied migrations are not a registry prefix.",
      );
    }
  }

  return { pendingMigrationNames };
}

async function readRegisteredMigrationNames() {
  let source;
  try {
    source = await readFile(migrationRegistryUrl, "utf8");
  } catch {
    throw new MigrationStateError(
      "migration_registry_invalid",
      "Migration registry could not be read.",
    );
  }
  const names = [
    ...source.matchAll(/\bname:\s*["']([0-9]{8}_[a-z0-9_]+)["']/gi),
  ].map((match) => match[1]);
  assertUniqueMigrationNames(names);
  return names;
}

/**
 * Identity of a PostgreSQL connection string: the database name and the
 * sha256 fingerprint of `host:port/database`. User and password never enter
 * the fingerprint, and nothing here is logged.
 */
export function databaseIdentity(connectionString) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new MigrationStateError(
      "database_url_invalid",
      "Production database URL is invalid.",
    );
  }
  if (!new Set(["postgres:", "postgresql:"]).has(url.protocol)) {
    throw new MigrationStateError(
      "database_url_invalid",
      "Production database is not PostgreSQL.",
    );
  }
  let databaseName;
  try {
    databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  } catch {
    throw new MigrationStateError(
      "database_url_invalid",
      "Production database URL is invalid.",
    );
  }
  if (!url.hostname || !databaseName) {
    throw new MigrationStateError(
      "database_identity_incomplete",
      "Production database identity is incomplete.",
    );
  }
  const identity = `${url.hostname}:${url.port || "5432"}/${databaseName}`;
  return {
    databaseName,
    fingerprint: createHash("sha256").update(identity).digest("hex"),
  };
}

export function describeProductionDatabase(
  connectionString,
  expectedFingerprint = productionDatabaseFingerprint,
) {
  const { databaseName, fingerprint } = databaseIdentity(connectionString);
  if (fingerprint !== expectedFingerprint) {
    throw new MigrationStateError(
      "database_identity_mismatch",
      "Production database identity does not match.",
    );
  }
  return { databaseName };
}

/**
 * Reads the applied migrations inside a read-only transaction. `options` is
 * for tests: `createClient(connectionString)`, `readRegisteredNames()` and
 * `expectedFingerprint`.
 */
export async function readProductionMigrationState(env, options = {}) {
  const registeredNames = await (
    options.readRegisteredNames ?? readRegisteredMigrationNames
  )();
  const { databaseName } = describeProductionDatabase(
    env.DATABASE_URL,
    options.expectedFingerprint,
  );
  const createClient =
    options.createClient ??
    ((connectionString) => new pg.Client({ connectionString }));
  const client = createClient(env.DATABASE_URL);

  await client.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    const connectedDatabase = (
      await client.query("select current_database() as name")
    ).rows[0]?.name;
    if (connectedDatabase !== databaseName) {
      throw new MigrationStateError(
        "connected_database_mismatch",
        "Connected database identity does not match.",
      );
    }

    const migrationTable = (
      await client.query(
        "select to_regclass('public.payload_migrations')::text as name",
      )
    ).rows[0]?.name;
    if (migrationTable !== "payload_migrations") {
      throw new MigrationStateError(
        "migration_table_missing",
        "Migration table is unavailable.",
      );
    }

    const appliedNames = (
      await client.query("select name from payload_migrations order by id")
    ).rows.map((row) => row.name);
    const result = compareMigrationState(registeredNames, appliedNames);
    await client.query("ROLLBACK");
    return {
      appliedCount: appliedNames.length,
      registeredCount: registeredNames.length,
      ...result,
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function describeRef(ref) {
  return ref ? JSON.stringify(ref.slice(0, 120)) : "missing";
}

function assertProductionDeployment(env) {
  if (env.VERCEL !== "1") {
    fail(
      "VERCEL_ENV=production outside a Vercel build (VERCEL is not 1); stopping before any migration or build.",
    );
  }
  if (env.VERCEL_GIT_COMMIT_REF !== productionBranch) {
    fail(
      `Production builds only run from ${productionBranch}; this deployment's Git ref is ${describeRef(env.VERCEL_GIT_COMMIT_REF)}. Stopping before any migration or build.`,
    );
  }
  if (!commitShaPattern.test(env.VERCEL_GIT_COMMIT_SHA ?? "")) {
    fail(
      "VERCEL_GIT_COMMIT_SHA must be the full 40-character commit SHA of this Production deployment.",
    );
  }
}

function parseMigrationNameList(value) {
  return (value ?? "").split(/[\s,]+/).filter(Boolean);
}

function sameNames(left, right) {
  return (
    left.length === right.length &&
    left.every((name, index) => name === right[index])
  );
}

function requireMigrationApproval(env, pendingNames) {
  const commitSha = env.VERCEL_GIT_COMMIT_SHA;
  const problems = [];
  for (const [variableName, label] of [
    [migrationApprovalVariables.approvedSha, "migration approval"],
    [migrationApprovalVariables.pitrConfirmedSha, "PITR confirmation"],
  ]) {
    const value = env[variableName];
    if (!value?.trim()) {
      problems.push(`${variableName} (${label}) is missing`);
    } else if (value !== commitSha) {
      problems.push(
        `${variableName} (${label}) does not match this commit ${commitSha}`,
      );
    }
  }
  const approvedNames = parseMigrationNameList(
    env[migrationApprovalVariables.approvedNames],
  );
  if (approvedNames.length === 0) {
    problems.push(`${migrationApprovalVariables.approvedNames} is missing`);
  } else if (!sameNames(approvedNames, pendingNames)) {
    // Echo the approved list only when it holds migration names, so a value
    // pasted into the wrong variable never reaches the build log.
    const approved = approvedNames.every((name) =>
      migrationNamePattern.test(name),
    )
      ? `approved: ${approvedNames.join(", ")}`
      : "it contains values that are not migration names";
    problems.push(
      `${migrationApprovalVariables.approvedNames} does not list exactly the pending migrations in order (${approved})`,
    );
  }
  if (problems.length > 0) {
    fail(
      `${pendingMessage} ${problems.join("; ")}. Pending: ${pendingNames.join(", ")}.`,
    );
  }
}

async function readMigrationStateOrFail(detectMigrationState, env, stage) {
  try {
    return await detectMigrationState(env);
  } catch (error) {
    fail(
      `${unverifiableMessage}${stage} (${describeFailureCategory(error)}); stopping.`,
    );
  }
}

async function runProductionMigrationGate(
  env,
  { detectMigrationState, log, runScript },
) {
  if (env[retiredDryRunVariable]?.trim()) {
    fail(
      `${retiredDryRunVariable} is set, but the build-time district dry-run was retired with the archived importers (scripts/districts/archive/). Remove the variable from the Production environment; nothing was read or migrated.`,
    );
  }
  requireMigrationInfrastructure(env);

  const legacy = legacyApprovalVariables.filter((name) => env[name]);
  if (legacy.length > 0) {
    log(
      `Ignoring ${legacy.join(" and ")}: Production migrations need the SHA-bound approval (docs/PROJECT-STATE.md §K). Remove the legacy variable.`,
    );
  }

  const state = await readMigrationStateOrFail(detectMigrationState, env, "");
  const pendingNames = state.pendingMigrationNames;
  if (pendingNames.length === 0) {
    log(noPendingMessage);
    if (Object.values(migrationApprovalVariables).some((name) => env[name])) {
      log(
        "Production migration approval variables are set but nothing is pending; remove them.",
      );
    }
    return;
  }

  requireMigrationApproval(env, pendingNames);
  log(
    `Applying ${pendingNames.length} approved migration(s) for commit ${env.VERCEL_GIT_COMMIT_SHA}: ${pendingNames.join(", ")}.`,
  );
  runScript("payload:migrate");

  const after = await readMigrationStateOrFail(
    detectMigrationState,
    env,
    " after migrate",
  );
  if (after.pendingMigrationNames.length !== 0) {
    fail(
      `Migrations did not reach the registry head; still pending: ${after.pendingMigrationNames.join(", ")}. Stopping before the build.`,
    );
  }
  log("Migrations completed and verified. Starting the application build.");
}

function refuseProductionDatabase(env, expectedFingerprint) {
  if (!env.DATABASE_URL) return;
  let identity;
  try {
    identity = databaseIdentity(env.DATABASE_URL);
  } catch {
    // Not a complete PostgreSQL URL, so it cannot be the Production database.
    return;
  }
  if (identity.fingerprint === expectedFingerprint) {
    fail(
      "DATABASE_URL of this non-Production build points at the Production database; refusing to build. Preview and local builds need their own database.",
    );
  }
}

/**
 * `options` exists for tests: env, log, runNpmScript, detectMigrationState and
 * productionDatabaseFingerprint. The direct execution passes none of them.
 */
export async function runBuild(options = {}) {
  const env = options.env ?? process.env;
  const log = options.log ?? console.log;
  const detectMigrationState =
    options.detectMigrationState ??
    ((buildEnv) => readProductionMigrationState(buildEnv));
  const runScript =
    options.runNpmScript ?? ((scriptName) => runNpmScript(scriptName, env));
  const expectedFingerprint =
    options.productionDatabaseFingerprint ?? productionDatabaseFingerprint;

  if (env.VERCEL_ENV === "production") {
    assertProductionDeployment(env);
    await runProductionMigrationGate(env, {
      detectMigrationState,
      log,
      runScript,
    });
  } else {
    refuseProductionDatabase(env, expectedFingerprint);
    log("Skipping migrations for this build context.");
  }

  runScript("build");
}

const isDirectExecution =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  runBuild().catch((error) => {
    if (error instanceof BuildFailure) {
      console.error(error.message);
      process.exitCode = error.exitCode;
      return;
    }
    console.error(
      `Build gate stopped on an unexpected error (${describeFailureCategory(error)}); details are not printed to keep secrets out of the log.`,
    );
    process.exitCode = 1;
  });
}
