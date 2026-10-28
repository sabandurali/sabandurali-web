const PAYLOAD_DATABASE_PROVIDERS = ["sqlite", "postgres"] as const;
const PAYLOAD_STORAGE_PROVIDERS = ["local", "vercel-blob"] as const;
const PUBLIC_SOURCE_VARIABLES = [
  "ARTICLE_PUBLIC_SOURCE",
  "BOOK_PUBLIC_SOURCE",
  "PAGE_PUBLIC_SOURCE",
  "NAVIGATION_PUBLIC_SOURCE",
  "PHOTO_PUBLIC_SOURCE",
] as const;

export type PayloadDatabaseProvider =
  (typeof PAYLOAD_DATABASE_PROVIDERS)[number];
export type PayloadStorageProvider = (typeof PAYLOAD_STORAGE_PROVIDERS)[number];

type RequiredPayloadEnvironmentVariable =
  "BLOB_READ_WRITE_TOKEN" | "DATABASE_URL";

function readProvider<TProvider extends string>(
  variableName: "PAYLOAD_DATABASE" | "PAYLOAD_STORAGE",
  supportedProviders: readonly TProvider[],
  defaultProvider: TProvider,
): TProvider {
  const value = process.env[variableName];

  if (value === undefined || value === "") {
    return defaultProvider;
  }

  if (supportedProviders.includes(value as TProvider)) {
    return value as TProvider;
  }

  throw new Error(
    `Invalid ${variableName} value "${value}". Expected ${supportedProviders.join(" or ")}.`,
  );
}

function hasEnvironmentValue(variableName: string): boolean {
  return Boolean(process.env[variableName]?.trim());
}

export function getPayloadDatabaseProvider(): PayloadDatabaseProvider {
  return readProvider("PAYLOAD_DATABASE", PAYLOAD_DATABASE_PROVIDERS, "sqlite");
}

export function getPayloadStorageProvider(): PayloadStorageProvider {
  return readProvider("PAYLOAD_STORAGE", PAYLOAD_STORAGE_PROVIDERS, "local");
}

export function requirePayloadEnvironmentVariable(
  variableName: RequiredPayloadEnvironmentVariable,
  context: string,
): string {
  const value = process.env[variableName]?.trim();

  if (!value) {
    throw new Error(`${variableName} is required when ${context}.`);
  }

  return value;
}

/** A Vercel production deployment, whichever Git ref it was built from. */
export function isVercelProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/** Vercel production and preview deployments are only served over HTTPS. */
export function isHttpsDeployment(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  );
}

/**
 * The Payload secret signs session tokens. A Vercel production deployment
 * never starts without one (see {@link assertProductionPayloadInfrastructure}).
 * Anywhere else an empty value is passed through unchanged and Payload refuses
 * to initialise ("missing secret key"), so the admin and the API fail closed.
 */
export function getPayloadSecret(): string {
  const secret = process.env.PAYLOAD_SECRET ?? "";

  if (secret.trim() === "" && isVercelProductionDeployment()) {
    throw new Error(
      "PAYLOAD_SECRET is required in a Vercel production deployment (VERCEL_ENV=production).",
    );
  }

  return secret;
}

/**
 * Hostname of this project's public Vercel Blob store. Read/write tokens look
 * like `vercel_blob_rw_<storeId>_<secret>`; only the store ID is used, and it
 * is public anyway because every Blob URL contains it. Returns `null` without
 * a well-formed token (local storage, CI).
 */
export function getVercelBlobStoreHostname(
  token: string | undefined = process.env.BLOB_READ_WRITE_TOKEN,
): string | null {
  const storeID = token
    ?.trim()
    .match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]
    ?.toLowerCase();

  return storeID ? `${storeID}.public.blob.vercel-storage.com` : null;
}

/**
 * Fails closed when a deployment would serve Payload without persistent
 * infrastructure:
 *
 * - every Vercel production deployment (`VERCEL_ENV=production`) needs
 *   PostgreSQL, Vercel Blob and `PAYLOAD_SECRET`, even when every public
 *   source is static, because `/admin` and `/api` are always deployed;
 * - any other production build (`NODE_ENV=production`, e.g. a Preview or a
 *   local `next build`) needs them only once a public source reads Payload.
 *   CI and local builds with SQLite and static sources keep working.
 */
export function assertProductionPayloadInfrastructure(): void {
  const vercelProduction = isVercelProductionDeployment();

  if (!vercelProduction && process.env.NODE_ENV !== "production") return;

  const payloadSources = PUBLIC_SOURCE_VARIABLES.filter(
    (variableName) => process.env[variableName] === "payload",
  );

  if (!vercelProduction && payloadSources.length === 0) return;

  const missingOrInvalid: string[] = [];

  if (getPayloadDatabaseProvider() !== "postgres") {
    missingOrInvalid.push("PAYLOAD_DATABASE=postgres");
  }

  if (getPayloadStorageProvider() !== "vercel-blob") {
    missingOrInvalid.push("PAYLOAD_STORAGE=vercel-blob");
  }

  for (const variableName of [
    "DATABASE_URL",
    "PAYLOAD_SECRET",
    "BLOB_READ_WRITE_TOKEN",
  ] as const) {
    if (!hasEnvironmentValue(variableName)) {
      missingOrInvalid.push(variableName);
    }
  }

  if (missingOrInvalid.length === 0) return;

  const requirement = vercelProduction
    ? "A Vercel production deployment (VERCEL_ENV=production) requires"
    : `Production Payload public sources (${payloadSources.join(", ")}) require`;

  throw new Error(
    `${requirement} persistent PostgreSQL and Vercel Blob infrastructure. Missing or invalid: ${missingOrInvalid.join(", ")}.`,
  );
}
