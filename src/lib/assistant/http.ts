import { allowedPreviewHosts, isAssistantPreview } from "./environment";
import { answerFromPassages, parseInput, selectPassages } from "./research";
import { claudeConfigured, selectWithClaude } from "./claude";

export function createLimiter(limit = 20, windowMs = 60000) {
  let start = 0;
  let count = 0;
  return (now = Date.now()) => {
    if (now - start >= windowMs) {
      start = now;
      count = 0;
    }
    return ++count <= limit;
  };
}
const allow = createLimiter(); // Process-wide cap; local prototype, not a distributed/public quota.
const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
function reply(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(status === 429 ? { "Retry-After": "60" } : {}),
    },
  });
}
export async function handleResearch(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
  quota = allow,
  transport: typeof fetch = fetch,
) {
  const url = new URL(request.url);
  const preview = isAssistantPreview(env);
  const host = request.headers.get("host") ?? url.host;
  const trustedHost = preview
    ? allowedPreviewHosts(env).includes(host) && url.protocol === "https:"
    : !env.VERCEL && localHosts.has(url.hostname) && /^(localhost|127\.0\.0\.1|\[::1\])(?::[0-9]{1,5})?$/.test(host);
  if (!trustedHost) return reply({ error: "İstek kaynağı doğrulanamadı." }, 403);
  let expectedOrigin: string;
  try {
    expectedOrigin = new URL(`${url.protocol}//${host}`).origin;
  } catch {
    return reply({ error: "İstek kaynağı doğrulanamadı." }, 403);
  }
  if (request.headers.get("origin") !== expectedOrigin)
    return reply({ error: "İstek kaynağı doğrulanamadı." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return reply({ error: "JSON bekleniyor." }, 415);
  if (!quota())
    return reply(
      { error: "Kullanım sınırına ulaşıldı. Bir dakika sonra tekrar deneyin." },
      429,
    );
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "Soru gerekli." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4096) {
        await reader.cancel();
        return reply({ error: "İstek çok uzun." }, 413);
      }
      chunks.push(value);
    }
    let input;
    try {
      input = parseInput(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    } catch {
      return reply(
        { error: "4–600 karakterlik soru ve en fazla iki farklı ilçe seçin." },
        400,
      );
    }
    const candidates = selectPassages(input);
    if (preview || !claudeConfigured(env) || !candidates.length)
      return reply(answerFromPassages(input, candidates));
    try {
      const selected = await selectWithClaude(
        input.question,
        candidates,
        env,
        transport,
      );
      return reply(answerFromPassages(input, selected, "claude"));
    } catch {
      return reply(
        {
          error:
            "Claude yanıtı alınamadı veya kaynak doğrulamasından geçmedi. Sonuç gösterilmedi; daha sonra tekrar deneyin.",
        },
        502,
      );
    }
  } catch {
    return reply({ error: "İstek okunamadı. Lütfen yeniden deneyin." }, 400);
  }
}
