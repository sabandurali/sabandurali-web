// Process-local safeguards for one supervised local pilot, not a billing ledger.
export const CLAUDE_MODEL = "claude-haiku-5-5";
export const MAX_INPUT_TOKENS = 6000;
export const MAX_OUTPUT_TOKENS = 800;
export const CALL_RESERVE_USD = 0.0015;
export const MAX_CONTEXT_BYTES = 24000;
export const DEADLINE_MS = 20000;
export function estimatedCostUsd(input: number, output: number) {
  // Standard first-party rates checked 2026-10-18; no cache, batch or tools.
  return (input * 0.1 + output * 0.5) / 1_000_000;
}
export function pilotConfig(env: NodeJS.ProcessEnv, now = Date.now()) {
  const expires = Date.parse(env.ASSISTANT_CLAUDE_APPROVED_UNTIL ?? "");
  const budget = Number(env.ASSISTANT_CLAUDE_BUDGET_USD);
  const calls = Number(env.ASSISTANT_CLAUDE_MAX_CALLS);
  if (env.VERCEL || env.ASSISTANT_ENABLE_CLAUDE !== "true" ||
      env.ASSISTANT_CLAUDE_PILOT !== "local" || !env.ANTHROPIC_API_KEY?.trim() ||
      env.ANTHROPIC_MODEL !== CLAUDE_MODEL || !Number.isFinite(expires) ||
      expires <= now || expires - now > 86400000 ||
      !Number.isFinite(budget) || budget < CALL_RESERVE_USD || budget > 1 ||
      !Number.isInteger(calls) || calls < 1 || calls > 100) return null;
  return { expires, budget, calls };
}
export class PilotLimitError extends Error {}
export function createPilotGuard() {
  let busy = false;
  let attempts = 0;
  let reserved = 0;
  let recent: number[] = [];
  return (config: NonNullable<ReturnType<typeof pilotConfig>>, now = Date.now()) => {
    recent = recent.filter(t => now - t < 60000);
    if (now >= config.expires || busy || recent.length >= 5 ||
        attempts >= config.calls || reserved + CALL_RESERVE_USD > config.budget + 1e-12)
      throw new PilotLimitError("Pilot limit reached");
    busy = true;
    attempts++;
    reserved += CALL_RESERVE_USD; // Failed/aborted requests are never refunded or retried.
    recent.push(now);
    return () => { busy = false; };
  };
}
export const pilotGuard = createPilotGuard();
