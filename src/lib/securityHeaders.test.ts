import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import nextConfig from "../../next.config";
import ContactForm from "@/components/forms/ContactForm";
import { getFormspreeEndpoint } from "@/components/forms/contact-submission";
import { contactContent } from "@/content/contactContent";
import {
  FORMSPREE_ORIGIN,
  MONACO_CDN_ORIGIN,
  PUBLIC_ROUTES_SOURCE,
  adminContentSecurityPolicyReportOnlyDirectives,
  contentSecurityPolicyDirectives,
  contentSecurityPolicyReportOnlyDirectives,
  publicRouteSecurityHeaders,
  securityHeaders,
  serializeContentSecurityPolicy,
} from "./securityHeaders";

function parseDirectives(policy: string): Map<string, string[]> {
  return new Map(
    policy
      .split(";")
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive) => {
        const [name, ...sources] = directive.split(/\s+/);
        return [name, sources] as const;
      }),
  );
}

function headerValue(name: string): string {
  const header = securityHeaders.find(
    ({ key }) => key.toLowerCase() === name.toLowerCase(),
  );
  assert.ok(header, `${name} must be configured`);
  return header.value;
}

test("CSP blocks framing, plugins, <base> injection and foreign form targets", () => {
  const directives = parseDirectives(headerValue("Content-Security-Policy"));

  assert.deepEqual(directives.get("frame-ancestors"), ["'none'"]);
  assert.deepEqual(directives.get("object-src"), ["'none'"]);
  assert.deepEqual(directives.get("base-uri"), ["'self'"]);
  // This origin and the contact form's Formspree target, nothing else.
  assert.deepEqual(directives.get("form-action"), [
    "'self'",
    "https://formspree.io",
  ]);
  assert.equal(FORMSPREE_ORIGIN, "https://formspree.io");
});

/** Whether `form-action` admits a native submission to `target`. */
function formActionAllows(
  sources: readonly string[],
  target: URL,
  pageOrigin: string,
): boolean {
  return sources.some((source) =>
    source === "'self'"
      ? target.origin === pageOrigin
      : source === target.origin ||
        (source.endsWith("/") && target.href.startsWith(source)),
  );
}

test("CSP form-action admits the contact form's native (pre-hydration) target", () => {
  const sources = parseDirectives(headerValue("Content-Security-Policy")).get(
    "form-action",
  );
  assert.ok(sources);

  const endpoint = getFormspreeEndpoint("xyzAB_12");
  assert.ok(endpoint);
  // The endpoint helper and the CSP name the same origin.
  assert.equal(new URL(endpoint).origin, FORMSPREE_ORIGIN);

  // What the browser would submit to before hydration or without JavaScript.
  const markup = renderToStaticMarkup(
    h(ContactForm, { content: contactContent.tr, formId: "xyzAB_12" }),
  );
  const action = /<form[^>]*\saction="([^"]+)"/.exec(markup)?.[1];
  assert.ok(action, "the contact form keeps a native submission target");
  assert.ok(
    formActionAllows(sources, new URL(action), "https://www.sabandurali.com"),
    `form-action ${sources.join(" ")} must allow ${action}`,
  );

  // Other foreign targets stay blocked.
  for (const foreign of [
    "https://evil.example/f/xyzAB_12",
    "https://formspree.io.evil.example/f/xyzAB_12",
    "http://formspree.io/f/xyzAB_12",
  ]) {
    assert.equal(
      formActionAllows(
        sources,
        new URL(foreign),
        "https://www.sabandurali.com",
      ),
      false,
      foreign,
    );
  }
});

test("CSP serialization keeps every directive and source", () => {
  assert.equal(
    serializeContentSecurityPolicy({
      "img-src": ["'self'", "data:"],
      "object-src": ["'none'"],
    }),
    "img-src 'self' data:; object-src 'none'",
  );
  assert.equal(
    parseDirectives(headerValue("Content-Security-Policy")).size,
    Object.keys(contentSecurityPolicyDirectives).length,
  );
});

