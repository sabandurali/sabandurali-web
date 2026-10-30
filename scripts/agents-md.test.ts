import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);

type AgentFiles = { hasCurrentAgentRules: (directory: string) => boolean };

function isAgentFiles(value: unknown): value is AgentFiles {
  return (
    typeof value === "object" &&
    value !== null &&
    "hasCurrentAgentRules" in value &&
    typeof value.hasCurrentAgentRules === "function"
  );
}

// `next dev` rewrites the managed block in AGENTS.md whenever it differs from
// the block of the installed Next.js (`agentRules` is on by default). The
// committed block must therefore be the current one, or every dev run leaves
// an unrelated change in the working tree. After a Next.js upgrade, run
// `next dev` once (or the generator below) and commit AGENTS.md.
test("AGENTS.md carries the agent rules block of the installed Next.js", () => {
  const agentFiles: unknown = require("next/dist/server/lib/generate-agent-files.js");
  assert.ok(isAgentFiles(agentFiles), "Next.js agent file generator not found");
  assert.equal(agentFiles.hasCurrentAgentRules(process.cwd()), true);
});

test("AGENTS.md keeps the project pointer outside the managed block", () => {
  const agents = readFileSync("AGENTS.md", "utf8");
  const end = agents.indexOf("<!-- END:nextjs-agent-rules -->");
  assert.ok(end > 0);
  assert.match(agents.slice(end), /live in `CLAUDE\.md`/);
});
