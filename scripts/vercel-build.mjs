import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import pg from "pg";

const TARGET_PREVIEW_BRANCHES = new Set([
  "codex/project-day-17-production-infra",
  "codex/project-day-19-photography",
]);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const requiredProductionApproval = "true";
const productionDatabaseFingerprint =
  "644954dc80bcc57f619b1d9bfd3502144a6d43a1cc005910aa993667da531ecd";
const migrationRegistryUrl = new URL(
  "../src/migrations/index.ts",
  import.meta.url,
);

const noPendingMessage = "No pending migrations; skipping migrate.";
const pendingMessage = "Pending migrations detected; approval required.";
const unverifiableMessage = "Migration state could not be verified; stopping.";

class BuildFailure extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

function fail(message, exitCode = 1) {
  throw new BuildFailure(message, exitCode);
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

function requireProductionApprovals(env) {
  if (
    env.PRODUCTION_MIGRATION_APPROVED !== requiredProductionApproval ||
    env.PRODUCTION_PITR_CONFIRMED !== requiredProductionApproval
  ) {
    fail(pendingMessage);
  }
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

function assertUniqueMigrationNames(names, { allowEmpty = false } = {}) {
  if (
    (!allowEmpty && names.length === 0) ||
    names.some((name) => !name.trim())
  ) {
    throw new Error("Invalid migration name list.");
  }
  if (new Set(names).size !== names.length) {
    throw new Error("Duplicate migration name.");
  }
}

export function compareMigrationState(registeredNames, appliedNames) {
  assertUniqueMigrationNames(registeredNames);
  assertUniqueMigrationNames(appliedNames, { allowEmpty: true });

  const registeredSet = new Set(registeredNames);
  if (appliedNames.some((name) => !registeredSet.has(name))) {
    throw new Error("Unexpected applied migration.");
  }

  const appliedSet = new Set(appliedNames);
  let pendingFound = false;
  const pendingMigrationNames = [];
  for (const name of registeredNames) {
    if (!appliedSet.has(name)) {
      pendingFound = true;
      pendingMigrationNames.push(name);
    } else if (pendingFound) {
      throw new Error("Applied migrations are not a registry prefix.");
    }
  }

  return { pendingMigrationNames };
}

async function readRegisteredMigrationNames() {
  const source = await readFile(migrationRegistryUrl, "utf8");
  const names = [
    ...source.matchAll(/\bname:\s*["']([0-9]{8}_[a-z0-9_]+)["']/gi),
  ].map((match) => match[1]);
  assertUniqueMigrationNames(names);
  return names;
}

function describeProductionDatabase(connectionString) {
  const url = new URL(connectionString);
  if (!new Set(["postgres:", "postgresql:"]).has(url.protocol)) {
    throw new Error("Production database is not PostgreSQL.");
  }
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!url.hostname || !databaseName) {
    throw new Error("Production database identity is incomplete.");
  }
  const identity = `${url.hostname}:${url.port || "5432"}/${databaseName}`;
  const fingerprint = createHash("sha256").update(identity).digest("hex");
  if (fingerprint !== productionDatabaseFingerprint) {
    throw new Error("Production database identity does not match.");
  }
  return { databaseName };
}

export async function readProductionMigrationState(env) {
  const registeredNames = await readRegisteredMigrationNames();
  const { databaseName } = describeProductionDatabase(env.DATABASE_URL);
  const client = new pg.Client({ connectionString: env.DATABASE_URL });

  await client.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    const connectedDatabase = (
      await client.query("select current_database() as name")
    ).rows[0]?.name;
    if (connectedDatabase !== databaseName) {
      throw new Error("Connected database identity does not match.");
    }

    const migrationTable = (
      await client.query(
        "select to_regclass('public.payload_migrations')::text as name",
      )
    ).rows[0]?.name;
    if (migrationTable !== "payload_migrations") {
      throw new Error("Migration table is unavailable.");
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
    await client.end();
  }
}

export async function runBuild(options = {}) {
  const env = options.env ?? process.env;
  const log = options.log ?? console.log;
  const detectMigrationState =
    options.detectMigrationState ?? readProductionMigrationState;
  const runScript =
    options.runNpmScript ?? ((scriptName) => runNpmScript(scriptName, env));

  const isTargetPreview =
    env.VERCEL === "1" &&
    env.VERCEL_ENV === "preview" &&
    TARGET_PREVIEW_BRANCHES.has(env.VERCEL_GIT_COMMIT_REF);

  const isProductionMain =
    env.VERCEL === "1" &&
    env.VERCEL_ENV === "production" &&
    env.VERCEL_GIT_COMMIT_REF === "main";

  if (isProductionMain) {
    requireMigrationInfrastructure(env);
    let migrationState;
    try {
      migrationState = await detectMigrationState(env);
    } catch {
      fail(unverifiableMessage);
    }

    if (migrationState.pendingMigrationNames.length === 0) {
      log(noPendingMessage);
    } else {
      requireProductionApprovals(env);
      log(pendingMessage);
      runScript("payload:migrate");
      log("Migrations completed. Starting the application build.");
    }
  } else if (isTargetPreview) {
    requireMigrationInfrastructure(env);
    log("Running migrations for the designated Preview branch.");
    runScript("payload:migrate");
    log("Migrations completed. Starting the application build.");
  } else {
    log("Skipping migrations for this build context.");
  }

  runScript("build");
}

const isDirectExecution =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  runBuild().catch((error) => {
    console.error(
      error instanceof BuildFailure ? error.message : unverifiableMessage,
    );
    process.exitCode = error instanceof BuildFailure ? error.exitCode : 1;
  });
}
