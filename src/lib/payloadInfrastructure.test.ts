import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  assertProductionPayloadInfrastructure,
  getPayloadDatabaseProvider,
  getPayloadSecret,
  getPayloadStorageProvider,
  getVercelBlobStoreHostname,
  isHttpsDeployment,
  isVercelProductionDeployment,
  requirePayloadEnvironmentVariable,
} from "./payloadInfrastructure";

const VARIABLES = [
  "ARTICLE_PUBLIC_SOURCE",
  "BLOB_READ_WRITE_TOKEN",
  "BOOK_PUBLIC_SOURCE",
  "DATABASE_URL",
  "NAVIGATION_PUBLIC_SOURCE",
  "NODE_ENV",
  "PAGE_PUBLIC_SOURCE",
  "PAYLOAD_DATABASE",
  "PAYLOAD_SECRET",
  "PAYLOAD_STORAGE",
  "PHOTO_PUBLIC_SOURCE",
  "VERCEL_ENV",
] as const;

const original = Object.fromEntries(
  VARIABLES.map((name) => [name, process.env[name]]),
);

const FAKE_TOKEN = "vercel_blob_rw_AbC123store_fakesecretvalue0000";
const FAKE_SECRET = "test-only-secret-value-never-printed";

function setEnvironment(
  values: Partial<Record<(typeof VARIABLES)[number], string>>,
) {
  for (const name of VARIABLES) {
    // NODE_ENV is typed read-only; the test restores it afterwards.
    Reflect.deleteProperty(process.env, name);
  }
  Object.assign(process.env, values);
}

afterEach(() => {
  for (const name of VARIABLES) {
    const value = original[name];
    if (value === undefined) Reflect.deleteProperty(process.env, name);
    else Object.assign(process.env, { [name]: value });
  }
});

const STATIC_SOURCES = {
  ARTICLE_PUBLIC_SOURCE: "static",
  BOOK_PUBLIC_SOURCE: "static",
  NAVIGATION_PUBLIC_SOURCE: "static",
  PAGE_PUBLIC_SOURCE: "static",
  PHOTO_PUBLIC_SOURCE: "static",
};

const PERSISTENT_INFRASTRUCTURE = {
  BLOB_READ_WRITE_TOKEN: FAKE_TOKEN,
  DATABASE_URL: "postgres://user:pass@db.invalid:5432/app",
  PAYLOAD_DATABASE: "postgres",
  PAYLOAD_SECRET: FAKE_SECRET,
  PAYLOAD_STORAGE: "vercel-blob",
};

test("providers default to SQLite and local storage and reject unknown values", () => {
  setEnvironment({});
  assert.equal(getPayloadDatabaseProvider(), "sqlite");
  assert.equal(getPayloadStorageProvider(), "local");

  setEnvironment({ PAYLOAD_DATABASE: "mysql" });
  assert.throws(getPayloadDatabaseProvider, /Invalid PAYLOAD_DATABASE value/);

  setEnvironment({ PAYLOAD_STORAGE: "s3" });
  assert.throws(getPayloadStorageProvider, /Invalid PAYLOAD_STORAGE value/);
});

test("required variables must be non-blank", () => {
  setEnvironment({ DATABASE_URL: "   " });
  assert.throws(
    () =>
      requirePayloadEnvironmentVariable(
        "DATABASE_URL",
        "PAYLOAD_DATABASE=postgres",
      ),
    /DATABASE_URL is required when PAYLOAD_DATABASE=postgres/,
  );

  setEnvironment({ DATABASE_URL: " postgres://x " });
  assert.equal(
    requirePayloadEnvironmentVariable("DATABASE_URL", "test"),
    "postgres://x",
  );
});

test("development, CI and local static builds keep working with SQLite", () => {
  setEnvironment({ NODE_ENV: "development" });
  assert.doesNotThrow(assertProductionPayloadInfrastructure);

  // The CI environment from .github/workflows/ci.yml during `next build`.
  setEnvironment({
    ...STATIC_SOURCES,
    DATABASE_URL: "file:./.data/ci.db",
    NODE_ENV: "production",
    PAYLOAD_DATABASE: "sqlite",
    PAYLOAD_SECRET: "ci-only-insecure-payload-secret",
    PAYLOAD_STORAGE: "local",
  });
  assert.doesNotThrow(assertProductionPayloadInfrastructure);

  setEnvironment({
    ...STATIC_SOURCES,
    NODE_ENV: "production",
    VERCEL_ENV: "preview",
  });
  assert.doesNotThrow(assertProductionPayloadInfrastructure);
});

