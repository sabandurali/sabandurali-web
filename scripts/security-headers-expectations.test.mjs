import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isReadyAdminLogin } from "./security-headers-expectations.mjs";

test("a ready admin login redirects to the first user or shows the form", () => {
  assert.equal(
    isReadyAdminLogin(
      '12:E{"digest":"NEXT_REDIRECT;replace;/admin/create-first-user;307;"}',
    ),
    true,
  );
  assert.equal(
    isReadyAdminLogin('<input id="field-email" name="email" type="email">'),
    true,
  );
  // Payload's error page: 200, a digest, no redirect and no form.
  assert.equal(
    isReadyAdminLogin(
      '<html><body><h1>Error</h1>{"digest":"1234567890"}</body></html>',
    ),
    false,
  );
  // Only the first-user route counts, not the config listing it.
  assert.equal(
    isReadyAdminLogin('{"createFirstUser":"/create-first-user"}'),
    false,
  );
});

test("e2e:headers checks that /admin/login renders a ready admin", () => {
  const source = readFileSync("scripts/security-headers-check.mjs", "utf8");
  assert.match(
    source,
    /\{ path: "\/admin\/login", status: 200, admin: true \}/,
  );
  assert.match(source, /isReadyAdminLogin\(html\)/);
});
