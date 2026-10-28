// Read-only header checks against a locally running production build:
//
//   npm run build && npm run start -- --hostname 127.0.0.1 --port 3101
//   npm run e2e:headers -- http://127.0.0.1:3101
//
// The expected values come from src/lib/securityHeaders.ts (Node 24 strips the
// types), so this script and the unit test cannot drift apart.
import assert from "node:assert/strict";
import { securityHeaders } from "../src/lib/securityHeaders.ts";

const base = new URL(process.argv[2] || "http://127.0.0.1:3101");
assert.ok(
  ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname),
  "Run this verification only against a local test server.",
);

const optimizedImage = "/_next/image?url=%2Fbrand%2Fsite-og.jpg&w=640&q=75";
const checks = [
  { path: "/", status: 200 },
  { path: "/en", status: 200 },
  { path: "/iletisim", status: 200 },
  { path: "/admin/login", status: 200 },
  { path: "/public-missing-security-test", status: 404 },
  { path: "/brand/site-og.jpg", status: 200, image: true },
  { path: optimizedImage, status: 200, image: true, optimizer: true },
];

for (const { path, status, image = false, optimizer = false } of checks) {
  const response = await fetch(new URL(path, base), { redirect: "manual" });
  assert.equal(response.status, status, path);
  assert.equal(response.headers.get("x-powered-by"), null, path);

  for (const { key, value } of securityHeaders) {
    if (optimizer && key === "Content-Security-Policy") continue;
    assert.equal(response.headers.get(key), value, `${key} on ${path}`);
  }

  if (optimizer) {
    // The image optimizer deliberately replaces the page CSP with a sandbox.
    const csp = response.headers.get("content-security-policy");
    assert.ok(csp?.includes("script-src 'none'"), path);
    assert.ok(csp?.includes("sandbox"), path);
  }

  if (image) {
    assert.match(response.headers.get("content-type") ?? "", /^image\//, path);
    assert.ok((await response.arrayBuffer()).byteLength > 0, path);
  } else {
    await response.body?.cancel();
  }

  console.log(`PASS ${path} (${response.status})`);
}

// localPatterns set `search: ""`, so a query string on a local image is refused.
const cacheBuster = await fetch(
  new URL("/_next/image?url=%2Fbrand%2Fsite-og.jpg%3Fx%3D1&w=640&q=75", base),
);
assert.equal(
  cacheBuster.status,
  400,
  "query strings on local images are refused",
);
await cacheBuster.body?.cancel();
console.log("PASS optimizer refuses query strings on local images");

const users = await fetch(new URL("/api/users", base));
assert.equal(users.status, 403, "Anonymous users must not list accounts.");
assert.equal(users.headers.get("x-content-type-options"), "nosniff");
await users.body?.cancel();
console.log("PASS anonymous users API denied");
