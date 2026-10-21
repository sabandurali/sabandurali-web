import assert from "node:assert/strict";

// Read-only checks against a locally running production build.
const base = new URL(process.argv[2] || "http://127.0.0.1:3101");
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname),
  "Run this verification only against a local test server.");

for (const path of [
  "/", "/iletisim", "/admin/login", "/public-missing-security-test",
  "/brand/site-og.jpg",
  "/_next/image?url=%2Fbrand%2Fsite-og.jpg&w=640&q=75",
]) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, path.includes("missing") ? 404 : 200, path);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff", path);
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN", path);
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin", path);
  assert.equal(response.headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()", path);
  assert.equal(response.headers.get("x-powered-by"), null, path);
  const csp = response.headers.get("content-security-policy");
  if (path.startsWith("/_next/image")) {
    // Next's image optimizer deliberately replaces page CSP with a sandbox.
    assert.ok(csp?.includes("script-src 'none'"), path);
    assert.ok(csp?.includes("sandbox"), path);
  } else {
    assert.ok(csp?.includes("frame-ancestors 'self'"), path);
    assert.ok(csp?.includes("object-src 'none'"), path);
    assert.ok(csp?.includes("base-uri 'self'"), path);
    assert.ok(csp?.includes("form-action 'self' https://formspree.io"), path);
  }
  if (path.includes("jpg")) {
    assert.match(response.headers.get("content-type"), /^image\//, path);
    assert.ok((await response.arrayBuffer()).byteLength > 0, path);
  }
  console.log(`PASS ${path} (${response.status})`);
}

const users = await fetch(new URL("/api/users", base));
assert.equal(users.status, 403, "Anonymous users must not list accounts.");
assert.equal(users.headers.get("x-content-type-options"), "nosniff");
console.log("PASS anonymous users API denied");
