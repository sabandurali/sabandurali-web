const PAYLOAD_DATABASE_PROVIDERS = ["sqlite", "postgres"] as const;
const PAYLOAD_STORAGE_PROVIDERS = ["local", "vercel-blob"] as const;
const PUBLIC_SOURCE_VARIABLES = [
  "ARTICLE_PUBLIC_SOURCE",
  "BOOK_PUBLIC_SOURCE",
  "PAGE_PUBLIC_SOURCE",
  "NAVIGATION_PUBLIC_SOURCE",
] as const;

export type PayloadDatabaseProvider =
  (typeof PAYLOAD_DATABASE_PROVIDERS)[number];
export type PayloadStorageProvider =
  (typeof PAYLOAD_STORAGE_PROVIDERS)[number];

type RequiredPayloadEnvironmentVariable =
  | "BLOB_READ_WRITE_TOKEN"
  | "DATABASE_URL";

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
  return readProvider(
    "PAYLOAD_DATABASE",
    PAYLOAD_DATABASE_PROVIDERS,
    "sqlite",
  );
}

export function getPayloadStorageProvider(): PayloadStorageProvider {
  return readProvider(
    "PAYLOAD_STORAGE",
    PAYLOAD_STORAGE_PROVIDERS,
    "local",
  );
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

export function assertProductionPayloadInfrastructure(): void {
  if (process.env.NODE_ENV !== "production") return;

  const payloadSources = PUBLIC_SOURCE_VARIABLES.filter(
    (variableName) => process.env[variableName] === "payload",
  );

  if (payloadSources.length === 0) return;

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

  if (missingOrInvalid.length > 0) {
    throw new Error(
      `Production Payload public sources (${payloadSources.join(", ")}) require persistent PostgreSQL and Vercel Blob infrastructure. Missing or invalid: ${missingOrInvalid.join(", ")}.`,
    );
  }
}
