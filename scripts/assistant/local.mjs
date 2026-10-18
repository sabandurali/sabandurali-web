// Repeatable local-only entry point. No inherited credentials or .env files.
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
const command = process.argv[2];
if (!["build", "start", "dev", "test", "types", "lint"].includes(command))
  throw new Error("Use build, start, dev, test, types or lint");
if (
  readdirSync(".").some(
    (name) => /^\.env($|\.)/.test(name) && !name.endsWith(".example"),
  )
)
  throw new Error(
    "Isolated commands require a worktree without environment files",
  );
const env = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  TMPDIR: process.env.TMPDIR,
  NEXT_TELEMETRY_DISABLED: "1",
  PAYLOAD_DATABASE: "sqlite",
  PAYLOAD_STORAGE: "local",
  DATABASE_URL: "file::memory:",
  PAYLOAD_SECRET: randomBytes(32).toString("hex"),
  ASSISTANT_ENABLE_CLAUDE: "false",
  PAGE_PUBLIC_SOURCE: "static",
  NAVIGATION_PUBLIC_SOURCE: "static",
  ARTICLE_PUBLIC_SOURCE: "static",
  BOOK_PUBLIC_SOURCE: "static",
  PHOTO_PUBLIC_SOURCE: "static",
};
const args =
  command === "types"
    ? ["node_modules/typescript/bin/tsc", "--noEmit"]
    : command === "lint"
      ? ["node_modules/eslint/bin/eslint.js", "."]
      : command === "test"
        ? ["--import", "tsx", "--test", "scripts/assistant/research.test.ts"]
        : [
            "node_modules/next/dist/bin/next",
            command,
            ...(command === "build"
              ? []
              : ["--hostname", "127.0.0.1", "--port", "3215"]),
          ];
const child = spawn(process.execPath, args, { env, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
