import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

// TESTS-INFRA-7: mappers, repositories and tests compile against the
// committed src/payload-types.ts. If a collection changes and the types are
// not regenerated, `npm run typecheck` still passes against stale types. The
// generator runs offline here (SQLite in a temporary directory, local media,
// no secret) and writes to a temporary file through Payload's own
// PAYLOAD_TS_OUTPUT_PATH override, so the committed file is never touched.
const committed = "src/payload-types.ts";

function generateTypes(outputFile: string, databaseFile: string) {
  return spawnSync(
    path.resolve("node_modules/.bin/payload"),
    ["generate:types"],
    {
      encoding: "utf8",
      timeout: 120_000,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        PAYLOAD_DATABASE: "sqlite",
        PAYLOAD_STORAGE: "local",
        DATABASE_URL: `file:${databaseFile}`,
        PAYLOAD_SECRET: "types-test-only-secret",
        PAYLOAD_TS_OUTPUT_PATH: outputFile,
      },
    },
  );
}

test("TESTS-INFRA-7: src/payload-types.ts matches the Payload config", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "payload-types-"));
  try {
    const output = path.join(directory, "payload-types.ts");
    const result = generateTypes(output, path.join(directory, "types.db"));
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(
      readFileSync(output, "utf8") === readFileSync(committed, "utf8"),
      `${committed} is stale: run \`npm run generate:types\` and commit the result`,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
