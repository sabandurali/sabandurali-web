export const assistantBranch = "codex/istanbul-research-assistant";
export function isAssistantPreview(env: NodeJS.ProcessEnv = process.env) {
  return env.VERCEL === "1" && env.VERCEL_ENV === "preview" &&
    env.VERCEL_GIT_COMMIT_REF === assistantBranch &&
    env.ASSISTANT_DEMO_ONLY === "true";
}
export function allowedPreviewHosts(env: NodeJS.ProcessEnv) {
  return [env.VERCEL_URL, env.VERCEL_BRANCH_URL].filter(
    (host): host is string => !!host && /^[a-z0-9-]+\.vercel\.app$/.test(host),
  );
}
export function demoPathAllowed(path: string) {
  return ["/istanbul-asistani", "/en/istanbul-research-assistant", "/api/research-assistant", "/favicon.ico", "/icon.png", "/apple-icon.png"].includes(path) ||
    path.startsWith("/_next/static/") || path.startsWith("/brand/");
}
