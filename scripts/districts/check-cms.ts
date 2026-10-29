// Local CMS check of the district guide rules (`npm run e2e:districts:cms`).
// Without an argument it creates a temporary SQLite database, imports the 39
// district drafts with scripts/districts/import.ts and removes it afterwards.
// An existing isolated database may be passed instead; it must live in an
// istanbul-39-* folder under /tmp or the system temporary directory. With
// DISTRICT_CMS_TEST_URL, a local server using that database is also checked
// in Chrome and screenshots go to DISTRICT_TEST_OUTPUT.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  decideImport,
  fingerprint,
  isRecord,
  toFieldRecord,
  type ResearchBundle,
} from "./import-core";

const isolatedPrefixes = [
  "/tmp/istanbul-39-",
  path.join(tmpdir(), "istanbul-39-"),
];
const argument = process.argv[2];
let temporaryDirectory: string | undefined;
let database: string;
if (argument) {
  if (!isolatedPrefixes.some((prefix) => argument.startsWith(prefix)))
    throw new Error("Test requires an isolated istanbul-39-* database.");
  database = argument;
} else {
  if (process.env.DISTRICT_CMS_TEST_URL)
    throw new Error(
      "DISTRICT_CMS_TEST_URL needs the database path that the local server uses.",
    );
  temporaryDirectory = mkdtempSync(path.join(tmpdir(), "istanbul-39-cms-"));
  database = path.join(temporaryDirectory, "payload-test.db");
  const imported = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "scripts/districts/import.ts",
      "--database",
      database,
      "--apply",
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  if (imported.status !== 0) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
    throw new Error("The isolated district import failed.");
  }
}
const screenshots =
  process.env.DISTRICT_TEST_OUTPUT || "/tmp/istanbul-39-audit";
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
config.telemetry = false;
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
  const original = docs.docs.find((d) => d.district === "esenler");
  assert.ok(original, "esenler draft was imported");
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
    const research = bundle.districts.find((d) => d.district === "esenler");
    assert.ok(research, "esenler research record exists");
    assert.equal(
      decideImport(toFieldRecord(changed), research).reason,
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
      mkdirSync(screenshots, { recursive: true });
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
            path: `${screenshots}/verified-fixture-${width}.png`,
            fullPage: true,
          });
          await page.screenshot({
            path: `${screenshots}/verified-fixture-${width}-viewport.png`,
          });
          await page.locator("#kaynaklar").screenshot({
            path: `${screenshots}/verified-fixture-${width}-sources.png`,
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
          ...(isRecord(restore.importProvenance)
            ? restore.importProvenance
            : {}),
          fingerprint: fingerprint(toFieldRecord(restored)),
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
  if (temporaryDirectory)
    rmSync(temporaryDirectory, { recursive: true, force: true });
}
