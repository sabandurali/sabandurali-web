// Local HTTP regression check from the content trust package
// (reports/content-trust-20261018): the 39 district guides with canonical,
// Open Graph and Twitter metadata and a reachable share image, plus nine TR/EN
// routes. It only targets a local server, for example:
//   npm run build && npm run start -- --hostname 127.0.0.1 --port 3017
//   npm run e2e:content-trust
// The JSON result goes to DISTRICT_TEST_OUTPUT (default
// /tmp/content-trust-routes), never into the repository.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { request } from "node:http";
import path from "node:path";
import { districts } from "../src/content/districts/district-registry.ts";
import { workspaceSectionRedirects } from "../src/content/workspace-redirects.ts";
import {
  alternateLanguages,
  expectsIndexedGuides,
  localImageUrl,
  redirectLocationProblem,
  robotsProblem,
} from "./districts/acceptance-expectations.mjs";

const base = process.env.DISTRICT_TEST_URL || "http://localhost:3017";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))
  throw new Error("The content trust check only targets local HTTP origins.");
const output = process.env.DISTRICT_TEST_OUTPUT || "/tmp/content-trust-routes";

assert.equal(districts.length, 39);
// Static builds serve empty `noindex, follow` guides; the indexed
// expectation applies only with DISTRICT_EXPECT_EDITORIAL=1.
const indexed = expectsIndexedGuides();
const results = [];

/** The raw Location header lines of a response, without following it. */
function locationLines(url) {
  return new Promise((resolve, reject) => {
    request(url, (response) => {
      response.resume();
      const lines = [];
      for (let i = 0; i < response.rawHeaders.length; i += 2)
        if (response.rawHeaders[i].toLowerCase() === "location")
          lines.push(response.rawHeaders[i + 1]);
      resolve({ status: response.statusCode, lines });
    })
      .on("error", reject)
      .end();
  });
}

// Legacy workspace entries redirect permanently (next.config.ts). They run
// first, so the first response of a fresh server is the one checked.
for (const { source: from, destination: to } of workspaceSectionRedirects) {
  for (const attempt of ["first", "cached"]) {
    const { status, lines } = await locationLines(base + from);
    assert.equal(status, 308, `${from} (${attempt})`);
    const problem = redirectLocationProblem(lines, to);
    assert.equal(problem, null, `${from} (${attempt}): ${problem}`);
  }
  results.push({ path: from, status: 308, location: to });
}
for (const { slug } of districts) {
  const response = await fetch(`${base}/istanbul/ilceler/${slug}`, {
    headers: { "user-agent": "Twitterbot" },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(
    html.includes(
      `rel="canonical" href="https://www.sabandurali.com/istanbul/ilceler/${slug}"`,
    ),
  );
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  // District guides are Turkish only: no English language alternate. The
  // header's language switch (<a hrefLang="en">) is not an alternate.
  assert.deepEqual(alternateLanguages(html), ["tr-TR"], slug);
  assert.ok(
    !html.includes('href="#arastirmalar"') &&
      !html.includes('href="#haberler"'),
  );
  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1];
  const robotsError = robotsProblem(robots, indexed);
  assert.equal(robotsError, null, `${slug}: ${robotsError}`);
  // Keep the query string: the optimizer URL (/_next/image?url=…&w=…&q=…)
  // is the share image; `&` is HTML-escaped in the attribute.
  const image = html.match(/property="og:image" content="([^"]+)"/)[1];
  const imageResponse = await fetch(localImageUrl(base, image));
  assert.equal(imageResponse.status, 200);
  assert.match(imageResponse.headers.get("content-type"), /image/);
  results.push({
    slug,
    status: response.status,
    robots,
    image,
    imageStatus: imageResponse.status,
  });
}
for (const route of [
  "/",
  "/en",
  "/hakkimda",
  "/satis-ve-muzakere",
  "/satis-ve-muzakere/satis",
  "/gayrimenkul-ve-istanbul/hesaplama-araclari",
  "/en/articles",
  "/en/books",
  "/en/photography",
]) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
  const html = await response.text();
  if (route === "/hakkimda") {
    assert.match(html, /Evka Turizm/);
    assert.match(html, /devam ediyor/);
    assert.ok(!html.includes("Doğrulanmış Kayıtlar"));
  }
  if (route === "/" || route === "/en")
    assert.ok(
      !html.includes('href="/gayrimenkul-ve-istanbul/hesaplama-araclari"'),
    );
  results.push({ path: route, status: response.status });
}
mkdirSync(output, { recursive: true });
writeFileSync(
  path.join(output, "routes.json"),
  JSON.stringify(results, null, 2),
);
console.log(
  `${workspaceSectionRedirects.length} legacy redirects, 39/39 district HTTP + metadata + image checks, 9 TR/EN navigation routes PASS (${path.join(output, "routes.json")})`,
);
