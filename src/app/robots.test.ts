import assert from "node:assert/strict";
import test from "node:test";
import robots from "./robots";

const site = "https://www.sabandurali.com";

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Google's rule: the longest matching path wins, and `allow` wins a tie.
 * (Plain prefixes only: the rules use no wildcards.)
 */
function isAllowed(path: string): boolean {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  const rule = rules.find((candidate) =>
    asList(candidate.userAgent).includes("*"),
  );
  assert.ok(rule, "a rule for every user agent");
  const longest = (prefixes: string[]) =>
    Math.max(
      -1,
      ...prefixes
        .filter((prefix) => path.startsWith(prefix))
        .map((prefix) => prefix.length),
    );
  return longest(asList(rule.allow)) >= longest(asList(rule.disallow));
}

test("ROBOTS-SITEMAP: the admin and the REST API are disallowed", () => {
  for (const path of [
    "/admin",
    "/admin/collections/articles",
    "/api/articles",
    "/api/users/me",
    "/api/media",
  ]) {
    assert.equal(isAllowed(path), false, path);
  }
});

test("ROBOTS-SITEMAP: content, media files and image URLs stay crawlable", () => {
  for (const path of [
    "/",
    "/makaleler",
    "/en/photography",
    "/istanbul/ilceler/kadikoy",
    "/api/media/file/galata.jpg",
    "/_next/image",
    "/brand/site-og.jpg",
    "/workspaces/districts/esenler.jpg",
  ]) {
    assert.equal(isAllowed(path), true, path);
  }
});

test("ROBOTS-SITEMAP: the sitemap and host are absolute on the site origin", () => {
  const config = robots();
  assert.equal(config.sitemap, `${site}/sitemap.xml`);
  assert.equal(config.host, site);
});