test("legacy and transport headers are strict", () => {
  assert.equal(headerValue("X-Frame-Options"), "DENY");
  assert.equal(headerValue("X-Content-Type-Options"), "nosniff");
  assert.equal(
    headerValue("Referrer-Policy"),
    "strict-origin-when-cross-origin",
  );

  const hsts = headerValue("Strict-Transport-Security")
    .split(";")
    .map((part) => part.trim());
  const maxAge = Number(hsts[0]?.replace("max-age=", ""));
  assert.ok(maxAge >= 31_536_000, "HSTS max-age must be at least one year");
  assert.ok(hsts.includes("includeSubDomains"));
  assert.ok(!hsts.includes("preload"), "preload is an owner decision");
});

test("Permissions-Policy denies powerful features and keeps clipboard writes", () => {
  const policy = headerValue("Permissions-Policy");
  const features = new Map(
    policy.split(",").map((entry) => {
      const [feature, allowList] = entry.trim().split("=");
      return [feature, allowList] as const;
    }),
  );

  for (const feature of [
    "camera",
    "microphone",
    "geolocation",
    "payment",
    "usb",
  ]) {
    assert.equal(features.get(feature), "()", feature);
  }
  for (const allowList of features.values()) {
    assert.equal(allowList, "()", "every listed feature is denied");
  }
  // The Payload admin copies values with navigator.clipboard.writeText().
  assert.equal(features.has("clipboard-write"), false);
});

test("next.config sends the headers on every route without X-Powered-By", async () => {
  assert.equal(nextConfig.poweredByHeader, false);
  assert.ok(nextConfig.headers, "headers() must be configured");

  const routes = await nextConfig.headers();
  const allRoutes = routes.filter(({ source }) => source === "/:path*");
  const sentHeaders = allRoutes.flatMap(({ headers }) => headers);

  for (const { key, value } of securityHeaders) {
    assert.deepEqual(
      sentHeaders.filter((header) => header.key === key),
      [{ key, value }],
      `${key} is sent exactly once on /:path*`,
    );
  }
  assert.equal(
    routes
      .flatMap(({ headers }) => headers)
      .some(({ key }) => key.toLowerCase() === "x-powered-by"),
    false,
  );
});

test("next/image patterns reject query strings", () => {
  const { localPatterns, remotePatterns } = nextConfig.images ?? {};

  assert.ok(localPatterns && localPatterns.length > 0);
  for (const pattern of localPatterns) {
    assert.equal(pattern.search, "", `${pattern.pathname} must set search: ""`);
  }

  assert.ok(remotePatterns);
  for (const pattern of remotePatterns) {
    assert.ok(!(pattern instanceof URL), "use object patterns");
    assert.equal(pattern.protocol, "https");
    assert.equal(pattern.search, "", `${pattern.hostname} must set search: ""`);
  }
});

test("next/image never proxies another Blob store", () => {
  const { remotePatterns } = nextConfig.images ?? {};
  assert.ok(remotePatterns);

  for (const pattern of remotePatterns) {
    assert.ok(!(pattern instanceof URL));
    assert.ok(
      !pattern.hostname.includes("*"),
      `${pattern.hostname} must name one store, not a wildcard`,
    );
    assert.match(
      pattern.hostname,
      /^[a-z\d]+\.public\.blob\.vercel-storage\.com$/,
    );
  }

  // Without Vercel Blob storage (local media, CI) there is nothing to proxy.
  if (
    process.env.PAYLOAD_STORAGE !== "vercel-blob" ||
    !process.env.BLOB_READ_WRITE_TOKEN
  ) {
    assert.deepEqual(remotePatterns, []);
  }
});

test("next.config redirects the legacy home slug and has no dead webpack hook", async () => {
  assert.ok(nextConfig.redirects, "redirects() must be configured");
  const redirects = await nextConfig.redirects();

  assert.ok(
    redirects.some(
      (redirect) =>
        redirect.source === "/ana-sayfa" &&
        redirect.destination === "/" &&
        "permanent" in redirect &&
        redirect.permanent === true,
    ),
  );

  // withPayload adds its own webpack() for `next build --webpack`; the
  // project itself must not depend on one (Turbopack ignores it).
  const source = readFileSync(
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../next.config.ts",
    ),
    "utf8",
  );
  assert.equal(/\bwebpack\s*:/.test(source), false);
  assert.equal(/extensionAlias/.test(source), false);
});

