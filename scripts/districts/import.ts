/** Local-only operational tool. No production connection is permitted. */
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { attachEditorial, type EditorialBundle } from "./editorial";
import { parseArgs } from "node:util";
import {
  validateBundle,
  makeDraft,
  decideImport,
  fingerprint,
  importVersion,
  researchFingerprint,
  type ResearchBundle,
} from "./import-core";
const { values } = parseArgs({
  options: {
    input: { type: "string", default: "data/districts/research.json" },
    database: { type: "string" },
    editorial: { type: "string" },
    "dry-run": { type: "boolean" },
    apply: { type: "boolean" },
    "offline-empty": { type: "boolean" },
  },
  strict: true,
});
if (values.apply && values["dry-run"])
  throw new Error("Choose --apply or --dry-run.");
const bundle = JSON.parse(
  await readFile(values.input!, "utf8"),
) as ResearchBundle;
validateBundle(bundle);
if (values.editorial)
  attachEditorial(
    bundle,
    JSON.parse(await readFile(values.editorial, "utf8")) as EditorialBundle,
  );
if (values["offline-empty"]) {
  if (values.apply || values.database)
    throw new Error("Offline plan cannot apply or inspect a database.");
  console.log(
    JSON.stringify(
      {
        mode: "offline-plan-assuming-empty-database",
        create: bundle.districts.length,
        update: 0,
        skip: 0,
        writes: 0,
      },
      null,
      2,
    ),
  );
} else {
  if (!values.database || !path.isAbsolute(values.database))
    throw new Error("An explicit absolute local --database path is required.");
  const target = path.join(
    await realpath(path.dirname(values.database)),
    path.basename(values.database),
  );
  const protectedDB = path.resolve(".data/payload.db");
  if (
    target === protectedDB ||
    target.startsWith(path.resolve(".data") + path.sep)
  )
    throw new Error(
      "Existing project database is protected; use an isolated copy outside .data.",
    );
  // Fail closed on symlinks pointing at the protected DB, too.
  try {
    if ((await realpath(target)).startsWith(path.resolve(".data") + path.sep))
      throw new Error("Protected database symlink.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const apply = values.apply === true;
  Object.assign(process.env, { NODE_ENV: "development" });
  process.env.PAYLOAD_DATABASE = "sqlite";
  process.env.PAYLOAD_STORAGE = "local";
  process.env.DATABASE_URL = `file:${target}`;
  process.env.PAYLOAD_SECRET = "district-local-isolated-import-no-production";
  // Import config only after replacing connection settings. Do not load .env values.
  const { default: configPromise } = await import("../../src/payload.config");
  const config = await configPromise;
  config.typescript.autoGenerate = false;
  // A dry-run must never push schema or create a database.
  if (!apply) {
    await realpath(target);
    Object.assign(
      config.db,
      (await import("@payloadcms/db-sqlite")).sqliteAdapter({
        client: { url: `file:${target}` },
        idType: "uuid",
        push: false,
      }),
    );
  }
  const { getPayload } = await import("payload");
  const payload = await getPayload({ config });
  try {
    const found = await payload.find({
      collection: "district-guides",
      locale: "tr",
      fallbackLocale: false,
      draft: true,
      limit: 100,
      depth: 0,
      overrideAccess: true,
    });
    const count = { create: 0, update: 0, skip: 0 };
    const rows = [];
    for (const row of bundle.districts) {
      const existing = found.docs.find(
        (item) => item.district === row.district,
      );
      const decision = decideImport(
        existing as unknown as Record<string, unknown> | undefined,
        row,
      );
      count[decision.action]++;
      rows.push({ district: row.district, ...decision });
      if (!apply || decision.action === "skip") continue;
      const data = makeDraft(row);
      const saved =
        decision.action === "create"
          ? await payload.create({
              collection: "district-guides",
              locale: "tr",
              draft: true,
              overrideAccess: true,
              data,
            })
          : await payload.update({
              collection: "district-guides",
              id: existing!.id,
              locale: "tr",
              draft: true,
              overrideAccess: true,
              data,
            });
      // Fingerprint persisted normalization, including Payload defaults and empty arrays.
      await payload.update({
        collection: "district-guides",
        id: saved.id,
        locale: "tr",
        draft: true,
        overrideAccess: true,
        data: {
          importProvenance: {
            version: importVersion,
            sourceFingerprint: researchFingerprint(row),
            ...row.document,
            fingerprint: fingerprint(
              saved as unknown as Record<string, unknown>,
            ),
          },
        },
      });
    }
    console.log(
      JSON.stringify(
        {
          mode: apply ? "local-draft-import" : "dry-run",
          ...count,
          writes: apply ? count.create + count.update : 0,
          rows,
        },
        null,
        2,
      ),
    );
  } finally {
    await payload.destroy();
  }
}
