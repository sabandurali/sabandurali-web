import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyMigrationStateError,
  compareMigrationState,
  databaseIdentity,
  describeProductionDatabase,
  MigrationStateError,
  productionDatabaseFingerprint,
  readProductionMigrationState,
  runBuild,
} from "./vercel-build.mjs";

const sha = "a".repeat(40);
const otherSha = "b".repeat(40);
const pending = ["20261101_000000_first", "20261102_000000_second"];
const productionUrl =
  "postgresql://user:secret-password@db.example.invalid:5432/neondb";

const productionEnvironment = {
  BLOB_READ_WRITE_TOKEN: "test-blob-token",
  DATABASE_URL: productionUrl,
  PAYLOAD_DATABASE: "postgres",
  PAYLOAD_SECRET: "test-payload-secret",
  PAYLOAD_STORAGE: "vercel-blob",
  VERCEL: "1",
  VERCEL_ENV: "production",
  VERCEL_GIT_COMMIT_REF: "main",
  VERCEL_GIT_COMMIT_SHA: sha,
};

const approval = {
  PRODUCTION_MIGRATION_APPROVED_SHA: sha,
  PRODUCTION_MIGRATION_APPROVED_NAMES: pending.join(","),
  PRODUCTION_MIGRATION_PITR_CONFIRMED_SHA: sha,
};

/**
 * `states` are returned by successive migration state reads (before and after
 * migrate); an Error entry is thrown instead.
 */
function createHarness({ env, states = [[]], fingerprint }) {
  const calls = [];
  const logs = [];
  const remaining = [...states];
  const harness = {
    calls,
    logs,
    detections: 0,
    options: {
      detectMigrationState: async () => {
        harness.detections += 1;
        const next = remaining.shift();
        if (next instanceof Error) throw next;
        if (!Array.isArray(next)) throw new Error("unexpected extra read");
        return { pendingMigrationNames: next };
      },
      env,
      log: (message) => logs.push(message),
      runNpmScript: (scriptName) => calls.push(scriptName),
      ...(fingerprint ? { productionDatabaseFingerprint: fingerprint } : {}),
    },
  };
  return harness;
}

test("A: Production main without pending migrations builds without approvals", async () => {
  const harness = createHarness({ env: productionEnvironment });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["build"]);
  assert.equal(harness.detections, 1);
  assert.match(harness.logs.join("\n"), /No pending migrations/);
});

test("B: an approval for this commit never migrates when nothing is pending", async () => {
  const harness = createHarness({
    env: { ...productionEnvironment, ...approval },
  });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["build"]);
  assert.match(harness.logs.join("\n"), /nothing is pending; remove them/);
});

for (const [name, extra, reasons] of [
  [
    "C: no approval",
    {},
    [
      /PRODUCTION_MIGRATION_APPROVED_SHA \(migration approval\) is missing/,
      /PRODUCTION_MIGRATION_PITR_CONFIRMED_SHA \(PITR confirmation\) is missing/,
      /PRODUCTION_MIGRATION_APPROVED_NAMES is missing/,
    ],
  ],
  [
    "D: only the migration approval",
    { PRODUCTION_MIGRATION_APPROVED_SHA: sha },
    [/PITR confirmation\) is missing/, /APPROVED_NAMES is missing/],
  ],
  [
    "E: only the PITR confirmation",
    { PRODUCTION_MIGRATION_PITR_CONFIRMED_SHA: sha },
    [/migration approval\) is missing/, /APPROVED_NAMES is missing/],
  ],
  [
    "legacy boolean approvals",
    {
      PRODUCTION_MIGRATION_APPROVED: "true",
      PRODUCTION_PITR_CONFIRMED: "true",
    },
    [/migration approval\) is missing/, /PITR confirmation\) is missing/],
  ],
  [
    "a migration approval for an earlier commit",
    { ...approval, PRODUCTION_MIGRATION_APPROVED_SHA: otherSha },
    [/APPROVED_SHA \(migration approval\) does not match this commit a{40}/],
  ],
  [
    "a PITR confirmation for an earlier commit",
    { ...approval, PRODUCTION_MIGRATION_PITR_CONFIRMED_SHA: otherSha },
    [/PITR_CONFIRMED_SHA \(PITR confirmation\) does not match this commit/],
  ],
  [
    "a boolean PITR confirmation",
    { ...approval, PRODUCTION_MIGRATION_PITR_CONFIRMED_SHA: "true" },
    [/PITR confirmation\) does not match this commit/],
  ],
  [
    "an approval with trailing whitespace",
    { ...approval, PRODUCTION_MIGRATION_APPROVED_SHA: `${sha}\n` },
    [/migration approval\) does not match this commit/],
  ],
  [
    "approved names missing a pending migration",
    { ...approval, PRODUCTION_MIGRATION_APPROVED_NAMES: pending[0] },
    [/does not list exactly the pending migrations in order/],
  ],
  [
    "approved names in another order",
    {
      ...approval,
      PRODUCTION_MIGRATION_APPROVED_NAMES: [...pending].reverse().join(","),
    },
    [/approved: 20261102_000000_second, 20261101_000000_first/],
  ],
  [
    "approved names with an extra migration",
    {
      ...approval,
      PRODUCTION_MIGRATION_APPROVED_NAMES: `${pending.join(",")},20261103_000000_third`,
    },
    [/does not list exactly the pending migrations in order/],
  ],
]) {
  test(`${name} stops before migrate when migrations are pending`, async () => {
    const harness = createHarness({
      env: { ...productionEnvironment, ...extra },
      states: [pending],
    });
    const error = await runBuild(harness.options).then(
      () => assert.fail("build must stop"),
      (rejection) => rejection,
    );
    assert.match(
      error.message,
      /^Pending migrations detected; approval required\./,
    );
    assert.match(
      error.message,
      /Pending: 20261101_000000_first, 20261102_000000_second\.$/,
    );
    for (const reason of reasons) assert.match(error.message, reason);
    assert.deepEqual(harness.calls, []);
    assert.equal(harness.detections, 1);
  });
}

