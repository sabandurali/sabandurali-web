import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import nextConfig from "../../next.config";
import {
  contentSecurityPolicyDirectives,
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
  assert.deepEqual(directives.get("form-action"), ["'self'"]);
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
