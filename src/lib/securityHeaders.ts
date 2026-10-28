/**
 * HTTP security headers sent on every route (wired up in `next.config.ts`).
 *
 * The Content-Security-Policy only restricts directives that were verified not
 * to break the public site, the Payload admin or Vercel:
 *
 * - `frame-ancestors 'none'` (and `X-Frame-Options: DENY` for older browsers):
 *   nothing frames this site. Payload live preview, the only feature that
 *   would load the site inside `/admin`, is not configured, and Payload UI uses
 *   iframes for nothing else.
 * - `object-src 'none'`: no `<object>` or `<embed>` is rendered.
 * - `base-uri 'self'`: blocks `<base>` injection.
 * - `form-action 'self'`: native form submissions stay on this origin. The
 *   contact form posts to Formspree with `fetch()`, which `form-action` does
 *   not govern.
 *
 * It deliberately sets no `default-src`, `script-src`, `style-src`, `img-src`,
 * `connect-src`, `worker-src` or `frame-src`:
 *
 * - Next.js App Router hydrates statically rendered pages with inline scripts,
 *   so a script policy needs per-request nonces (dynamic rendering for every
 *   page) or the experimental SRI build mode.
 * - The Payload admin loads Monaco from cdn.jsdelivr.net and runs it in workers.
 * - Vercel Preview deployments inject the toolbar from vercel.live (script,
 *   frame, image and connect requests).
 * - Media is served from `/api/media/file/**` and Vercel Blob.
 *
 * A script policy must therefore start as `Content-Security-Policy-Report-Only`
 * and be verified against the admin and a Preview deployment first.
 *
 * `upgrade-insecure-requests` is left out: every asset is already served over
 * HTTPS, and the directive breaks `next start` over plain HTTP on localhost in
 * Safari.
 *
 * The image optimizer (`/_next/image`) replaces this policy with its own
 * sandboxed one (`images.contentSecurityPolicy`).
 */

export type SecurityHeader = {
  readonly key: string;
  readonly value: string;
};

export const contentSecurityPolicyDirectives: Readonly<
  Record<string, readonly string[]>
> = {
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "object-src": ["'none'"],
};

/** Powerful browser features the site never uses; all are denied. */
export const deniedBrowserFeatures: readonly string[] = [
  "accelerometer",
  "camera",
  "display-capture",
  "geolocation",
  "gyroscope",
  "hid",
  "magnetometer",
  "microphone",
  "midi",
  "payment",
  "publickey-credentials-get",
  "screen-wake-lock",
  "serial",
  "usb",
  "xr-spatial-tracking",
];

/**
 * Vercel already sends `max-age=63072000` without `includeSubDomains`
 * (checked 2026-10-28). The bare domain redirects to `www` at Vercel's edge,
 * so `includeSubDomains` here only covers hosts below `www.sabandurali.com`.
 * `preload` is an owner decision: it is hard to undo and needs the bare domain
 * to send the header too.
 */
export const strictTransportSecurity = "max-age=63072000; includeSubDomains";

export function serializeContentSecurityPolicy(
  directives: Readonly<Record<string, readonly string[]>>,
): string {
  return Object.entries(directives)
    .map(([directive, sources]) => [directive, ...sources].join(" "))
    .join("; ");
}

export const securityHeaders: readonly SecurityHeader[] = [
  {
    key: "Content-Security-Policy",
    value: serializeContentSecurityPolicy(contentSecurityPolicyDirectives),
  },
  {
    key: "Permissions-Policy",
    value: deniedBrowserFeatures.map((feature) => `${feature}=()`).join(", "),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: strictTransportSecurity },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
];
