import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

// The migration replay itself lives in src/collections/schema-migration.test.ts
// (embedded PGlite, rows written before the latest migration). This guard
// keeps every UP additive: production runs with `push: false`, so a
// destructive statement would reach real data on the next approved migrate.

/**
 * Statements that lose data, rewrite it, or break the previous release on a
 * rollback: drops, truncates, deletes, renames, column type changes and
 * statement-level UPDATE backfills. `ON DELETE` / `ON UPDATE` clauses of a
 * foreign key are not statements and do not match.
 */
const DESTRUCTIVE_STATEMENTS: readonly RegExp[] = [
  // Every DROP except relaxing a column (`DROP NOT NULL`, `DROP DEFAULT`):
  // Postgres also drops a column without the COLUMN keyword
  // (`ALTER TABLE "a" DROP "b"`), and extensions, policies or domains.
  /\bDROP\b(?!\s+(?:NOT\s+NULL|DEFAULT)\b)/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bRENAME\b/i,
  /\bALTER\s+COLUMN\s+\S+\s+(?:SET\s+DATA\s+)?TYPE\b/i,
  // At the start of a statement, or the first one of a sql`` template.
  /(?:^|`)\s*UPDATE\s+["\w]/i,
  // The same operations through the Drizzle or Payload query builders.
  /\b(?:db|tx|payload)\s*\.\s*(?:delete|update|updateMany|deleteMany)\s*\(/,
];

/**
 * A destructive statement is accepted only with an explicit, reasoned marker
 * in a comment on the line that ends it (or inside it), for example
 * `DROP INDEX "x"; -- destructive-reviewed: replaced by "y" in this UP`.
 */
const REVIEWED_MARKER = /--\s*destructive-reviewed:\s*\S/;

/**
 * Migrations already committed, with the sha256 of their UP part (everything
 * before `export async function down`: imports and `up`). A committed UP may
 * already have run somewhere, so it must not change; a new migration is not
 * listed here and is checked line by line below.
 *
 * DOWN is not locked: it never runs on the forward path, and a broken
 * rollback has to be fixable in place (TESTS-INFRA-1, day19). The rollback
 * replay in src/collections/schema-migration.test.ts runs every reversible
 * DOWN on PostgreSQL instead.
 */
const COMMITTED_MIGRATION_UPS: Readonly<Record<string, string>> = {
  "20260731_034937_initial_postgres_schema":
    "00167e0a8a8e0661accc57f8e578158a29fef7c55719e8b3edd92857a5120210",
  "20260807_205132_day19_photography":
    "4e55950fc9d22a9b3e5fa78c0bba70863fbfecad42acbf047853974c517c5c39",
  "20260820_090000_day21_focus_area_icons":
    "38e646d9a17dfd49dd117a3ed08796f90beb4359330d87fcc8dad7d66828044d",
  "20260820_100000_day21_versioned_focus_area_icons":
    "d1b5c8b6e286f4668b303472bb3164eae7b9d38dbaff6e991dafc36464e71619",
  "20260820_103626_day22_bilingual_navigation":
    "c29471bde70559aa17c73a378043d26c501992e88607f554cd7108515f4b342a",
  "20260830_151918_istanbul_district_guides":
    "948a8e14b30984af937c454f189aba17f3d8138b98085c256a49617c3ddc5aac",
  "20260909_181042_istanbul_district_sources":
    "50fa26177b3ff9b5cdd46bfb31134d92bace822170d2446d2fb0ee4963e8b7b3",
  "20261017_210129_payload_3_91_security_schema":
    "90c82f13401df70e79361aa5845fd1db045447287ed0a415f07a7cf77e49ae1d",
  "20261028_205938_article_seo_book_slug_unique":
    "929647007bbabaf345bcaea949384bd2e4700759e85630313c5d358a1ceaa0d5",
};

function upSource(source: string): string {
  return source.split("export async function down")[0] ?? "";
}

type Statement = { code: string; comments: string[] };

/**
 * Splits UP into statements at `;`, across lines, so a statement written
 * over several lines (`DROP` and `TABLE` on separate lines) is checked as a
 * whole. A `--` comment belongs to the last statement its line ends, or to
 * the statement still open on that line.
 */
function upStatements(source: string): Statement[] {
  const statements: Statement[] = [];
  let open: Statement = { code: "", comments: [] };

  for (const line of upSource(source).split("\n")) {
    const commentStart = line.indexOf("--");
    const code = commentStart === -1 ? line : line.slice(0, commentStart);
    const comment = commentStart === -1 ? "" : line.slice(commentStart);
    const pieces = code.split(";");
    let lastClosed: Statement | undefined;

    pieces.forEach((piece, index) => {
      open.code += `${piece}\n`;
      if (index < pieces.length - 1) {
        statements.push(open);
        lastClosed = open;
        open = { code: "", comments: [] };
      }
    });
    if (comment !== "") (lastClosed ?? open).comments.push(comment);
  }
  statements.push(open);

  return statements
    .map(({ code, comments }) => ({
      code: code.replace(/\s+/g, " ").trim(),
      comments,
    }))
    .filter(({ code }) => code !== "");
}

/** The UP statements that are destructive and carry no reviewed marker. */
function unreviewedDestructiveLines(source: string): string[] {
  return upStatements(source)
    .filter(
      ({ comments }) =>
        !comments.some((comment) => REVIEWED_MARKER.test(comment)),
    )
    .filter(({ code }) =>
      DESTRUCTIVE_STATEMENTS.some((pattern) => pattern.test(code)),
    )
    .map(({ code }) => code);
}

function isAdditiveUp(source: string): boolean {
  return unreviewedDestructiveLines(source).length === 0;
}

function listedMigrations(): string[] {
  const index = readFileSync("src/migrations/index.ts", "utf8");
  return [...index.matchAll(/name: ['"]([^'"]+)['"]/g)].flatMap((match) =>
    match[1] === undefined ? [] : [match[1]],
  );
}

function upSha256(file: string): string {
  return createHash("sha256")
    .update(upSource(readFileSync(file, "utf8")))
    .digest("hex");
}

const migration = (up: string, down = "") =>
  `export async function up() { await db.execute(sql\`\n${up}\n\`) }\n` +
  `export async function down() { await db.execute(sql\`${down}\`) }`;

test("the destructive-statement guard looks at UP only", () => {
  assert.equal(
    isAdditiveUp(
      migration(
        'ALTER TABLE "a" ADD COLUMN "b" varchar;',
        'ALTER TABLE "a" DROP COLUMN "b";',
      ),
    ),
    true,
  );
});

test("additive statements and foreign-key actions pass", () => {
  for (const statement of [
    'ALTER TABLE "a" ADD COLUMN "b" varchar;',
    'ALTER TABLE "a" ALTER COLUMN "role" SET DEFAULT \'editor\';',
    'ALTER TABLE "a" ALTER COLUMN "b" DROP NOT NULL;',
    'ALTER TABLE "a" ALTER COLUMN "b" DROP DEFAULT;',
    'CREATE UNIQUE INDEX "a_b_idx" ON "a" USING btree ("b");',
    'ALTER TABLE "a" ADD CONSTRAINT "a_fk" FOREIGN KEY ("b") REFERENCES "public"."c"("id") ON DELETE cascade ON UPDATE no action;',
    "CREATE TYPE \"public\".\"enum_a\" AS ENUM('x', 'y');",
  ]) {
    assert.equal(isAdditiveUp(migration(statement)), true, statement);
  }
});

test("drops, renames, type changes and data rewrites are refused", () => {
  for (const statement of [
    'ALTER TABLE "a" DROP COLUMN "b";',
    'DROP TABLE "a" CASCADE;',
    'DROP TYPE "public"."enum_a";',
    'ALTER TABLE "a" DROP CONSTRAINT "a_fk";',
    'DROP INDEX IF EXISTS "a_b_idx";',
    'DROP SCHEMA "old" CASCADE;',
    'DROP VIEW "a_view";',
    'ALTER TABLE "a" DROP "b";',
    'ALTER TABLE "a" DROP IF EXISTS "b" CASCADE;',
    'DROP EXTENSION "pgcrypto";',
    'DROP POLICY "p" ON "a";',
    'DROP DOMAIN "d";',
    'ALTER TABLE "a" ALTER COLUMN "b" DROP IDENTITY;',
    'TRUNCATE "a";',
    'DELETE FROM "a";',
    'ALTER TABLE "a" RENAME COLUMN "b" TO "c";',
    'ALTER TABLE "a" RENAME TO "z";',
    "ALTER TYPE \"public\".\"enum_a\" RENAME VALUE 'x' TO 'y';",
    'ALTER TABLE "a" ALTER COLUMN "b" SET DATA TYPE integer USING "b"::integer;',
    'ALTER TABLE "a" ALTER COLUMN "b" TYPE numeric;',
    'UPDATE "a" SET "b" = NULL;',
    'ALTER TABLE "a" ADD COLUMN "b" varchar; UPDATE "a" SET "b" = \'x\';',
    // Split over several lines.
    'DROP\n  TABLE "a";',
    'ALTER TABLE "a"\n  DROP COLUMN "b";',
    'ALTER TABLE "a" ADD COLUMN "c" varchar;\nUPDATE\n  "a" SET "c" = \'x\';',
    'ALTER TABLE "a"\n  ALTER COLUMN "b"\n  TYPE numeric;',
  ]) {
    assert.equal(isAdditiveUp(migration(statement)), false, statement);
  }
});

test("query-builder deletes and updates in UP are refused", () => {
  for (const up of [
    'await db.delete(users).where(eq(users.role, "x"))',
    "await db\n  .update(users)\n  .set({ role: 'editor' })",
    'await payload.delete({ collection: "users", where: {} })',
    'await payload.update({ collection: "users", where: {}, data: {} })',
  ]) {
    const source =
      `export async function up({ db, payload }) {\n${up}\n}\n` +
      "export async function down() {}";
    assert.equal(isAdditiveUp(source), false, up);
  }
});

test("a destructive line passes only with a reasoned review marker", () => {
  assert.equal(
    isAdditiveUp(
      migration(
        'DROP INDEX "old_idx"; -- destructive-reviewed: replaced by "new_idx" above',
      ),
    ),
    true,
  );
  for (const marker of ["", "-- destructive-reviewed:", "-- reviewed"]) {
    assert.equal(
      isAdditiveUp(migration(`DROP INDEX "old_idx"; ${marker}`)),
      false,
      marker,
    );
  }
  // A multi-line statement takes the marker on the line that ends it.
  assert.equal(
    isAdditiveUp(
      migration('DROP\n  INDEX "old_idx"; -- destructive-reviewed: replaced'),
    ),
    true,
  );
  // The marker covers its own statement only.
  assert.equal(
    isAdditiveUp(
      migration(
        'DROP INDEX "a_idx"; -- destructive-reviewed: obsolete\nDROP\n  TABLE "b";',
      ),
    ),
    false,
  );
  assert.equal(
    isAdditiveUp(
      migration(
        'DROP INDEX "a_idx"; -- destructive-reviewed: obsolete\nDROP TABLE "b";',
      ),
    ),
    false,
  );
});

test("every listed migration exists and every UP is additive", () => {
  const names = listedMigrations();
  assert.ok(names.length > 0, "src/migrations/index.ts lists no migration");
  assert.equal(new Set(names).size, names.length, "duplicate migration name");

  for (const name of names) {
    const source = readFileSync(`src/migrations/${name}.ts`, "utf8");
    assert.match(upSource(source), /sql`/, `${name}: UP has no SQL`);
    assert.deepEqual(
      unreviewedDestructiveLines(source),
      [],
      `${name}: UP must be additive, or each destructive line needs ` +
        "`-- destructive-reviewed: <reason>`",
    );
  }
});

test("committed migration UPs are unchanged and still listed", () => {
  const names = new Set(listedMigrations());

  for (const [name, hash] of Object.entries(COMMITTED_MIGRATION_UPS)) {
    assert.ok(names.has(name), `${name} was removed from the index`);
    assert.equal(
      upSha256(`src/migrations/${name}.ts`),
      hash,
      `${name}: UP changed after it was committed; add a new migration instead`,
    );
  }
});
