// Replays every migration in src/migrations into an in-memory PGlite
// (embedded PostgreSQL) database: no server, no network, no live DB.
// PGLITE_MODULE may point at another @electric-sql/pglite build to compare.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { PGlite } = process.env.PGLITE_MODULE
  ? await import(pathToFileURL(process.env.PGLITE_MODULE).href)
  : await import("@electric-sql/pglite");
const db = new PGlite();
const index = await readFile("src/migrations/index.ts", "utf8");
const names = [...index.matchAll(/name: ['"]([^'"]+)['"]/g)].map((m) => m[1]);
const target = names.at(-1);
try {
  for (const name of names) {
    const source = await readFile(`src/migrations/${name}.ts`, "utf8");
    const up = source.split("export async function down")[0];
    const statements = [...up.matchAll(/sql`([\s\S]*?)`/g)].map((m) => m[1]);
    assert.ok(statements.length, `SQL missing: ${name}`);
    if (name === target) {
      assert.ok(
        !/\b(?:DROP\s+(?:TABLE|COLUMN|TYPE)|TRUNCATE\s|DELETE\s+FROM)/i.test(
          up,
        ),
        "New UP must be additive",
      );
      await db.exec(
        `INSERT INTO district_guides (id,district,_status) VALUES ('11111111-1111-4111-8111-111111111111','esenler','draft');`,
      );
    }
    await db.exec("BEGIN");
    for (const statement of statements) await db.exec(statement);
    await db.exec("COMMIT");
  }
  const old = await db.query(
    `SELECT district FROM district_guides WHERE id='11111111-1111-4111-8111-111111111111'`,
  );
  assert.equal(old.rows[0].district, "esenler");
  await db.exec(
    `INSERT INTO district_guides_sources (_order,_parent_id,id,title,publisher,url,source_type) VALUES (1,'11111111-1111-4111-8111-111111111111','source-1','Fixture','fixture','https://www.esenler.gov.tr/tarihce','official');`,
  );
  const tables = await db.query(
    "SELECT count(*)::integer AS count FROM information_schema.tables WHERE table_schema='public'",
  );
  console.log(
    JSON.stringify(
      {
        engine: "PGlite embedded PostgreSQL",
        migrations: names.length,
        target,
        preservedExistingDistrict: true,
        sourceInsert: true,
        tableCount: tables.rows[0].count,
        productionConnection: false,
      },
      null,
      2,
    ),
  );
} finally {
  await db.close();
}
