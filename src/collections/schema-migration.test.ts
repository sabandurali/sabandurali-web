/**
 * PostgreSQL schema checks. Production runs with `push: false`, so every
 * collection change needs a migration in `src/migrations`.
 *
 * 1. The schema built from `payload.config.ts` (PostgreSQL adapter, no
 *    connection) must equal the latest migration snapshot.
 * 2. Replaying every migration into embedded PGlite must keep existing rows
 *    and enforce the latest rules. Nothing connects to a real database.
 */
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const migrationsDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations",
);

async function migrationNames(): Promise<string[]> {
  const index = await readFile(
    path.join(migrationsDirectory, "index.ts"),
    "utf8",
  );
  return [...index.matchAll(/name: ['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );
}

async function upStatements(name: string): Promise<string[]> {
  const source = await readFile(
    path.join(migrationsDirectory, `${name}.ts`),
    "utf8",
  );
  const up = source.split("export async function down")[0];
  return [...up.matchAll(/sql`([\s\S]*?)`/g)].map((match) => match[1]);
}

test("the Payload schema has no changes without a migration", async () => {
  Object.assign(process.env, {
    BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_offline0000_offline0000",
    DATABASE_URL: "postgres://offline:offline@offline.invalid:5432/offline",
    PAYLOAD_DATABASE: "postgres",
    PAYLOAD_SECRET: "schema-test-only-secret",
    PAYLOAD_STORAGE: "vercel-blob",
  });

  const { default: configPromise } = await import("../payload.config");
  const { default: payload } = await import("payload");
  const config = await configPromise;
  config.typescript.autoGenerate = false;

  // `disableDBConnect`: the adapter builds its schema but never connects.
  await payload.init({ config, disableDBConnect: true, disableOnInit: true });

  const db = payload.db as unknown as {
    migrationDir: string;
    requireDrizzleKit: () => {
      generateDrizzleJson: (schema: unknown) => Promise<{ version: string }>;
      generateMigration: (before: unknown, after: unknown) => Promise<string[]>;
    };
    schema: unknown;
  };
  const latestSnapshot = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith(".json"))
    .sort()
    .at(-1);
  assert.ok(latestSnapshot);

  const { generateDrizzleJson, generateMigration } = db.requireDrizzleKit();
  const current = await generateDrizzleJson(db.schema);
  const snapshot: unknown = JSON.parse(
    await readFile(path.join(migrationsDirectory, latestSnapshot), "utf8"),
  );

  assert.deepEqual(
    await generateMigration(snapshot, current),
    [],
    `schema differs from ${latestSnapshot}: generate a migration`,
  );
  assert.equal(
    latestSnapshot.replace(/\.json$/, ""),
    (await migrationNames()).at(-1),
    "the latest snapshot belongs to the latest migration",
  );
});

test("migrations replay on PostgreSQL, keep existing rows and enforce the latest rules", async () => {
  const names = await migrationNames();
  const target = "20261028_205938_article_seo_book_slug_unique";
  assert.ok(names.includes(target));

  const db = new PGlite();

  try {
    for (const name of names) {
      if (name === target) {
        // Rows written by the previous schema.
        await db.exec(`
          INSERT INTO articles (id, _status) VALUES ('11111111-1111-4111-8111-111111111111', 'published');
          INSERT INTO books (id, language, slug, _status) VALUES ('22222222-2222-4222-8222-222222222222', 'tr', 'derin-calisma', 'published');
        `);
      }

      await db.exec("BEGIN");
      for (const statement of await upStatements(name))
        await db.exec(statement);
      await db.exec("COMMIT");
    }

    const article = await db.query<{
      author_name: string;
      seo_follow: boolean;
      seo_index: boolean;
    }>(
      "SELECT author_name, seo_index, seo_follow FROM articles WHERE id = '11111111-1111-4111-8111-111111111111'",
    );
    assert.deepEqual(article.rows[0], {
      author_name: "Şaban Durali",
      seo_follow: true,
      seo_index: true,
    });

    await assert.rejects(
      db.exec(
        "INSERT INTO books (id, language, slug, _status) VALUES ('33333333-3333-4333-8333-333333333333', 'tr', 'derin-calisma', 'draft')",
      ),
      /duplicate key value violates unique constraint "language_slug_1_idx"/,
    );
    await db.exec(
      "INSERT INTO books (id, language, slug, _status) VALUES ('44444444-4444-4444-8444-444444444444', 'en', 'derin-calisma', 'draft')",
    );

    const user = await db.query<{ role: string }>(
      "INSERT INTO users (id, email) VALUES ('55555555-5555-4555-8555-555555555555', 'new@example.com') RETURNING role",
    );
    assert.equal(user.rows[0]?.role, "editor");

    // Pages keep their original unique index name.
    const pageIndexes = await db.query<{ indexname: string }>(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'pages' AND indexname = 'language_slug_idx'",
    );
    assert.equal(pageIndexes.rows.length, 1);
  } finally {
    await db.close();
  }
});