test("a production build that reads Payload needs persistent infrastructure", () => {
  setEnvironment({
    ...STATIC_SOURCES,
    ARTICLE_PUBLIC_SOURCE: "payload",
    NODE_ENV: "production",
    PAYLOAD_SECRET: FAKE_SECRET,
  });

  assert.throws(assertProductionPayloadInfrastructure, (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(
      error.message,
      /Production Payload public sources \(ARTICLE_PUBLIC_SOURCE\)/,
    );
    assert.match(
      error.message,
      /PAYLOAD_DATABASE=postgres, PAYLOAD_STORAGE=vercel-blob, DATABASE_URL, BLOB_READ_WRITE_TOKEN\.$/,
    );
    assert.ok(!error.message.includes(FAKE_SECRET), "never prints secrets");
    return true;
  });

  setEnvironment({
    ...STATIC_SOURCES,
    ...PERSISTENT_INFRASTRUCTURE,
    ARTICLE_PUBLIC_SOURCE: "payload",
    NODE_ENV: "production",
  });
  assert.doesNotThrow(assertProductionPayloadInfrastructure);
});

test("every Vercel production deployment needs persistent infrastructure, even with static sources", () => {
  for (const nodeEnv of ["production", "development"]) {
    setEnvironment({
      ...STATIC_SOURCES,
      DATABASE_URL: "file:./.data/payload.db",
      NODE_ENV: nodeEnv,
      PAYLOAD_SECRET: FAKE_SECRET,
      VERCEL_ENV: "production",
    });

    assert.throws(assertProductionPayloadInfrastructure, (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(
        error.message,
        /A Vercel production deployment \(VERCEL_ENV=production\) requires/,
      );
      assert.match(error.message, /PAYLOAD_DATABASE=postgres/);
      assert.match(error.message, /BLOB_READ_WRITE_TOKEN/);
      assert.ok(!error.message.includes(FAKE_SECRET));
      return true;
    });
  }

  setEnvironment({
    ...STATIC_SOURCES,
    ...PERSISTENT_INFRASTRUCTURE,
    NODE_ENV: "production",
    PAYLOAD_SECRET: "",
    VERCEL_ENV: "production",
  });
  assert.throws(
    assertProductionPayloadInfrastructure,
    /Missing or invalid: PAYLOAD_SECRET\.$/,
  );

  setEnvironment({
    ...STATIC_SOURCES,
    ...PERSISTENT_INFRASTRUCTURE,
    NODE_ENV: "production",
    VERCEL_ENV: "production",
  });
  assert.doesNotThrow(assertProductionPayloadInfrastructure);
});

test("the Payload secret is never silently empty in Vercel production", () => {
  setEnvironment({ PAYLOAD_SECRET: FAKE_SECRET });
  assert.equal(getPayloadSecret(), FAKE_SECRET);

  setEnvironment({ VERCEL_ENV: "production" });
  assert.throws(
    getPayloadSecret,
    /PAYLOAD_SECRET is required in a Vercel production deployment/,
  );

  setEnvironment({ PAYLOAD_SECRET: "   ", VERCEL_ENV: "production" });
  assert.throws(getPayloadSecret, /PAYLOAD_SECRET is required/);

  // Elsewhere Payload itself refuses to start without a secret.
  setEnvironment({ VERCEL_ENV: "preview" });
  assert.equal(getPayloadSecret(), "");
});

test("HTTPS deployments are Vercel production and preview", () => {
  for (const [vercelEnv, https, production] of [
    ["production", true, true],
    ["preview", true, false],
    ["development", false, false],
    [undefined, false, false],
  ] as const) {
    setEnvironment(vercelEnv === undefined ? {} : { VERCEL_ENV: vercelEnv });
    assert.equal(isHttpsDeployment(), https, String(vercelEnv));
    assert.equal(isVercelProductionDeployment(), production, String(vercelEnv));
  }
});

test("the Blob store hostname comes from the store ID in the token, never a wildcard", () => {
  assert.equal(
    getVercelBlobStoreHostname(FAKE_TOKEN),
    "abc123store.public.blob.vercel-storage.com",
  );
  assert.equal(
    getVercelBlobStoreHostname(` ${FAKE_TOKEN} `),
    "abc123store.public.blob.vercel-storage.com",
  );

  for (const token of [
    undefined,
    "",
    "not-a-token",
    "vercel_blob_rw__secret",
    "vercel_blob_rw_store.evil.com_secret",
  ]) {
    assert.equal(getVercelBlobStoreHostname(token), null, String(token));
  }
});
