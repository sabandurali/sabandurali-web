// Prints the identity fingerprint of DATABASE_URL: sha256 of host, port and
// database name. The URL, user, password and host are never printed. Use it
// for the fingerprint rotation in docs/PROJECT-STATE.md §K, after a
// point-in-time restore moved Production to another endpoint, then change
// productionDatabaseFingerprint in scripts/vercel-build.mjs in a reviewed
// commit. It does not connect to the database.
import {
  classifyMigrationStateError,
  databaseIdentity,
  productionDatabaseFingerprint,
} from "./vercel-build.mjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString?.trim()) {
  console.error(
    "Set DATABASE_URL for this single command; its value is never printed.",
  );
  process.exitCode = 1;
} else {
  try {
    const { fingerprint } = databaseIdentity(connectionString);
    console.log(
      JSON.stringify({
        fingerprint,
        matchesCommittedProductionFingerprint:
          fingerprint === productionDatabaseFingerprint,
      }),
    );
  } catch (error) {
    console.error(
      `DATABASE_URL is not a complete PostgreSQL URL (${classifyMigrationStateError(error).category}).`,
    );
    process.exitCode = 1;
  }
}