test("legacy boolean approvals are reported as ignored", async () => {
  const harness = createHarness({
    env: {
      ...productionEnvironment,
      PRODUCTION_MIGRATION_APPROVED: "true",
      PRODUCTION_PITR_CONFIRMED: "true",
    },
  });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["build"]);
  assert.match(
    harness.logs.join("\n"),
    /Ignoring PRODUCTION_MIGRATION_APPROVED and PRODUCTION_PITR_CONFIRMED/,
  );
});

test("a value that is not a migration name never reaches the log", async () => {
  const harness = createHarness({
    env: {
      ...productionEnvironment,
      ...approval,
      PRODUCTION_MIGRATION_APPROVED_NAMES: "postgresql://user:hunter2@host/db",
    },
    states: [pending],
  });
  await assert.rejects(runBuild(harness.options), (error) => {
    assert.match(error.message, /contains values that are not migration names/);
    assert.doesNotMatch(error.message, /hunter2/);
    return true;
  });
});

test("F: the SHA-bound approval migrates, re-verifies the state and builds", async () => {
  const harness = createHarness({
    env: {
      ...productionEnvironment,
      ...approval,
      PRODUCTION_MIGRATION_APPROVED_NAMES: ` ${pending.join(",\n ")} `,
    },
    states: [pending, []],
  });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["payload:migrate", "build"]);
  assert.equal(harness.detections, 2);
  const log = harness.logs.join("\n");
  assert.match(log, new RegExp(`for commit ${sha}: ${pending.join(", ")}`));
  assert.match(log, /Migrations completed and verified/);
});

test("a migration that leaves pending migrations stops before the build", async () => {
  const harness = createHarness({
    env: { ...productionEnvironment, ...approval },
    states: [pending, [pending[1]]],
  });
  await assert.rejects(
    runBuild(harness.options),
    /did not reach the registry head; still pending: 20261102_000000_second/,
  );
  assert.deepEqual(harness.calls, ["payload:migrate"]);
});

test("an unreadable state after migrate stops before the build", async () => {
  const harness = createHarness({
    env: { ...productionEnvironment, ...approval },
    states: [pending, Object.assign(new Error("boom"), { code: "ECONNRESET" })],
  });
  await assert.rejects(
    runBuild(harness.options),
    /^Error: Migration state could not be verified after migrate \(connection_failed, ECONNRESET\); stopping\.$/,
  );
  assert.deepEqual(harness.calls, ["payload:migrate"]);
});

test("G: an unreadable migration state stops before migrate and build", async () => {
  const harness = createHarness({
    env: productionEnvironment,
    states: [new Error("unreadable")],
  });
  await assert.rejects(
    runBuild(harness.options),
    /Migration state could not be verified \(unknown_failed\); stopping/,
  );
  assert.deepEqual(harness.calls, []);
});

