import { spawnSync } from "node:child_process";

const TARGET_PREVIEW_BRANCH = "codex/project-day-17-production-infra";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const isTargetPreview =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === TARGET_PREVIEW_BRANCH;

const isProductionMain =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production" &&
  process.env.VERCEL_GIT_COMMIT_REF === "main";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function requireExactEnvironmentValue(variableName, expectedValue) {
  if (process.env[variableName] !== expectedValue) {
    fail(`${variableName} must be ${expectedValue} for the target Preview.`);
  }
}

function requireEnvironmentValue(variableName) {
  if (!process.env[variableName]?.trim()) {
    fail(`${variableName} is required for the target Preview.`);
  }
}

function runNpmScript(scriptName) {
  const result = spawnSync(npmCommand, ["run", scriptName], {
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    fail(`Unable to start npm run ${scriptName}.`);
  }

  if (result.signal) {
    fail(`npm run ${scriptName} terminated by a signal.`);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (isTargetPreview || isProductionMain) {
  requireExactEnvironmentValue("PAYLOAD_DATABASE", "postgres");
  requireExactEnvironmentValue("PAYLOAD_STORAGE", "vercel-blob");
  requireEnvironmentValue("DATABASE_URL");
  requireEnvironmentValue("PAYLOAD_SECRET");
  requireEnvironmentValue("BLOB_READ_WRITE_TOKEN");

  console.log("Running migrations for the designated Preview branch.");
  runNpmScript("payload:migrate");
  console.log("Migrations completed. Starting the application build.");
} else {
  console.log("Skipping migrations for this build context.");
}

runNpmScript("build");
