import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// The migration replay itself lives in src/collections/schema-migration.test.ts
// (embedded PGlite, rows written before the latest migration). This guard
// keeps the newest UP additive: production runs with `push: false`, so a
// destructive statement would reach real data on the next deploy.
const destructive =
  /\b(?:DROP\s+(?:TABLE|COLUMN|TYPE)|TRUNCATE\s|DELETE\s+FROM)/i;

function upSource(source: string): string {
  return source.split("export async function down")[0] ?? "";
}

function isAdditiveUp(source: string): boolean {
  return !destructive.test(upSource(source));
}

test("the destructive-statement guard looks at UP only", () => {
  const migration = (up: string, down: string) =>
    `export async function up() { await db.execute(sql\`${up}\`) }\n` +
    `export async function down() { await db.execute(sql\`${down}\`) }`;
  assert.equal(
    isAdditiveUp(
      migration(
        'ALTER TABLE "a" ADD COLUMN "b" varchar;',
        'ALTER TABLE "a" DROP COLUMN "b";',
      ),
    ),
    true,
  );
  for (const statement of [
    'ALTER TABLE "a" DROP COLUMN "b";',
    'DROP TABLE "a" CASCADE;',
    'DROP TYPE "public"."enum_a";',
    'TRUNCATE "a";',
    'DELETE FROM "a";',
  ])
    assert.equal(isAdditiveUp(migration(statement, "")), false, statement);
});

test("the latest migration's UP is additive", () => {
  const index = readFileSync("src/migrations/index.ts", "utf8");
  const latest = [...index.matchAll(/name: ['"]([^'"]+)['"]/g)]
    .map((match) => match[1])
    .at(-1);
  assert.ok(latest, "src/migrations/index.ts lists no migration");
  const source = readFileSync(`src/migrations/${latest}.ts`, "utf8");
  assert.match(upSource(source), /sql`/, `${latest}: UP has no SQL`);
  assert.ok(isAdditiveUp(source), `${latest}: new UP must be additive`);
});
