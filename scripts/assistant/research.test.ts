import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../../src/content/assistant/public-guides.json";
import {
  catalogue,
  parseInput,
  selectPassages,
  validateSelection,
  safeSourceUrl,
} from "../../src/lib/assistant/research";
import { createLimiter, handleResearch } from "../../src/lib/assistant/http";
import { selectWithClaude } from "../../src/lib/assistant/claude";
const input = {
  question: "Kadıköy ve Beşiktaş ulaşım ve yaşam karşılaştırması",
  districts: ["kadikoy", "besiktas"],
};
const passages = selectPassages(input);
const localEnv = { NODE_ENV: "test" } as NodeJS.ProcessEnv;
const claudeEnv = {
  ...localEnv,
  ASSISTANT_ENABLE_CLAUDE: "true",
  ANTHROPIC_API_KEY: "test-only-not-a-key",
  ANTHROPIC_MODEL: "mock-model",
};
const request = (
  body: unknown = input,
  origin = "http://localhost:3215",
  url = "http://localhost:3215/api/research-assistant",
) =>
  new Request(url, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const neverFetch: typeof fetch = async () => {
  throw new Error("Unexpected network request");
};

test("snapshot contains all 39 registry districts, only approved public fields", () => {
  assert.equal(snapshot.guides.length, 39);
  assert.deepEqual(
    snapshot.guides.map((g) => g.slug).sort(),
    catalogue.map((d) => d.slug).sort(),
  );
  for (const g of snapshot.guides) {
    assert(Number.isFinite(Date.parse(g.updatedAt)));
    assert.deepEqual(
      Object.keys(g).sort(),
      ["slug", "url", "updatedAt", "publishedAt", "sections", "sources"].sort(),
    );
    assert(g.sources.length > 0);
  }
});
test("every source is a safe public URL with traceable editorial metadata", () => {
  for (const g of snapshot.guides)
    for (const s of g.sources) {
      assert(safeSourceUrl(s.url));
      assert(s.title);
      assert(s.publisher);
      assert(Number.isFinite(Date.parse(s.checkedAt!)));
    }
});
test("input bounds, unknown districts, duplicate districts and malformed objects are rejected", () => {
  for (const v of [
    null,
    {},
    { question: "a", districts: ["fatih"] },
    { question: "x".repeat(601), districts: ["fatih"] },
    { ...input, districts: ["unknown"] },
    { ...input, districts: ["fatih", "fatih"] },
    { ...input, districts: ["fatih", "kadikoy", "besiktas"] },
  ])
    assert.throws(() => parseInput(v));
});
test("comparison retrieves evidence from both requested districts", () => {
  assert.deepEqual(
    new Set(passages.map((p) => p.district)),
    new Set(input.districts),
  );
  for (const p of passages) {
    assert(p.sources.length);
    assert.equal(
      p.text,
      (
        snapshot.guides.find((g) => g.slug === p.district)!.sections as Record<
          string,
          string
        >
      )[p.section],
    );
  }
});
test("each of 39 guides has a source-backed general overview", () => {
  for (const g of snapshot.guides)
    assert(
      selectPassages({ question: "Genel özet", districts: [g.slug] }).length >
        0,
      g.slug,
    );
});
for (const question of [
  "Güncel kira fiyatı nedir?",
  "Nüfus kaç kişi?",
  "Deprem açısından en güvenli ilçe?",
  "Yatırım getirisi garantili mi?",
  "Bugün metro seferleri?",
  "Bitcoin hangi yöne gidecek?",
])
  test(`unsupported question abstains: ${question}`, () =>
    assert.deepEqual(selectPassages({ question, districts: ["kadikoy"] }), []));
test("unsafe links cannot become citations", () => {
  for (const u of [
    "javascript:alert(1)",
    "file:///etc/passwd",
    "https://user:pass@example.com",
    "http://localhost/a",
    "http://127.0.0.1",
  ])
    assert.equal(safeSourceUrl(u), false);
});
test("hallucinated IDs, invalid JSON, duplicate and one-sided model selections rejected", () => {
  for (const value of [
    "not json",
    '{"ids":["invented"]}',
    JSON.stringify({ ids: [passages[0].id, passages[0].id] }),
    JSON.stringify({ ids: [passages[0].id] }),
  ])
    assert.throws(() => validateSelection(value, passages));
});
test("valid model selection renders only original excerpts", () => {
  const ids = input.districts.map(
    (d) => passages.find((p) => p.district === d)!.id,
  );
  const selected = validateSelection(
    JSON.stringify({ ids, extra: "Fabricated 999999 price" }),
    passages,
  );
  assert.equal(selected.length, 2);
  assert(selected.every((p) => passages.includes(p)));
});
test("limiter denies after cap and resets after window", () => {
  const allow = createLimiter(2, 100);
  assert(allow(1000));
  assert(allow(1001));
  assert(!allow(1002));
  assert(allow(1100));
});
test("local endpoint returns explicitly labeled local evidence without network", async () => {
  const res = await handleResearch(request(), localEnv, () => true, neverFetch);
  assert.equal(res.status, 200);
  const b = await res.json();
  assert.equal(b.mode, "local");
  assert.match(b.message, /Claude çağrısı yapılmadı/);
  assert(b.passages.length);
});
test("a key alone never enables paid API", async () => {
  const res = await handleResearch(
    request(),
    { ...localEnv, ANTHROPIC_API_KEY: "test-only" },
    () => true,
    neverFetch,
  );
  assert.equal((await res.json()).mode, "local");
});
test("cross-origin, remote and Vercel execution are denied", async () => {
  assert.equal(
    (await handleResearch(request(input, "https://evil.test"), localEnv))
      .status,
    403,
  );
  assert.equal(
    (
      await handleResearch(
        request(
          input,
          "https://example.com",
          "https://example.com/api/research-assistant",
        ),
        localEnv,
      )
    ).status,
    403,
  );
  assert.equal(
    (await handleResearch(request(), { ...localEnv, VERCEL: "1" })).status,
    403,
  );
});
test("JSON validation, oversized body and rate limit use distinct errors", async () => {
  assert.equal(
    (await handleResearch(request({ question: "x" }), localEnv, () => true))
      .status,
    400,
  );
  assert.equal(
    (await handleResearch(request("x".repeat(5000)), localEnv, () => true))
      .status,
    413,
  );
  assert.equal(
    (await handleResearch(request(), localEnv, () => false)).status,
    429,
  );
  const r = new Request("http://localhost:3215/api/research-assistant", {
    method: "POST",
    headers: { origin: "http://localhost:3215" },
    body: "hello",
  });
  assert.equal((await handleResearch(r, localEnv)).status, 415);
});
test("Claude request is bounded, server authenticated, and receives only selected public excerpts", async () => {
  let called = 0;
  const mock: typeof fetch = async (url, options) => {
    called++;
    assert.equal(url, "https://api.anthropic.com/v1/messages");
    assert(options?.signal);
    assert.equal(options?.redirect, "error");
    const body = JSON.parse(options?.body as string);
    assert.equal(body.max_tokens, 400);
    assert.equal(body.model, "mock-model");
    const context = JSON.parse(body.messages[0].content);
    assert.equal(context.passages.length, passages.length);
    assert(
      context.passages.every(
        (p: Record<string, unknown>) =>
          Object.keys(p).sort().join(",") === "id,text,updatedAt",
      ),
    );
    return Response.json({
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: JSON.stringify({
            ids: input.districts.map(
              (d) => passages.find((p) => p.district === d)!.id,
            ),
          }),
        },
      ],
    });
  };
  const selected = await selectWithClaude(
    input.question,
    passages,
    claudeEnv,
    mock,
  );
  assert.equal(called, 1);
  assert.equal(selected.length, 2);
});
test("API failure, timeout, truncated and fabricated output fail closed without leaking details", async () => {
  for (const mock of [
    async () => new Response("secret-upstream-text", { status: 429 }),
    async () => {
      throw new Error("secret-upstream-text");
    },
    async () => Response.json({ stop_reason: "max_tokens", content: [] }),
    async () =>
      Response.json({
        stop_reason: "end_turn",
        content: [{ type: "text", text: '{"ids":["made-up"]}' }],
      }),
  ]) {
    const res = await handleResearch(
      request(),
      claudeEnv,
      () => true,
      mock as typeof fetch,
    );
    assert.equal(res.status, 502);
    assert(!(await res.text()).includes("secret-upstream-text"));
  }
});
test("unsupported questions do not invoke Claude even when enabled", async () => {
  const res = await handleResearch(
    request({ ...input, question: "Güncel kira fiyatları" }),
    claudeEnv,
    () => true,
    neverFetch,
  );
  assert.equal((await res.json()).passages.length, 0);
});

