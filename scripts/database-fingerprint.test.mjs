import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { databaseIdentity } from "./vercel-build.mjs";

const script = fileURLToPath(
  new URL("./database-fingerprint.mjs", import.meta.url),
);

function run(databaseUrl) {
  const env = { ...process.env };
  delete env.DATABASE_URL;
  if (databaseUrl !== undefined) env.DATABASE_URL = databaseUrl;
  return spawnSync(process.execPath, [script], { encoding: "utf8", env });
}

test("prints only the fingerprint, never the URL, host or credentials", () => {
  const url = "postgresql://owner:s3cret-pass@ep-example.invalid:5432/appdb";
  const result = run(url);
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), {
    fingerprint: databaseIdentity(url).fingerprint,
    matchesCommittedProductionFingerprint: false,
  });
  for (const fragment of ["s3cret-pass", "owner", "ep-example", "appdb"]) {
    assert.ok(!`${result.stdout}${result.stderr}`.includes(fragment));
  }
});

test("fails without DATABASE_URL or with a non-PostgreSQL URL", () => {
  const missing = run(undefined);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Set DATABASE_URL/);

  const sqlite = run("file:./.data/secret-name.db");
  assert.equal(sqlite.status, 1);
  assert.match(sqlite.stderr, /\(database_url_invalid\)/);
  assert.ok(!sqlite.stderr.includes("secret-name"));
});
