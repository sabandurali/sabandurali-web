import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { chromium } = createRequire(
  process.env.BROWSER_PACKAGE || import.meta.url,
)("playwright");
const base = process.env.DISTRICT_TEST_URL || "http://localhost:3017";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))
  throw new Error("Acceptance only targets explicit local HTTP origins.");
const output =
  process.env.DISTRICT_TEST_OUTPUT || "/tmp/istanbul-39-acceptance";
await mkdir(output, { recursive: true });
const registry = await readFile(
  "src/content/districts/district-registry.ts",
  "utf8",
);
const districts = [
  ...registry.matchAll(/\["([^"]+)", "([a-z-]+)", [\d.]+, [\d.]+\]/g),
].map((m) => ({ name: m[1], slug: m[2] }));
assert.equal(districts.length, 39);
const editorial =
  process.env.DISTRICT_EXPECT_EDITORIAL === "1"
    ? JSON.parse(await readFile("data/districts/editorial.json", "utf8"))
    : null;
const browser = await chromium.launch({
  headless: true,
  channel: process.env.BROWSER_CHANNEL || "chrome",
});
const page = await browser.newPage();
const failures = [];
const serverErrors = [];
const pageErrors = [];
const rows = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));
page.on("response", (r) => {
  if (r.url().startsWith(base) && r.status() >= 500)
    serverErrors.push({ url: r.url(), status: r.status() });
});
const check = async (name, fn) => {
  try {
    return await fn();
  } catch (error) {
    failures.push({ name, error: error.message });
    return false;
  }
};
try {
  for (const district of districts) {
    await check(district.slug, async () => {
      const response = await page.goto(
        `${base}/istanbul/ilceler/${district.slug}`,
        { waitUntil: "networkidle" },
      );
      assert.equal(response.status(), 200);
      assert.equal(await page.locator("h1").count(), 1);
      if (editorial) {
        const content = editorial.districts.find(
          (r) => r.district === district.slug,
        );
        assert.equal(
          (await page.locator("#tarihce").innerText()).includes(
            content.sections.history,
          ),
          true,
        );
        assert.equal(
          await page.locator("#mahalleler ul li").count(),
          content.neighborhoods.length,
        );
        assert.equal(
          (await page.locator("#kaynaklar").innerText()).includes(
            "Son kontrol",
          ),
          true,
        );
        assert.equal(
          (await page.locator("#guncelleme").innerText()).includes(
            "İçerik güncellemesi",
          ),
          true,
        );
        const body = await page.locator("main").innerText();
        assert.ok(
          !body.includes("HAM ARAŞTIRMA") &&
            !body.includes("LOCAL TEST ONLY") &&
            !body.includes("Ortalama m² satış fiyatı"),
        );
      }
      assert.match(
        await page.locator("h1").innerText(),
        new RegExp(district.name),
      );
      const canonical = await page
        .locator("link[rel=canonical]")
        .getAttribute("href");
      assert.equal(
        canonical,
        `https://www.sabandurali.com/istanbul/ilceler/${district.slug}`,
      );
      assert.ok(
        await page.locator('meta[property="og:title"]').getAttribute("content"),
      );
      assert.equal(await page.locator("link[hreflang=en]").count(), 0);
      assert.ok(
        !(
          await page.locator("meta[name=robots]").getAttribute("content")
        ).includes("noindex"),
      );
      const json = JSON.parse(
        await page
          .locator('script[type="application/ld+json"]')
          .first()
          .textContent(),
      );
      assert.equal(
        json["@graph"].find((n) => n["@type"] === "BreadcrumbList")
          .itemListElement.length,
        4,
      );
      assert.equal(await page.locator("main section[id]").count(), 14);
      const widths = [];
      for (const width of [1440, 820, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        const geometry = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          width: innerWidth,
          broken: [...document.images]
            .filter((i) => i.complete && !i.naturalWidth)
            .map((i) => i.src),
        }));
        assert.ok(
          geometry.scroll <= geometry.width + 1,
          `overflow ${width}: ${geometry.scroll}`,
        );
        assert.deepEqual(geometry.broken, []);
        widths.push(width);
      }
      assert.match(
        await page.locator("#kareler").innerText(),
        /henüz eklenmedi/,
      );
      assert.ok(
        !(await page.getByText("HAM ARAŞTIRMA", { exact: false }).count()),
      );
      if (["esenler", "adalar", "buyukcekmece"].includes(district.slug))
        await page.screenshot({
          path: `${output}/${district.slug}-390.png`,
          fullPage: true,
        });
      rows.push({
        district: district.slug,
        status: 200,
        canonical,
        widths,
        emptyPhotos: "pass",
        metadata: "pass",
      });
    });
  }
  await check("directory filters", async () => {
    const response = await page.goto(`${base}/istanbul/ilceler`, {
      waitUntil: "networkidle",
    });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator("[data-district-card]").count(), 39);
    await page.getByLabel("Yaka", { exact: true }).selectOption("avrupa");
    assert.equal(await page.locator("[data-district-card]").count(), 25);
    await page.getByLabel("Yaka", { exact: true }).selectOption("anadolu");
    assert.equal(await page.locator("[data-district-card]").count(), 14);
    await page.getByLabel("Yaka", { exact: true }).selectOption("all");
    await page.getByLabel("İlçe ara").fill("kadikoy");
    assert.equal(await page.locator("[data-district-card]").count(), 1);
    await page.getByLabel("İlçe ara").fill("sisli");
    assert.equal(await page.locator('[data-district-card="sisli"]').count(), 1);
    await page.getByLabel("İlçe ara").fill("olmayan");
    assert.equal(await page.locator("[data-district-card]").count(), 0);
    await page.getByLabel("İlçe ara").fill("");
    await page.getByRole("button", { name: "Ş", exact: true }).click();
    assert.equal(await page.locator("[data-district-card]").count(), 2);
    await page.getByRole("button", { name: "Tümü", exact: true }).click();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      await page.screenshot({
        path: `${output}/directory-${width}.png`,
        fullPage: true,
      });
    }
  });
  await check("invalid slug", async () => {
    const response = await page.goto(`${base}/istanbul/ilceler/olmayan-ilce`);
    assert.equal(response.status(), 404);
  });
  const request = page.request;
  for (const district of districts)
    await check(`${district.slug} news`, async () => {
      assert.equal(
        (
          await request.get(
            `${base}/istanbul/ilceler/${district.slug}/haberler`,
          )
        ).status(),
        200,
      );
    });
  await check("news mobile layout", async () => {
    await page.setViewportSize({ width: 390, height: 1000 });
    for (const slug of ["gaziosmanpasa", "buyukcekmece", "sultanbeyli"]) {
      await page.goto(`${base}/istanbul/ilceler/${slug}/haberler`, {
        waitUntil: "networkidle",
      });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
  });
  await check("invalid news slug", async () => {
    assert.equal(
      (
        await request.get(`${base}/istanbul/ilceler/olmayan-ilce/haberler`)
      ).status(),
      404,
    );
  });
  await check("sitemap and robots", async () => {
    const xml = await (await request.get(`${base}/sitemap.xml`)).text();
    for (const district of districts)
      assert.ok(
        xml.includes(
          `<loc>https://www.sabandurali.com/istanbul/ilceler/${district.slug}</loc>`,
        ),
      );
    const robots = await (await request.get(`${base}/robots.txt`)).text();
    assert.ok(!/^Disallow:\s*\/$/m.test(robots));
  });
  await check("legacy guide redirect", async () => {
    const response = await request.get(
      `${base}/gayrimenkul-ve-istanbul/ilce-rehberi`,
      { maxRedirects: 0 },
    );
    assert.equal(response.status(), 308);
    assert.equal(response.headers().location, "/istanbul/ilceler");
  });
  const regressions = [];
  for (const path of [
    "/",
    "/makaleler",
    "/kitaplar",
    "/fotograflar",
    "/admin",
    "/admin/help",
  ])
    await check(`regression ${path}`, async () => {
      const response = await request.get(`${base}${path}`);
      assert.equal(response.status(), 200);
      regressions.push({
        path,
        status: response.status(),
        finalUrl: response.url(),
      });
    });
  const result = {
    origin: base,
    sourceMode: process.env.DISTRICT_SOURCE_MODE || "static-build",
    districtCount: districts.length,
    passedRoutes: rows.length,
    rows,
    regressions,
    failures,
    serverErrors,
    pageErrors,
    authenticatedAdminUI: "not tested; anonymous entrypoints only",
  };
  await writeFile(`${output}/acceptance.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, rows: undefined }, null, 2));
  assert.equal(failures.length + serverErrors.length + pageErrors.length, 0);
} finally {
  await browser.close();
}
