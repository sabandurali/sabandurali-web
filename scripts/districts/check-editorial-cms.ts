/** Publishes ONLY in the disposable test database to exercise real public content. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  attachEditorial,
  batch1PopulationFacts,
  type EditorialBundle,
} from "./editorial";
import { decideImport, type ResearchBundle } from "./import-core";
const database = process.argv[2];
if (database !== "/tmp/istanbul-39-audit/editorial-test.db")
  throw new Error("Disposable editorial fixture database required.");
Object.assign(process.env, {
  NODE_ENV: "development",
  PAYLOAD_DATABASE: "sqlite",
  PAYLOAD_STORAGE: "local",
  DATABASE_URL: `file:${database}`,
  PAYLOAD_SECRET: "district-editorial-local-test",
});
const { default: configPromise } = await import("../../src/payload.config");
const config = await configPromise;
config.typescript.autoGenerate = false;
const { getPayload } = await import("payload");
const payload = await getPayload({ config });
const bundle = attachEditorial(
  JSON.parse(
    readFileSync("data/districts/research.json", "utf8"),
  ) as ResearchBundle,
  JSON.parse(
    readFileSync("data/districts/editorial.json", "utf8"),
  ) as EditorialBundle,
);
try {
  const articlesBefore = await payload.count({
    collection: "articles",
    overrideAccess: true,
  });
  const photosBefore = await payload.count({
    collection: "photos",
    overrideAccess: true,
  });
  const found = await payload.find({
    collection: "district-guides",
    locale: "tr",
    fallbackLocale: false,
    draft: true,
    limit: 100,
    overrideAccess: true,
  });
  assert.equal(found.totalDocs, 39);
  for (const row of bundle.districts) {
    const doc = found.docs.find((d) => d.district === row.district)!;
    assert.equal(
      decideImport(doc as unknown as Record<string, unknown>, row).reason,
      "unchanged source",
    );
    assert.equal(doc.summary, row.editorial!.sections.summary);
    await payload.update({
      collection: "district-guides",
      id: doc.id,
      locale: "tr",
      draft: false,
      overrideAccess: true,
      data: {
        _status: "published",
        publishedAt: new Date(Date.now() - 60000).toISOString(),
      },
    });
  }
  const publicDocs = await payload.find({
    collection: "district-guides",
    locale: "tr",
    fallbackLocale: false,
    draft: false,
    limit: 100,
    overrideAccess: false,
  });
  assert.equal(publicDocs.totalDocs, 39);
  for (const doc of publicDocs.docs) {
    const row = bundle.districts.find((r) => r.district === doc.district)!;
    assert.equal(doc.summary, row.editorial!.sections.summary);
    assert.deepEqual(
      doc.neighborhoods?.map((n) => n.name),
      row.editorial!.neighborhoods,
    );
    assert.ok(!doc.researchNotes && !doc.importProvenance);
    assert.ok(!doc.marketData);
    const expectedFacts =
      batch1PopulationFacts[
        doc.district as keyof typeof batch1PopulationFacts
      ];
    if (expectedFacts) {
      assert.equal(doc.facts?.population, expectedFacts.population);
      assert.equal(doc.facts?.populationYear, expectedFacts.populationYear);
    } else assert.ok(!doc.facts);
    assert.ok(!doc.planningDevelopments?.length);
  }
  assert.deepEqual(
    await payload.count({ collection: "articles", overrideAccess: true }),
    articlesBefore,
  );
  assert.deepEqual(
    await payload.count({ collection: "photos", overrideAccess: true }),
    photosBefore,
  );
  console.log(
    JSON.stringify(
      {
        result: "PASS",
        publishedInDisposableDatabase: 39,
        anonymousVerifiedGuides: 39,
        rawLeak: false,
        articlesUnchanged: articlesBefore.totalDocs,
        photosUnchanged: photosBefore.totalDocs,
        productionWrites: 0,
      },
      null,
      2,
    ),
  );
} finally {
  await payload.destroy();
}
