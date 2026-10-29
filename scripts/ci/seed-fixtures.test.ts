/**
 * The CI fixtures that let the e2e checks render every detail template and
 * the CMS block page (review TESTS-INFRA-1 / FRONTEND-1). The refusal rules
 * are pure; the seed itself runs against a throwaway SQLite database whose
 * media go to a temporary directory, and every record must then be readable
 * the way the public site reads it (overrideAccess: false, draft: false).
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import type { Payload, SanitizedConfig } from "payload";
import {
  detailRoutes,
  fixtureRoutes,
  routePlan,
} from "../a11y/a11y-expectations.mjs";
import { HOME_BLOCK_TYPES } from "../../src/collections/Pages";
import { pageBlocks } from "../../src/blocks/pageBlocks";
import {
  FIXTURE_DISTRICT,
  fixturePaths,
  fixtureProblems,
  fixtureSlugs,
  pageLayout,
} from "./fixture-content";
import { SEEDED_COLLECTIONS, seedEnvironmentProblem } from "./seed-fixtures";

const cwd = path.resolve("work-repo");
const temporary = path.resolve("system-temp");
const local = {
  PAYLOAD_DATABASE: "sqlite",
  PAYLOAD_STORAGE: "local",
  DATABASE_URL: "file:./.data/ci-fixtures.db",
};

test("the fixtures are written only to a local SQLite file, never on Vercel", () => {
  assert.equal(seedEnvironmentProblem(local, cwd, temporary), null);
  for (const [name, environment] of Object.entries({
    vercel: { ...local, VERCEL: "1" },
    vercelEnv: { ...local, VERCEL_ENV: "preview" },
    postgres: { ...local, PAYLOAD_DATABASE: "postgres" },
    blob: { ...local, PAYLOAD_STORAGE: "vercel-blob" },
    neon: {
      ...local,
      DATABASE_URL: "postgres://user@ep-example.neon.tech/db",
    },
    outside: { ...local, DATABASE_URL: "file:./payload.db" },
    missing: { ...local, DATABASE_URL: undefined },
  }))
    assert.match(
      seedEnvironmentProblem(environment, cwd, temporary) ?? "",
      /^Refusing/,
      name,
    );
});

test("every fixture is marked as a test record", () => {
  assert.deepEqual(fixtureProblems(), []);
});

test("the fixture page carries every block a standard page renders", () => {
  // PageBlocks renders every block on a standard page except the two that
  // only the home shows; the hero is shared by both.
  const homeOnly = [...HOME_BLOCK_TYPES].filter((slug) => slug !== "hero");
  const standardBlocks = pageBlocks
    .map((block) => block.slug)
    .filter((slug) => !homeOnly.includes(slug));
  assert.ok(standardBlocks.length >= 4);
  assert.deepEqual(
    pageLayout("media-id")
      .map((block) => block.blockType)
      .sort(),
    [...standardBlocks].sort(),
  );
});

test("the a11y fixture run reaches every fixture path", () => {
  const plan = routePlan(true);
  assert.equal(plan.requireDetails, true);
  assert.equal(routePlan(false).requireDetails, false);
  const fixtureOnly = fixtureRoutes.map((route) => route.path);
  assert.deepEqual(
    plan.routes.map((route) => route.path),
    fixtureOnly,
  );
  // Each detail path is discovered from a list through its prefix; the
  // rest are the explicit fixture routes.
  for (const fixturePath of fixturePaths) {
    const reached =
      fixtureOnly.includes(fixturePath) ||
      detailRoutes.some(
        ({ prefix }) =>
          fixturePath.startsWith(prefix) &&
          !fixturePath.slice(prefix.length).includes("/"),
      );
    assert.ok(reached, fixturePath);
  }
  // And every detail type has a fixture.
  for (const { prefix } of detailRoutes)
    assert.ok(
      fixturePaths.some((fixturePath) => fixturePath.startsWith(prefix)),
      prefix,
    );
});

test("the seed writes publicly readable records and refuses a second run", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ci-fixtures-"));
  const databaseUrl = `file:${path.join(directory, "fixtures.db")}`;
  Object.assign(process.env, {
    DATABASE_URL: databaseUrl,
    DISABLE_PAYLOAD_HMR: "true",
    PAYLOAD_DATABASE: "sqlite",
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || "ci-fixtures-test-secret",
    PAYLOAD_STORAGE: "local",
  });
  const { default: configPromise } = await import("../../src/payload.config");
  const { sqliteAdapter } = await import("@payloadcms/db-sqlite");
  const { getPayload } = await import("payload");
  const { seedFixtures } = await import("./seed-fixtures");

  const config: SanitizedConfig = await configPromise;
  config.typescript.autoGenerate = false;
  Object.assign(
    config.db,
    sqliteAdapter({ client: { url: databaseUrl }, idType: "uuid", push: true }),
  );
  // The generated image goes to the temporary directory, not public/media.
  const media = config.collections.find(({ slug }) => slug === "media");
  assert.ok(media?.upload);
  media.upload.staticDir = path.join(directory, "media");

  const payload: Payload = await getPayload({ config });
  after(async () => {
    await payload.destroy();
    await rm(directory, { force: true, recursive: true });
  });

  const counts = await seedFixtures(payload);
  assert.deepEqual(Object.keys(counts), [...SEEDED_COLLECTIONS]);

  const publicRead = { overrideAccess: false, draft: false, depth: 0 };
  async function findOne(
    collection: "articles" | "books" | "pages" | "photos",
    slug: string,
    locale: "tr" | "en",
  ) {
    const { docs } = await payload.find({
      collection,
      locale,
      ...publicRead,
      where: { slug: { equals: slug }, _status: { equals: "published" } },
    });
    return docs[0];
  }

  for (const [collection, slug, locale] of [
    ["articles", fixtureSlugs.articleTr, "tr"],
    ["articles", fixtureSlugs.articleEn, "en"],
    ["articles", fixtureSlugs.districtNews, "tr"],
    ["books", fixtureSlugs.bookTr, "tr"],
    ["books", fixtureSlugs.bookEn, "en"],
    ["photos", fixtureSlugs.photoTr, "tr"],
    ["photos", fixtureSlugs.photoEn, "en"],
    ["pages", fixtureSlugs.page, "tr"],
  ] as const)
    assert.ok(
      await findOne(collection, slug, locale),
      `${collection}/${slug} (${locale}) is not public`,
    );

  const news = await findOne("articles", fixtureSlugs.districtNews, "tr");
  assert.ok(news && "district" in news);
  assert.equal(news.district, FIXTURE_DISTRICT);
  const page = await findOne("pages", fixtureSlugs.page, "tr");
  // The fixture page stays out of search engines and the sitemap.
  const seo = page && "seo" in page ? page.seo : undefined;
  assert.ok(seo && "index" in seo);
  assert.equal(seo.index, false);

  await assert.rejects(seedFixtures(payload), /empty database only/);
});
