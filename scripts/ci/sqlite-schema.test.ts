import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { resolveCiSqliteFile } from "./sqlite-schema";

const cwd = path.resolve("work-repo");
const temporary = path.resolve("system-temp");

test("the CI schema is pushed only to a local SQLite file", () => {
  assert.equal(
    resolveCiSqliteFile("file:./.data/ci.db", cwd, temporary),
    path.join(cwd, ".data", "ci.db"),
  );
  assert.equal(
    resolveCiSqliteFile(
      `file:${path.join(temporary, "e2e", "ci.db")}`,
      cwd,
      temporary,
    ),
    path.join(temporary, "e2e", "ci.db"),
  );
  for (const url of [
    undefined,
    "",
    "postgres://user@ep-example.neon.tech/db",
    "libsql://db.example.io",
    "file:./payload.db",
    "file:../.data/ci.db",
    "file:./.data",
    `file:${path.resolve("elsewhere", "ci.db")}`,
  ]) {
    assert.equal(resolveCiSqliteFile(url, cwd, temporary), null, String(url));
  }
});
