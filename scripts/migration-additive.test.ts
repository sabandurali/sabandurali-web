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
 * Migrations already committed, with the sha256 of their file. A committed
 * migration may already have run somewhere, so its file must not change; a
 * new migration is not listed here and is checked line by line below.
 */
const COMMITTED_MIGRATIONS: Readonly<Record<string, string>> = {
  "20260731_034937_initial_postgres_schema":
    "488f2a84eab4d4436769c0d9a1c62082b32f6e91d1d4ab23ea5297dbfb99eeae",
  "20260807_205132_day19_photography":
    "4cec984f45d34dc5e7cd158c75a53d224717099769e3e3c84e90db12af0324b1",
  "20260820_090000_day21_focus_area_icons":
    "a52c78549e507cacf414a8e751dafec985bec58f2ca123f6325eade33e4f6993",
  "20260820_100000_day21_versioned_focus_area_icons":
    "e7a7a46a581c1061018c0f8571043009d2baf34a17603497c9dba058c67bc259",
  "20260820_103626_day22_bilingual_navigation":
    "00795a8ad197e2ef3828fc815bf6552ff089466b9f2fa377bc64f341501152e2",
  "20260830_151918_istanbul_district_guides":
    "233612f7e24c62b7a0486677d14a137e5200d99621e5771fcfb67ffad4573b55",
  "20260909_181042_istanbul_district_sources":
    "1267e524afa129e694d8f61f197be5de0f316c28477f6c771811a6a2d4bd3187",
  "20261017_210129_payload_3_91_security_schema":
    "6ab1a39d5868782b247ab3b5228ef9396164871ff35d84ee16dd7249b488a2f6",
  "20261028_205938_article_seo_book_slug_unique":
    "da5dae3f1bf08b88529daf582317c061c10af5a5084a7d64f4de603ac477ebcb",
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

function sha256(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
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

test("committed migrations are unchanged and still listed", () => {
  const names = new Set(listedMigrations());

  for (const [name, hash] of Object.entries(COMMITTED_MIGRATIONS)) {
    assert.ok(names.has(name), `${name} was removed from the index`);
    assert.equal(
      sha256(`src/migrations/${name}.ts`),
      hash,
      `${name} changed after it was committed; add a new migration instead`,
    );
  }
});