for (const [name, error, expected, hidden] of [
  [
    "authentication",
    Object.assign(
      new Error('password authentication failed for user "neondb_owner"'),
      { code: "28P01" },
    ),
    "(authentication_failed, 28P01)",
    "neondb_owner",
  ],
  [
    "connection",
    Object.assign(new Error("connect ECONNREFUSED 10.1.2.3:5432"), {
      code: "ECONNREFUSED",
    }),
    "(connection_failed, ECONNREFUSED)",
    "10.1.2.3",
  ],
  [
    "DNS",
    Object.assign(new Error("getaddrinfo ENOTFOUND ep-secret.neon.tech"), {
      code: "ENOTFOUND",
    }),
    "(connection_failed, ENOTFOUND)",
    "ep-secret",
  ],
  [
    "dropped connection",
    new Error("Connection terminated unexpectedly"),
    "(connection_failed)",
    "terminated",
  ],
  [
    "TLS",
    Object.assign(new Error("self-signed certificate in chain"), {
      code: "SELF_SIGNED_CERT_IN_CHAIN",
    }),
    "(tls_failed, SELF_SIGNED_CERT_IN_CHAIN)",
    "self-signed",
  ],
  [
    "missing database",
    Object.assign(new Error('database "neondb" does not exist'), {
      code: "3D000",
    }),
    "(database_not_found, 3D000)",
    "neondb",
  ],
  [
    "query",
    Object.assign(new Error('relation "secret_table" does not exist'), {
      code: "42P01",
    }),
    "(query_failed, 42P01)",
    "secret_table",
  ],
  [
    "identity",
    new MigrationStateError(
      "database_identity_mismatch",
      "Production database identity does not match.",
    ),
    "(database_identity_mismatch)",
    "does not match",
  ],
  [
    "untrusted code",
    Object.assign(new Error("odd"), { code: "postgres://user:pw@host/db" }),
    "(unknown_failed)",
    "pw@host",
  ],
  [
    "server-side connection",
    Object.assign(new Error("connection failure at host-x"), {
      code: "08006",
    }),
    "(connection_failed, 08006)",
    "host-x",
  ],
  [
    "server shutdown",
    Object.assign(new Error("terminating connection on host-y"), {
      code: "57P01",
    }),
    "(connection_failed, 57P01)",
    "host-y",
  ],
  [
    "system",
    Object.assign(new Error("operation not permitted /secret/path"), {
      code: "EPERM",
    }),
    "(unknown_failed, EPERM)",
    "/secret/path",
  ],
]) {
  test(`SEC-20: a ${name} failure names its category without driver details`, async () => {
    const harness = createHarness({
      env: productionEnvironment,
      states: [error],
    });
    await assert.rejects(runBuild(harness.options), (rejection) => {
      assert.equal(
        rejection.message,
        `Migration state could not be verified ${expected}; stopping.`,
      );
      assert.ok(!rejection.message.includes(hidden));
      assert.ok(!rejection.message.includes("secret-password"));
      return true;
    });
    assert.deepEqual(harness.calls, []);
  });
}

for (const [name, env, reason] of [
  [
    "a feature branch",
    { VERCEL_GIT_COMMIT_REF: "codex/feature" },
    /only run from main; this deployment's Git ref is "codex\/feature"/,
  ],
  [
    "a missing ref",
    { VERCEL_GIT_COMMIT_REF: undefined },
    /only run from main; this deployment's Git ref is missing/,
  ],
  [
    "a ref that only resembles main",
    { VERCEL_GIT_COMMIT_REF: "main " },
    /only run from main/,
  ],
  ["no Vercel marker", { VERCEL: undefined }, /outside a Vercel build/],
  [
    "a missing commit SHA",
    { VERCEL_GIT_COMMIT_SHA: undefined },
    /full 40-character commit SHA/,
  ],
  [
    "a short commit SHA",
    { VERCEL_GIT_COMMIT_SHA: "abc1234" },
    /full 40-character commit SHA/,
  ],
]) {
  test(`SEC-8: Production with ${name} fails closed before reading the database`, async () => {
    const harness = createHarness({
      env: { ...productionEnvironment, ...approval, ...env },
    });
    await assert.rejects(runBuild(harness.options), reason);
    assert.equal(harness.detections, 0);
    assert.deepEqual(harness.calls, []);
  });
}

test("the retired build-time district dry-run fails closed before any read", async () => {
  const harness = createHarness({
    env: {
      ...productionEnvironment,
      PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA: sha,
    },
  });
  await assert.rejects(
    runBuild(harness.options),
    /PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA is set, but the build-time district dry-run was retired/,
  );
  assert.equal(harness.detections, 0);
  assert.deepEqual(harness.calls, []);
});

test("Production without the persistent infrastructure stops before any read", async () => {
  const harness = createHarness({
    env: { ...productionEnvironment, PAYLOAD_DATABASE: "sqlite" },
  });
  await assert.rejects(
    runBuild(harness.options),
    /PAYLOAD_DATABASE must be postgres/,
  );
  assert.equal(harness.detections, 0);
  assert.deepEqual(harness.calls, []);
});