test("the report-only CSP is a full policy that keeps every enforced directive", () => {
  const [header] = publicRouteSecurityHeaders;
  assert.ok(header);
  assert.equal(header.key, "Content-Security-Policy-Report-Only");
  assert.equal(publicRouteSecurityHeaders.length, 1);
  const directives = parseDirectives(header.value);

  for (const [name, sources] of Object.entries(
    contentSecurityPolicyDirectives,
  )) {
    assert.deepEqual(directives.get(name), sources, name);
  }
  assert.deepEqual(directives.get("default-src"), ["'self'"]);
  for (const name of ["script-src", "style-src", "img-src", "connect-src"]) {
    assert.ok(directives.has(name), name);
  }
  // The contact form posts to Formspree with fetch().
  assert.ok(directives.get("connect-src")?.includes(FORMSPREE_ORIGIN));

  for (const [name, sources] of directives) {
    for (const source of sources) {
      assert.notEqual(source, "*", `${name} must not allow every origin`);
      assert.ok(!source.startsWith("http:"), `${name}: ${source}`);
      // Production needs no eval (Next.js CSP guide).
      assert.notEqual(source, "'unsafe-eval'", name);
    }
  }
  assert.equal(
    directives.size,
    Object.keys(contentSecurityPolicyReportOnlyDirectives).length,
  );
});

test("next.config sends the report-only CSP on public routes only", async () => {
  assert.ok(nextConfig.headers);
  const routes = await nextConfig.headers();
  const reportOnly = routes.filter(({ headers }) =>
    headers.some(({ key }) => key === "Content-Security-Policy-Report-Only"),
  );
  assert.deepEqual(
    reportOnly.map(({ source, headers }) => ({ source, headers })),
    [
      {
        source: PUBLIC_ROUTES_SOURCE,
        headers: [...publicRouteSecurityHeaders],
      },
    ],
  );

  // Compiled the way Next.js compiles a headers() source.
  const matches = getPathMatch(PUBLIC_ROUTES_SOURCE, { strict: true });
  for (const pathname of [
    "/",
    "/en",
    "/iletisim",
    "/istanbul/ilceler/kadikoy",
    "/en/articles/urban-renewal",
    "/administration-notes",
    "/apiary",
  ]) {
    assert.notEqual(matches(pathname), false, pathname);
  }
  for (const pathname of [
    "/admin",
    "/admin/login",
    "/admin/collections/books",
    "/api/users",
    "/api/media/file/x.jpg",
    "/_next/image",
  ]) {
    assert.equal(matches(pathname), false, pathname);
  }
});

test("the admin candidate policy keeps the public one and adds only Monaco, data: fonts and blob: media", async () => {
  const admin = adminContentSecurityPolicyReportOnlyDirectives;
  const publicPolicy = contentSecurityPolicyReportOnlyDirectives;

  assert.deepEqual(Object.keys(admin).sort(), Object.keys(publicPolicy).sort());
  for (const [name, sources] of Object.entries(
    contentSecurityPolicyDirectives,
  )) {
    assert.deepEqual(admin[name], sources, name);
  }
  for (const [name, sources] of Object.entries(admin)) {
    const added = sources.filter(
      (source) => !(publicPolicy[name] ?? []).includes(source),
    );
    for (const source of added) {
      assert.ok(
        source === MONACO_CDN_ORIGIN ||
          (name === "font-src" && source === "data:") ||
          (name === "media-src" && source === "blob:"),
        `${name} adds ${source}`,
      );
    }
    for (const source of sources) {
      assert.notEqual(source, "*", name);
      assert.notEqual(source, "'unsafe-eval'", name);
      assert.ok(!source.startsWith("http:"), `${name}: ${source}`);
    }
  }
  // Gravatar stays out: the admin avatar is Payload's built-in default.
  const value = serializeContentSecurityPolicy(admin);
  assert.ok(!value.includes("gravatar"), "no Gravatar origin");

  // Not sent yet (see the module comment): no route carries it.
  assert.ok(nextConfig.headers);
  const routes = await nextConfig.headers();
  assert.equal(
    routes.some(({ headers }) =>
      headers.some((header) => header.value === value),
    ),
    false,
  );
});