test("Next localhost normalization still accepts the actual loopback Host origin", async () => {
  const r = new Request("http://localhost:3215/api/research-assistant", {
    method: "POST",
    headers: {
      host: "127.0.0.1:3215",
      origin: "http://127.0.0.1:3215",
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
  assert.equal(
    (await handleResearch(r, localEnv, () => true, neverFetch)).status,
    200,
  );
});

test("malformed Host ports fail closed", async () => {
  const r = new Request("http://localhost:3215/api/research-assistant", {
    method: "POST",
    headers: {
      host: "localhost:99999",
      origin: "http://localhost:3215",
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
  assert.equal(
    (await handleResearch(r, localEnv, () => true, neverFetch)).status,
    403,
  );
});

const previewEnv = { ...localEnv, VERCEL: "1", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "codex/istanbul-research-assistant", ASSISTANT_DEMO_ONLY: "true", VERCEL_URL: "demo-test.vercel.app", VERCEL_BRANCH_URL: "demo-branch.vercel.app" };
test("only approved Preview hosts return free evidence even with accidental Claude credentials", async () => {
  for (const host of [previewEnv.VERCEL_URL, previewEnv.VERCEL_BRANCH_URL]) {
    const res = await handleResearch(request(input, `https://${host}`, `https://${host}/api/research-assistant`), { ...claudeEnv, ...previewEnv }, () => true, neverFetch);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).mode, "local");
  }
});
test("Production, other branches, missing flag and untrusted Preview hosts fail closed", async () => {
  for (const override of [{ VERCEL_ENV: "production" }, { VERCEL_GIT_COMMIT_REF: "main" }, { ASSISTANT_DEMO_ONLY: "false" }, { VERCEL_URL: "other.vercel.app" }]) {
    const res = await handleResearch(request(input, "https://demo-test.vercel.app", "https://demo-test.vercel.app/api/research-assistant"), { ...previewEnv, ...override }, () => true, neverFetch);
    assert.equal(res.status, 403);
  }
  assert.equal((await handleResearch(request(input, "https://evil.test", "https://demo-test.vercel.app/api/research-assistant"), previewEnv, () => true, neverFetch)).status, 403);
});

import { demoPathAllowed } from "../../src/lib/assistant/environment";
import { mapDistrictGuide } from "../../src/content/districts/district-guide-projection";
import editorial from "../../data/districts/editorial.json";
test("CMS/admin and unrelated paths are absent from the Preview allowlist", () => {
  for (const path of ["/admin", "/admin/create-first-user", "/api/articles", "/api/graphql", "/api/media/file/x", "/istanbul/ilceler/fatih"])
    assert.equal(demoPathAllowed(path), false);
  for (const path of ["/istanbul-asistani", "/en/istanbul-research-assistant", "/api/research-assistant", "/_next/static/test.js"])
    assert.equal(demoPathAllowed(path), true);
});
test("existing public policy explains all 402 to 391 sources without modifying guides", () => {
  assert.equal(editorial.districts.reduce((n, d) => n + d.sources.length, 0), 402);
  let count = 0;
  for (const d of editorial.districts) {
    const sources = mapDistrictGuide(d, Date.parse(snapshot.retrievedAt))!.sources;
    count += sources.length;
    assert.deepEqual(sources.map(s => s.url).sort(), snapshot.guides.find(g => g.slug === d.district)!.sources.map(s => s.url).sort());
  }
  assert.equal(count, 391);
});