for (const ref of [
  "codex/project-day-17-production-infra",
  "codex/project-day-19-photography",
]) {
  test(`H: the formerly designated Preview ${ref} never migrates`, async () => {
    const harness = createHarness({
      env: {
        ...productionEnvironment,
        ...approval,
        DATABASE_URL: "postgresql://user:pw@preview.example.invalid/neondb",
        VERCEL_ENV: "preview",
        VERCEL_GIT_COMMIT_REF: ref,
      },
    });
    await runBuild(harness.options);
    assert.deepEqual(harness.calls, ["build"]);
    assert.equal(harness.detections, 0);
  });
}

const productionFingerprint = databaseIdentity(productionUrl).fingerprint;

for (const [name, env] of [
  ["a Preview", { VERCEL: "1", VERCEL_ENV: "preview" }],
  ["a Vercel development build", { VERCEL: "1", VERCEL_ENV: "development" }],
  ["a local build", {}],
]) {
  test(`ARC-V1: ${name} refuses to build against the Production database`, async () => {
    const harness = createHarness({
      env: {
        ...env,
        // Same host and database with other credentials is the same database.
        DATABASE_URL: "postgres://preview:other@db.example.invalid/neondb",
      },
      fingerprint: productionFingerprint,
    });
    await assert.rejects(
      runBuild(harness.options),
      /points at the Production database; refusing to build/,
    );
    assert.deepEqual(harness.calls, []);
  });
}

for (const databaseUrl of [
  "postgresql://user:pw@preview.example.invalid:5432/neondb",
  "file:./.data/ci.db",
  "not a url",
  undefined,
]) {
  test(`I: a Preview with DATABASE_URL ${String(databaseUrl)} skips migrate and builds`, async () => {
    const harness = createHarness({
      env: {
        VERCEL: "1",
        VERCEL_ENV: "preview",
        VERCEL_GIT_COMMIT_REF: "codex/ordinary-preview",
        DATABASE_URL: databaseUrl,
      },
      fingerprint: productionFingerprint,
    });
    await runBuild(harness.options);
    assert.deepEqual(harness.calls, ["build"]);
    assert.equal(harness.detections, 0);
  });
}

test("J: local execution skips migrate and builds", async () => {
  const harness = createHarness({ env: {} });
  await runBuild(harness.options);
  assert.deepEqual(harness.calls, ["build"]);
  assert.equal(harness.detections, 0);
});

test("migration comparison fails closed for duplicate and unknown state", () => {
  assert.deepEqual(compareMigrationState(["one", "two"], []), {
    pendingMigrationNames: ["one", "two"],
  });
  assert.deepEqual(compareMigrationState(["one", "two"], ["one", "two"]), {
    pendingMigrationNames: [],
  });
  for (const [registered, applied, message, category] of [
    [
      ["one", "one"],
      [],
      /Duplicate migration name/,
      "migration_registry_invalid",
    ],
    [[], [], /Invalid migration name list/, "migration_registry_invalid"],
    [
      ["one"],
      ["one", "one"],
      /Duplicate migration name/,
      "migration_state_inconsistent",
    ],
    [
      ["one"],
      ["unknown"],
      /Unexpected applied migration/,
      "migration_state_inconsistent",
    ],
    [
      ["one", "two"],
      ["two"],
      /not a registry prefix/,
      "migration_state_inconsistent",
    ],
  ]) {
    assert.throws(
      () => compareMigrationState(registered, applied),
      (error) => {
        assert.match(error.message, message);
        assert.equal(classifyMigrationStateError(error).category, category);
        return true;
      },
    );
  }
});

test("database identity ignores credentials and fails closed with categories", () => {
  const plain = databaseIdentity("postgresql://db.example.invalid/neondb");
  assert.equal(plain.databaseName, "neondb");
  assert.equal(plain.fingerprint, productionFingerprint);
  assert.equal(
    databaseIdentity("postgres://a:b@db.example.invalid:5432/neondb")
      .fingerprint,
    productionFingerprint,
  );
  assert.notEqual(
    databaseIdentity("postgres://db.example.invalid:6543/neondb").fingerprint,
    productionFingerprint,
  );
  assert.match(productionDatabaseFingerprint, /^[0-9a-f]{64}$/);
  for (const [url, category] of [
    ["not a url", "database_url_invalid"],
    ["mysql://db.example.invalid/neondb", "database_url_invalid"],
    ["postgresql://db.example.invalid/%E0%A4%A", "database_url_invalid"],
    ["postgresql://db.example.invalid/", "database_identity_incomplete"],
  ]) {
    assert.throws(
      () => databaseIdentity(url),
      (error) => classifyMigrationStateError(error).category === category,
    );
  }
  assert.deepEqual(
    describeProductionDatabase(productionUrl, productionFingerprint),
    { databaseName: "neondb" },
  );
  assert.throws(
    () => describeProductionDatabase(productionUrl),
    (error) =>
      /identity does not match/.test(error.message) &&
      classifyMigrationStateError(error).category ===
        "database_identity_mismatch",
  );
});

