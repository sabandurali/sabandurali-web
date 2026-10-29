// Creates the Payload schema in the local, CI-only SQLite database that the
// production build reads during the e2e checks:
//
//   DATABASE_URL=file:./.data/ci.db npm run ci:sqlite-schema
//
// A production build never pushes a schema (the SQLite adapter pushes only in
// development and Postgres never does), so without this step the admin pages
// of the CI server answer with Payload's error page ("no such table: users").
// The schema is pushed from the Payload config, as the integration tests do.
// The script refuses anything but a SQLite file under .data/ or the system
// temporary directory: it never touches Postgres, Neon or a deployed origin,
// and it writes no content (no user, no document).
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { SanitizedConfig } from "payload";

/**
 * The SQLite file named by `databaseUrl` when it is a local file the CI
 * schema may be pushed to: under `<cwd>/.data/` or the temporary directory.
 * Anything else (Postgres, a remote libSQL URL, a path elsewhere) is null.
 */
export function resolveCiSqliteFile(
  databaseUrl: string | undefined,
  cwd: string = process.cwd(),
  temporaryDirectory: string = os.tmpdir(),
): string | null {
  if (databaseUrl === undefined || !databaseUrl.startsWith("file:")) {
    return null;
  }
  const file = path.resolve(cwd, databaseUrl.slice("file:".length));
  const allowed = [path.join(cwd, ".data"), path.resolve(temporaryDirectory)];
  return allowed.some((directory) => file.startsWith(`${directory}${path.sep}`))
    ? file
    : null;
}

async function main(): Promise<void> {
  if (process.env.PAYLOAD_DATABASE !== "sqlite") {
    throw new Error("Refusing: PAYLOAD_DATABASE must be sqlite.");
  }
  const databaseUrl = process.env.DATABASE_URL;
  const file = resolveCiSqliteFile(databaseUrl);
  if (databaseUrl === undefined || file === null) {
    throw new Error(
      "Refusing: DATABASE_URL must be a file: URL under .data/ or the temporary directory.",
    );
  }
  mkdirSync(path.dirname(file), { recursive: true });

  const { default: configPromise } = await import("../../src/payload.config");
  const { sqliteAdapter } = await import("@payloadcms/db-sqlite");
  const { getPayload } = await import("payload");

  const config: SanitizedConfig = await configPromise;
  config.typescript.autoGenerate = false;
  Object.assign(
    config.db,
    sqliteAdapter({ client: { url: databaseUrl }, idType: "uuid", push: true }),
  );
  const payload = await getPayload({ config });
  const { totalDocs } = await payload.count({ collection: "users" });
  await payload.destroy();
  console.log(
    `Payload schema ready in ${path.relative(process.cwd(), file)} (${totalDocs} users).`,
  );
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
