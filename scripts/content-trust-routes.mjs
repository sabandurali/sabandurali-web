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
import path from "node:path";
import { districts } from "../src/content/districts/district-registry.ts";

const base = process.env.DISTRICT_TEST_URL || "http://localhost:3017";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))
  throw new Error("The content trust check only targets local HTTP origins.");
const output = process.env.DISTRICT_TEST_OUTPUT || "/tmp/content-trust-routes";

assert.equal(districts.length, 39);
const results = [];
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
  assert.ok(!html.includes('hrefLang="en"'));
  assert.ok(
    !html.includes('href="#arastirmalar"') &&
      !html.includes('href="#haberler"'),
  );
  const image = html.match(/property="og:image" content="([^"]+)"/)[1];
  const imageResponse = await fetch(base + new URL(image).pathname);
  assert.equal(imageResponse.status, 200);
  assert.match(imageResponse.headers.get("content-type"), /image/);
  results.push({
    slug,
    status: response.status,
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
  `39/39 district HTTP + metadata + image checks, 9 TR/EN navigation routes PASS (${path.join(output, "routes.json")})`,
);
