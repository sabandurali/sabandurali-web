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
 * - `form-action 'self' https://formspree.io`: native form submissions go to
 *   this origin or to Formspree only. The contact form normally sends with
 *   `fetch()` (which `form-action` does not govern), but before hydration or
 *   without JavaScript the browser submits the `<form>` natively to
 *   `https://formspree.io/f/<id>` (`getFormspreeEndpoint`). Without the
 *   Formspree origin here that fallback would be blocked silently.
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
 * A script policy therefore starts as `Content-Security-Policy-Report-Only`
 * on the public routes (see `contentSecurityPolicyReportOnlyDirectives` and
 * `docs/SECURITY.md`). The browser only reports violations of it in the
 * console; it blocks nothing, so it cannot break the site.
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

/** Origin of the contact form's native submission target. */
export const FORMSPREE_ORIGIN = "https://formspree.io";

export const contentSecurityPolicyDirectives: Readonly<
  Record<string, readonly string[]>
> = {
  "base-uri": ["'self'"],
  "form-action": ["'self'", FORMSPREE_ORIGIN],
  "frame-ancestors": ["'none'"],
  "object-src": ["'none'"],
};

/**
 * The Vercel toolbar (Preview deployments, comments). Its other sources
 * below follow Vercel's "Managing the toolbar" documentation.
 */
export const VERCEL_TOOLBAR_ORIGIN = "https://vercel.live";

/** Public Vercel Blob stores, where production media may be read from. */
export const VERCEL_BLOB_SOURCE = "https://*.public.blob.vercel-storage.com";

/**
 * Candidate full policy for the public routes, sent as
 * `Content-Security-Policy-Report-Only` so violations show up without
 * blocking anything. It keeps every enforced directive and adds the fetch
 * directives the public site was checked against: Next.js hydration needs
 * inline scripts and styles (no nonces, because pages are statically
 * rendered), fonts are self-hosted by `next/font`, images come from this
 * origin or Vercel Blob, and the contact form posts to Formspree.
 *
 * The next steps (nonce or SRI based `script-src`, a reporting endpoint,
 * enforcing) are in `docs/SECURITY.md`.
 */
export const contentSecurityPolicyReportOnlyDirectives: Readonly<
  Record<string, readonly string[]>
> = {
  ...contentSecurityPolicyDirectives,
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", VERCEL_TOOLBAR_ORIGIN],
  "style-src": ["'self'", "'unsafe-inline'", VERCEL_TOOLBAR_ORIGIN],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    VERCEL_BLOB_SOURCE,
    VERCEL_TOOLBAR_ORIGIN,
    "https://vercel.com",
  ],
  "font-src": ["'self'", VERCEL_TOOLBAR_ORIGIN, "https://assets.vercel.com"],
  "connect-src": [
    "'self'",
    FORMSPREE_ORIGIN,
    VERCEL_TOOLBAR_ORIGIN,
    "wss://ws-us3.pusher.com",
  ],
  "media-src": ["'self'", VERCEL_BLOB_SOURCE],
  "frame-src": [VERCEL_TOOLBAR_ORIGIN],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
};

/** Where the Payload admin loads Monaco (JSON and code fields) from. */
export const MONACO_CDN_ORIGIN = "https://cdn.jsdelivr.net";

/**
 * Candidate report-only policy for the Payload admin (`docs/SECURITY.md` §2,
 * step 5). It is not sent yet: `scripts/security-headers-check.mjs` expects
 * no report-only header on `/admin`, so wiring it up in `next.config.ts`
 * and updating that check belong in one change.
 *
 * Measured on 2026-10-29 against a local production build with Chrome
 * (login, dashboard, collection lists, create views with Lexical typing,
 * the district guide JSON field in Monaco, media upload view, the
 * Navigation global, the account view): no violation once the admin avatar
 * stopped loading Gravatar (`admin.avatar: "default"`). The admin needs the
 * same inline scripts and styles as the public site, so this candidate does
 * not stop an XSS either; it only fences the origins the admin may reach.
 */
export const adminContentSecurityPolicyReportOnlyDirectives: Readonly<
  Record<string, readonly string[]>
> = {
  ...contentSecurityPolicyReportOnlyDirectives,
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    MONACO_CDN_ORIGIN,
    VERCEL_TOOLBAR_ORIGIN,
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'",
    MONACO_CDN_ORIGIN,
    VERCEL_TOOLBAR_ORIGIN,
  ],
  "font-src": [
    "'self'",
    "data:",
    MONACO_CDN_ORIGIN,
    VERCEL_TOOLBAR_ORIGIN,
    "https://assets.vercel.com",
  ],
  "connect-src": [
    "'self'",
    MONACO_CDN_ORIGIN,
    VERCEL_TOOLBAR_ORIGIN,
    "wss://ws-us3.pusher.com",
  ],
  "media-src": ["'self'", "blob:", VERCEL_BLOB_SOURCE],
};

/**
 * Every route except the Payload admin, the API and the image optimizer
 * (which sends its own sandbox policy). The admin needs Monaco from
 * cdn.jsdelivr.net and workers and gets its own policy later.
 * `path-to-regexp` syntax as used by `next.config.ts` `headers()`.
 */
export const PUBLIC_ROUTES_SOURCE =
  "/:path((?!admin(?:/|$)|api(?:/|$)|_next/image(?:/|$)).*)";

export const publicRouteSecurityHeaders: readonly SecurityHeader[] = [
  {
    key: "Content-Security-Policy-Report-Only",
    value: serializeContentSecurityPolicy(
      contentSecurityPolicyReportOnlyDirectives,
    ),
  },
];

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
