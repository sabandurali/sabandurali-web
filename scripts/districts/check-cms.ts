import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { decideImport, fingerprint, type ResearchBundle } from "./import-core";
const database = process.argv[2];
if (!database?.startsWith("/tmp/istanbul-39-"))
  throw new Error("Test requires an isolated /tmp/istanbul-39-* database.");
Object.assign(process.env, {
  NODE_ENV: "development",
  PAYLOAD_DATABASE: "sqlite",
  PAYLOAD_STORAGE: "local",
  DATABASE_URL: `file:${database}`,
  PAYLOAD_SECRET: "district-isolated-test",
});
const { default: configPromise } = await import("../../src/payload.config");
const config = await configPromise;
config.typescript.autoGenerate = false;
Object.assign(
  config.db,
  (await import("@payloadcms/db-sqlite")).sqliteAdapter({
    client: { url: `file:${database}` },
    idType: "uuid",
    push: false,
  }),
);
const { getPayload } = await import("payload");
const payload = await getPayload({ config });
try {
  const docs = await payload.find({
    collection: "district-guides",
    limit: 100,
    locale: "tr",
    draft: true,
    overrideAccess: true,
  });
  assert.equal(docs.totalDocs, 39);
  assert.equal(new Set(docs.docs.map((d) => d.district)).size, 39);
  const anonymousDrafts = await payload.find({
    collection: "district-guides",
    overrideAccess: false,
  });
  assert.equal(anonymousDrafts.totalDocs, 0);
  const original = docs.docs.find((d) => d.district === "esenler")!;
  const restore = structuredClone(original);
  try {
    await assert.rejects(
      payload.update({
        collection: "district-guides",
        id: original.id,
        locale: "tr",
        overrideAccess: true,
        data: { _status: "published" },
      }),
      /Yayın için/,
    );
    await assert.rejects(
      payload.update({
        collection: "district-guides",
        id: original.id,
        overrideAccess: true,
        data: { district: "adalar" },
      }),
      /değiştirilemez/,
    );
    const changed = await payload.update({
      collection: "district-guides",
      id: original.id,
      locale: "tr",
      draft: true,
      data: { history: "LOCAL TEST ONLY: manual edit" },
    });
    const bundle = JSON.parse(
      await readFile("data/districts/research.json", "utf8"),
    ) as ResearchBundle;
    const research = bundle.districts.find((d) => d.district === "esenler")!;
    assert.equal(
      decideImport(changed as unknown as Record<string, unknown>, research)
        .reason,
      "manual/unmanaged content protected",
    );
    const now = new Date().toISOString();
    await payload.update({
      collection: "district-guides",
      id: original.id,
      locale: "tr",
      overrideAccess: true,
      data: {
        _status: "published",
        summary: "LOCAL TEST ONLY: summary",
        history: "LOCAL TEST ONLY: history",
        geography: "LOCAL TEST ONLY: geography",
        publishedAt: now,
        reviewedSections: ["summary", "history", "geography"],
        sources: [
          {
            title: "Local fixture source",
            publisher: "Local fixture",
            url: "https://www.esenler.gov.tr/tarihce",
            sourceType: "official",
            primary: true,
            checkedAt: now,
            needsVerification: false,
            sections: ["summary", "history", "geography"],
          },
        ],
        marketData: {
          salePricePerM2: 123456789,
          dataDate: now,
          source: "Unverified fixture",
          needsVerification: true,
        },
      },
    });
    const publicDoc = await payload.findByID({
      collection: "district-guides",
      id: original.id,
      locale: "tr",
      overrideAccess: false,
    });
    assert.equal(publicDoc.summary, "LOCAL TEST ONLY: summary");
    assert.equal(publicDoc.marketData, null);
    assert.equal(publicDoc.life, null);
    assert.equal(publicDoc.researchNotes, undefined);
    assert.equal(publicDoc.importProvenance, undefined);
    if (process.env.DISTRICT_CMS_TEST_URL) {
      const base = process.env.DISTRICT_CMS_TEST_URL;
      if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))
        throw new Error("Local test URL required");
      const { chromium } = createRequire(
        process.env.BROWSER_PACKAGE || import.meta.url,
      )("playwright");
      const browser = await chromium.launch({
        channel: "chrome",
        headless: true,
      });
      try {
        const page = await browser.newPage();
        for (const width of [1440, 820, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          const response = await page.goto(`${base}/istanbul/ilceler/esenler`, {
            waitUntil: "networkidle",
          });
          assert.equal(response.status(), 200);
          assert.ok(
            (await page.locator("main").innerText()).includes(
              "LOCAL TEST ONLY: summary",
            ),
          );
          assert.ok(
            !(await page.locator("main").innerText()).includes("123456789"),
          );
          assert.ok(
            (await page.locator("#kaynaklar").innerText()).includes(
              "Local fixture source",
            ),
          );
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          );
          await page.screenshot({
            path: `/tmp/istanbul-39-audit/verified-fixture-${width}.png`,
            fullPage: true,
          });
          await page.screenshot({
            path: `/tmp/istanbul-39-audit/verified-fixture-${width}-viewport.png`,
          });
          await page
            .locator("#kaynaklar")
            .screenshot({
              path: `/tmp/istanbul-39-audit/verified-fixture-${width}-sources.png`,
            });
        }
      } finally {
        await browser.close();
      }
    }
    const english = await payload.findByID({
      collection: "district-guides",
      id: original.id,
      locale: "en",
      fallbackLocale: false,
      overrideAccess: false,
    });
    assert.ok(!english.summary, "No fabricated English fallback");
    const future = new Date(Date.now() + 86400000).toISOString();
    await payload.update({
      collection: "district-guides",
      id: original.id,
      locale: "tr",
      overrideAccess: true,
      data: { publishedAt: future },
    });
    assert.equal(
      (
        await payload.find({
          collection: "district-guides",
          overrideAccess: false,
        })
      ).totalDocs,
      0,
    );
  } finally {
    const data: Partial<typeof restore> = { ...restore };
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    const restored = await payload.update({
      collection: "district-guides",
      id: original.id,
      locale: "tr",
      overrideAccess: true,
      draft: false,
      data: { ...data, _status: "draft" },
    });
    await payload.update({
      collection: "district-guides",
      id: original.id,
      locale: "tr",
      overrideAccess: true,
      draft: true,
      data: {
        importProvenance: {
          ...(restore.importProvenance as object),
          fingerprint: fingerprint(
            restored as unknown as Record<string, unknown>,
          ),
        },
      },
    });
  }
  const final = await payload.find({
    collection: "district-guides",
    limit: 100,
    draft: true,
    overrideAccess: true,
  });
  assert.equal(final.totalDocs, 39);
  assert.equal(final.docs.filter((d) => d._status === "draft").length, 39);
  console.log(
    JSON.stringify(
      {
        districts: 39,
        unique: 39,
        drafts: 39,
        anonymousDrafts: 0,
        unreviewedPublishBlocked: true,
        immutableSlug: true,
        manualEditProtected: true,
        anonymousSensitiveDataHidden: true,
        futurePublishHidden: true,
        englishFallbackAbsent: true,
        fixturesRestored: true,
      },
      null,
      2,
    ),
  );
} finally {
  await payload.destroy();
}