function fakeClient({
  database = "neondb",
  table = "payload_migrations",
  applied = [],
  connectError,
} = {}) {
  const client = {
    queries: [],
    ended: false,
    async connect() {
      if (connectError) throw connectError;
    },
    async query(sql) {
      client.queries.push(sql);
      if (sql.includes("current_database"))
        return { rows: [{ name: database }] };
      if (sql.includes("to_regclass")) return { rows: [{ name: table }] };
      if (sql.startsWith("select name from payload_migrations")) {
        return { rows: applied.map((name) => ({ name })) };
      }
      return { rows: [] };
    },
    async end() {
      client.ended = true;
    },
  };
  return client;
}

function stateOptions(
  client,
  registered = ["20260101_000000_one", "20260102_000000_two"],
) {
  return {
    createClient: () => client,
    expectedFingerprint: productionFingerprint,
    readRegisteredNames: async () => registered,
  };
}

test("the migration state is read in a read-only transaction and rolled back", async () => {
  const client = fakeClient({ applied: ["20260101_000000_one"] });
  const state = await readProductionMigrationState(
    { DATABASE_URL: productionUrl },
    stateOptions(client),
  );
  assert.deepEqual(state, {
    appliedCount: 1,
    registeredCount: 2,
    pendingMigrationNames: ["20260102_000000_two"],
  });
  assert.equal(client.queries[0], "BEGIN TRANSACTION READ ONLY");
  assert.equal(client.queries.at(-1), "ROLLBACK");
  assert.equal(client.ended, true);
});

test("the committed migration registry parses into unique migration names", async () => {
  const client = fakeClient();
  const state = await readProductionMigrationState(
    { DATABASE_URL: productionUrl },
    { createClient: () => client, expectedFingerprint: productionFingerprint },
  );
  assert.equal(state.appliedCount, 0);
  assert.ok(state.registeredCount > 0);
  assert.equal(state.pendingMigrationNames.length, state.registeredCount);
  assert.equal(
    new Set(state.pendingMigrationNames).size,
    state.registeredCount,
  );
  for (const name of state.pendingMigrationNames) {
    assert.match(name, /^[0-9]{8}_[0-9]{6}_[a-z0-9_]+$/);
  }
});

for (const [name, client, category] of [
  [
    "another connected database",
    fakeClient({ database: "other" }),
    "connected_database_mismatch",
  ],
  [
    "a missing migration table",
    fakeClient({ table: null }),
    "migration_table_missing",
  ],
  [
    "an unknown applied migration",
    fakeClient({ applied: ["20250101_000000_x"] }),
    "migration_state_inconsistent",
  ],
]) {
  test(`${name} fails closed with its category and rolls back`, async () => {
    await assert.rejects(
      readProductionMigrationState(
        { DATABASE_URL: productionUrl },
        stateOptions(client),
      ),
      (error) => classifyMigrationStateError(error).category === category,
    );
    assert.equal(client.queries.at(-1), "ROLLBACK");
    assert.equal(client.ended, true);
  });
}

test("a database that is not Production is never connected", async () => {
  let created = false;
  await assert.rejects(
    readProductionMigrationState(
      { DATABASE_URL: "postgresql://user:pw@other.example.invalid/neondb" },
      {
        createClient: () => {
          created = true;
          return fakeClient();
        },
        expectedFingerprint: productionFingerprint,
        readRegisteredNames: async () => ["20260101_000000_one"],
      },
    ),
    (error) =>
      classifyMigrationStateError(error).category ===
      "database_identity_mismatch",
  );
  assert.equal(created, false);
});

test("a connection error keeps its code for the importers' categories", async () => {
  const client = fakeClient({
    connectError: Object.assign(new Error("connect"), { code: "ECONNREFUSED" }),
  });
  await assert.rejects(
    readProductionMigrationState(
      { DATABASE_URL: productionUrl },
      stateOptions(client),
    ),
    (error) => error.code === "ECONNREFUSED",
  );
  assert.deepEqual(client.queries, []);
});
