/**
 * Fail-soft sections keep an ISR route up when a supporting query fails:
 * the district page shows "temporarily unavailable", the sitemap leaves a
 * source out. That degraded result must not become the cached page for the
 * next hour, though, because nothing but a CMS write or the hourly pass
 * would replace it.
 *
 * Throwing while Next regenerates a cached route keeps the last successful
 * render in the cache and retries on the next request
 * (node_modules/next/dist/docs/01-app/02-guides/incremental-static-regeneration.md,
 * "Handling uncaught exceptions"). So on a production server a degraded
 * render is refused. During `next build` there is no previous render to
 * keep, and `next dev` caches nothing, so there the degraded render stays:
 * the page still renders, exactly as before.
 *
 * Use it only on routes that are always regenerated into the ISR cache
 * (`export const revalidate`, no request-time APIs). On a route rendered per
 * request it would turn a degraded page into an error page.
 */
export class DegradedRenderError extends Error {
  override name = "DegradedRenderError";
}

type RenderEnv = Readonly<Record<string, string | undefined>>;

/** Whether a render here would replace a previous, cached one. */
export function rendersOverCachedResult(env: RenderEnv = process.env): boolean {
  return (
    env.NODE_ENV === "production" && env.NEXT_PHASE !== "phase-production-build"
  );
}

/** Throws when `failed` is not empty and the render would be cached. */
export function refuseDegradedCachedRender(
  route: string,
  failed: readonly string[],
  env: RenderEnv = process.env,
): void {
  if (failed.length === 0 || !rendersOverCachedResult(env)) return;
  throw new DegradedRenderError(
    `${route}: ${failed.join(", ")} unavailable; the previous cached render is kept`,
  );
}
