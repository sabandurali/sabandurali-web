// Repeatable local-only entry point. No inherited credentials or .env files.
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
const command = process.argv[2];
if (!["build", "start", "dev", "test", "types", "lint", "pilot"].includes(command))
  throw new Error("Use build, start, dev, test, types, lint or pilot");
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
if (command === "pilot") {
  // These settings must be supplied only after explicit spending approval. No .env reads.
  for (const key of ["ASSISTANT_ENABLE_CLAUDE", "ASSISTANT_CLAUDE_PILOT", "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL",
    "ASSISTANT_CLAUDE_APPROVED_UNTIL", "ASSISTANT_CLAUDE_BUDGET_USD", "ASSISTANT_CLAUDE_MAX_CALLS"]) {
    if (!process.env[key]) throw new Error(`Missing approved pilot setting: ${key}`);
    env[key] = process.env[key];
  }
  if (process.env.VERCEL || env.ASSISTANT_ENABLE_CLAUDE !== "true" || env.ASSISTANT_CLAUDE_PILOT !== "local")
    throw new Error("Pilot requires an approved local session");
}
const args =
  command === "types"
    ? ["node_modules/typescript/bin/tsc", "--noEmit"]
    : command === "lint"
      ? ["node_modules/eslint/bin/eslint.js", "."]
      : command === "test"
        ? ["--import", "./scripts/assistant/test-runtime.mjs", "--import", "tsx", "--test", "scripts/assistant/research.test.ts", "scripts/assistant/pilot.test.ts"]
        : [
            "node_modules/next/dist/bin/next",
            command === "pilot" ? "start" : command,
            ...(command === "build"
              ? []
              : ["--hostname", "127.0.0.1", "--port", "3215"]),
          ];
const child = spawn(process.execPath, args, { env, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
