import test from "node:test";
import assert from "node:assert/strict";
import { selectWithClaude, claudeConfigured } from "../../src/lib/assistant/claude";
import { selectPassages } from "../../src/lib/assistant/research";
import { handleResearch } from "../../src/lib/assistant/http";
import { CLAUDE_MODEL, createPilotGuard, pilotConfig, PilotLimitError, CALL_RESERVE_USD } from "../../src/lib/assistant/pilot-policy";
const env: NodeJS.ProcessEnv = { NODE_ENV: "test", ASSISTANT_ENABLE_CLAUDE: "true",
  ASSISTANT_CLAUDE_PILOT: "local", ANTHROPIC_API_KEY: "test-only-not-a-key", ANTHROPIC_MODEL: CLAUDE_MODEL,
  ASSISTANT_CLAUDE_APPROVED_UNTIL: new Date(Date.now() + 3600000).toISOString(),
  ASSISTANT_CLAUDE_BUDGET_USD: "0.10", ASSISTANT_CLAUDE_MAX_CALLS: "20" };
const input = { question: "Ulaşım nasıl?", districts: ["kadikoy"] };
const candidates = selectPassages(input);
const neverFetch: typeof fetch = async () => { throw new Error("Network must not execute"); };
function success() { return Response.json({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ ids: [candidates[0].id] }) }], usage: { input_tokens: 3000, output_tokens: 200 } }); }
const good: typeof fetch = async url => String(url).endsWith("count_tokens") ? Response.json({ input_tokens: 3000 }) : success();
test("explicit, unexpired, bounded local spending approval is mandatory", () => {
  assert(claudeConfigured(env));
  for (const override of [{ ASSISTANT_ENABLE_CLAUDE: "false" }, { ASSISTANT_CLAUDE_PILOT: "" },
    { ANTHROPIC_API_KEY: "" }, { ANTHROPIC_MODEL: "unknown" }, { VERCEL: "1" },
    { ASSISTANT_CLAUDE_APPROVED_UNTIL: new Date(0).toISOString() },
    { ASSISTANT_CLAUDE_APPROVED_UNTIL: new Date(Date.now() + 172800000).toISOString() },
    { ASSISTANT_CLAUDE_BUDGET_USD: "NaN" }, { ASSISTANT_CLAUDE_BUDGET_USD: "2" },
    { ASSISTANT_CLAUDE_BUDGET_USD: "0" }, { ASSISTANT_CLAUDE_MAX_CALLS: "101" },
    { ASSISTANT_CLAUDE_MAX_CALLS: "1.5" }]) assert.equal(claudeConfigured({ ...env, ...override }), false);
});
test("disabled model performs zero transport calls", async () => {
  await assert.rejects(selectWithClaude(input.question, candidates, { ...env, ASSISTANT_ENABLE_CLAUDE: "false" }, neverFetch));
});
test("guard enforces concurrency, session call count and no refunds", () => {
  const guard = createPilotGuard(); const config = { ...pilotConfig(env)!, calls: 1 };
  const release = guard(config); assert.throws(() => guard(config), PilotLimitError);
  release(); assert.throws(() => guard(config), PilotLimitError);
});
test("guard enforces conservative estimated budget and expires approval", () => {
  const guard = createPilotGuard(); const config = { ...pilotConfig(env)!, budget: CALL_RESERVE_USD };
  guard(config)(); assert.throws(() => guard(config), PilotLimitError);
  assert.throws(() => createPilotGuard()(config, config.expires), PilotLimitError);
});
test("five attempts per minute, then window reset without session reset", () => {
  const guard = createPilotGuard(); const config = pilotConfig(env)!; const now = Date.now();
  for (let i = 0; i < 5; i++) guard(config, now + i)();
  assert.throws(() => guard(config, now + 5), PilotLimitError);
  guard(config, now + 60001)();
});
test("count over limit or malformed prevents paid request", async () => {
  for (const count of [6001, -1, "3000", null]) {
    let calls = 0;
    await assert.rejects(selectWithClaude(input.question, candidates, env, async url => {
      calls++; assert(String(url).endsWith("count_tokens")); return Response.json({ input_tokens: count });
    }, createPilotGuard()));
    assert.equal(calls, 1);
  }
});
test("oversized or unsafe evidence fails before transport", async () => {
  await assert.rejects(selectWithClaude(input.question, [{ ...candidates[0], text: "x".repeat(24001) }], env, neverFetch));
  await assert.rejects(selectWithClaude(input.question, [{ ...candidates[0], sources: [{ ...candidates[0].sources[0], url: "http://127.0.0.1" }] }], env, neverFetch));
});
test("provider errors never automatically retry", async () => {
  let calls = 0;
  await assert.rejects(selectWithClaude(input.question, candidates, env, async () => { calls++; return new Response("private error", { status: 429 }); }, createPilotGuard()));
  assert.equal(calls, 1);
});
test("caller cancellation before count and between count/generation prevents paid call", async () => {
  const before = new AbortController(); before.abort();
  await assert.rejects(selectWithClaude(input.question, candidates, env, neverFetch, createPilotGuard(), before.signal));
  const during = new AbortController(); let calls = 0;
  await assert.rejects(selectWithClaude(input.question, candidates, env, async () => {
    calls++; during.abort(); return Response.json({ input_tokens: 3000 });
  }, createPilotGuard(), during.signal));
  assert.equal(calls, 1);
});
test("one shared deadline covers count and generation with no redirect or cache", async () => {
  let signal: AbortSignal | null | undefined;
  await selectWithClaude(input.question, candidates, env, async (url, options) => {
    if (!signal) signal = options?.signal;
    else assert.equal(options?.signal, signal);
    assert.equal(options?.redirect, "error"); assert.equal(options?.cache, "no-store");
    assert.equal((options?.headers as Record<string, string>)["x-api-key"], env.ANTHROPIC_API_KEY);
    return good(url, options);
  }, createPilotGuard());
});
test("oversized, refused, malformed and missing usage outputs are rejected", async () => {
  for (const response of [new Response("x".repeat(32769)), Response.json({ stop_reason: "refusal" }),
    Response.json({ stop_reason: "end_turn", content: [{ type: "text", text: '{"ids":[]}' }] })]) {
    await assert.rejects(selectWithClaude(input.question, candidates, env,
      async url => String(url).endsWith("count_tokens") ? Response.json({ input_tokens: 3000 }) : response, createPilotGuard()));
  }
});
test("real-mode HTTP contract returns grounded excerpts and usage, never credentials", async () => {
  const request = new Request("http://localhost:3215/api/research-assistant", { method: "POST", headers: { origin: "http://localhost:3215", "content-type": "application/json" }, body: JSON.stringify(input) });
  const res = await handleResearch(request, env, () => true, good, createPilotGuard());
  assert.equal(res.status, 200); const body = await res.json();
  assert.equal(body.mode, "claude"); assert.equal(body.passages[0].text, candidates[0].text);
  assert.equal(body.usage.model, CLAUDE_MODEL); assert.equal(body.usage.estimatedCostUsd, 0.0004);
  assert(!JSON.stringify(body).includes(env.ANTHROPIC_API_KEY!));
});
test("unsupported question costs nothing even under live pilot settings", async () => {
  const req = new Request("http://localhost:3215/api/research-assistant", { method: "POST", headers: { origin: "http://localhost:3215", "content-type": "application/json" }, body: JSON.stringify({ ...input, question: "Güncel konut fiyatları?" }) });
  const res = await handleResearch(req, env, () => true, neverFetch, createPilotGuard());
  assert.equal((await res.json()).passages.length, 0);
});

test("actual 20 second deadline rejects a stalled transport without a retry", { timeout: 25000 }, async () => {
  let calls = 0;
  // Node's AbortSignal timer is unref'ed; keep this isolated test alive until it fires.
  const keepAlive = setTimeout(() => {}, 24000);
  try {
    await assert.rejects(selectWithClaude(input.question, candidates, env, async () => {
      calls++; return new Promise<Response>(() => {});
    }, createPilotGuard()), /cancelled/);
    assert.equal(calls, 1);
  } finally { clearTimeout(keepAlive); }
});
test("Preview responses suppress referrers while retaining route isolation", async () => {
  const { proxy } = await import("../../src/proxy");
  const { NextRequest } = await import("next/server");
  const overrides = { VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "codex/istanbul-research-assistant", ASSISTANT_DEMO_ONLY: "true" };
  const original = Object.fromEntries(Object.keys(overrides).map(k => [k, process.env[k]]));
  Object.assign(process.env, overrides);
  try {
    const response = proxy(new NextRequest("https://demo-test.vercel.app/istanbul-asistani"));
    assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
    assert.equal(proxy(new NextRequest("https://demo-test.vercel.app/admin")).status, 404);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
