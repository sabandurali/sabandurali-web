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
  fixtureStructuredData,
  routePlan,
} from "../a11y/a11y-expectations.mjs";
import { HOME_BLOCK_TYPES } from "../../src/collections/Pages";
import { pageBlocks } from "../../src/blocks/pageBlocks";
import { mapDistrictGuide } from "../../src/content/districts/district-guide-projection";
import { mapPayloadNavigation } from "../../src/content/navigation/payload-navigation-mapper";
import {
  FIXTURE_DISTRICT,
  districtGuideFields,
  districtGuideFixtureProblems,
  fixtureGuideMarks,
  fixtureNavigationMarks,
  fixturePaths,
  fixtureProblems,
  fixtureSlugs,
  navigationFields,
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
  assert.equal(
    seedEnvironmentProblem(
      { ...local, DATABASE_URL: `file:${path.join(temporary, "any.db")}` },
      cwd,
      temporary,
    ),
    null,
  );
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
    localDevelopment: { ...local, DATABASE_URL: "file:./.data/payload.db" },
    nestedLocal: { ...local, DATABASE_URL: "file:./.data/sub/payload.db" },
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

test("the JSON-LD check visits the photo fixture pages", () => {
  assert.deepEqual(
    fixtureStructuredData.map(({ path }) => path),
    [
      `/fotograflar/${fixtureSlugs.photoTr}`,
      `/en/photography/${fixtureSlugs.photoEn}`,
    ],
  );
  for (const { path: fixturePath } of fixtureStructuredData)
    assert.ok(fixturePaths.includes(fixturePath), fixturePath);
  assert.deepEqual(routePlan(true).structuredData, fixtureStructuredData);
  assert.deepEqual(routePlan(false).structuredData, []);
});

test("the guide fixture states no district fact and passes the content policy", () => {
  assert.deepEqual(districtGuideFixtureProblems(), []);
  const now = Date.now();
  const guide = mapDistrictGuide(districtGuideFields(now), now);
  assert.ok(guide);
  // Every section the fixture fills is public, so the page renders it.
  for (const key of [
    "summary",
    "history",
    "geography",
    "life",
    "transportation",
    "housingTexture",
    "regionalAssessment",
    "placesGuide",
    "distinctiveFeatures",
    "researchTopics",
  ] as const)
    assert.ok(guide[key], key);
  assert.ok(guide.facts);
  assert.equal(guide.neighborhoods.length, 2);
  assert.equal(guide.planningDevelopments.length, 1);
  assert.equal(guide.sources.length, 2);
  assert.equal(guide.marketData, null);
  // The private research note never reaches the projection.
  assert.ok(!JSON.stringify(guide).includes("public dışı araştırma notu"));
});

test("the a11y fixture texts are the texts the fixtures render", () => {
  const guideRoute = fixtureRoutes.find(
    ({ type }) => type === "district guide (filled)",
  );
  assert.ok(guideRoute?.requiredContent && guideRoute.forbiddenContent);
  assert.equal(guideRoute.path, `/istanbul/ilceler/${FIXTURE_DISTRICT}`);
  const texts = guideRoute.requiredContent.map(({ text }) => text);
  for (const mark of [
    ...Object.values(fixtureGuideMarks),
    ...Object.values(fixtureNavigationMarks),
  ])
    assert.ok(texts.includes(mark), mark);
  const guide = districtGuideFields(Date.now());
  assert.ok(guide.summary.includes(fixtureGuideMarks.summary));
  assert.ok(guideRoute.forbiddenContent.length > 0);
  for (const text of guideRoute.forbiddenContent)
    assert.ok(guide.researchNotes.includes(text), text);
  const navigation = navigationFields("page-id");
  assert.equal(navigation.headerItems[0]?.label, fixtureNavigationMarks.header);
  assert.equal(
    navigation.footerGroups[0]?.title,
    fixtureNavigationMarks.footer,
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

  // The district guide is published and public in full, as the page reads
  // it; its private research note stays out of the anonymous read.
  const { docs: guides } = await payload.find({
    collection: "district-guides",
    locale: "tr",
    ...publicRead,
    where: { district: { equals: FIXTURE_DISTRICT } },
  });
  assert.equal(guides.length, 1);
  assert.ok(!JSON.stringify(guides[0]).includes("public dışı araştırma notu"));
  const guide = mapDistrictGuide(guides[0]);
  assert.ok(guide?.summary?.includes(fixtureGuideMarks.summary));
  assert.equal(guide?.neighborhoods.length, 2);
  assert.equal(guide?.planningDevelopments.length, 1);

  // Both district photos are public and filed under the fixture district.
  const { docs: districtPhotos } = await payload.find({
    collection: "photos",
    locale: "tr",
    ...publicRead,
    where: { district: { equals: FIXTURE_DISTRICT } },
  });
  assert.equal(districtPhotos.length, 2);

  // The Navigation global is published and maps to the CMS header and
  // footer (the site reads it server-side, as the repository does).
  const navigation = mapPayloadNavigation(
    await payload.findGlobal({
      slug: "navigation",
      depth: 1,
      draft: false,
      overrideAccess: true,
    }),
    "tr",
  );
  assert.ok(navigation);
  const labels = JSON.stringify(navigation);
  assert.ok(labels.includes(fixtureNavigationMarks.header));
  assert.ok(labels.includes(fixtureNavigationMarks.footer));
  // The CMS page child link resolves to the fixture page.
  assert.ok(labels.includes(`"/${fixtureSlugs.page}"`));

  await assert.rejects(seedFixtures(payload), /empty database only/);

  // With every seeded collection empty again, the filled Navigation global
  // alone still refuses a second seed (it would overwrite the menus).
  await payload.updateGlobal({
    slug: "navigation",
    data: { footerGroups: [], enFooter: [] },
  });
  for (const collection of SEEDED_COLLECTIONS)
    await payload.delete({ collection, where: { id: { exists: true } } });
  for (const collection of SEEDED_COLLECTIONS)
    assert.equal((await payload.count({ collection })).totalDocs, 0);
  await assert.rejects(
    seedFixtures(payload),
    /Navigation global already holds links/,
  );
});
