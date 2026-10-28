import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
const base = "http://localhost:3017";
const registry = readFileSync(
  "src/content/districts/district-registry.ts",
  "utf8",
);
const districts = [
  ...registry.matchAll(/\["([^"]+)", "([a-z-]+)", [\d.]+, [\d.]+\]/g),
].map((m) => m[2]);
assert.equal(districts.length, 39);
const results = [];
for (const slug of districts) {
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
for (const path of [
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
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  if (path === "/hakkimda") {
    assert.match(html, /Evka Turizm/);
    assert.match(html, /devam ediyor/);
    assert.ok(!html.includes("Doğrulanmış Kayıtlar"));
  }
  if (path === "/" || path === "/en")
    assert.ok(
      !html.includes('href="/gayrimenkul-ve-istanbul/hesaplama-araclari"'),
    );
  results.push({ path, status: response.status });
}
writeFileSync(
  "reports/content-trust-20261018/routes.json",
  JSON.stringify(results, null, 2),
);
console.log(
  "39/39 district HTTP + metadata + image checks, 9 TR/EN navigation routes PASS",
);
