// Seeds the local, CI-only SQLite database with the clearly fictional
// published records of `fixture-content.ts`, through the Payload Local API
// (validation and publication hooks included), so the end-to-end checks
// render every detail template and the CMS block page:
//
//   DATABASE_URL=file:./.data/ci-fixtures.db npm run ci:seed-fixtures
//
// Hermetic by construction: it refuses anything but a SQLite file under
// .data/ or the temporary directory (the same rule as ci:sqlite-schema),
// refuses to run on Vercel, and refuses a database that already holds any
// article, book, page or photo, so it can never add records next to real
// content. It pushes the schema itself, like ci:sqlite-schema.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Payload, SanitizedConfig } from "payload";
import {
  FIXTURE_DISTRICT,
  FIXTURE_MARK,
  FIXTURE_MARK_EN,
  articleBody,
  bookReviewFields,
  districtGuideFields,
  fixtureImage,
  fixtureProblems,
  fixtureSlugs,
  navigationFields,
  pageLayout,
} from "./fixture-content";
import { resolveCiSqliteFile } from "./sqlite-schema";

/** Collections that must be empty before the fixtures are written. */
export const SEEDED_COLLECTIONS = [
  "articles",
  "books",
  "district-guides",
  "pages",
  "photos",
] as const;

/**
 * Why the environment may not be seeded, or null. Pure, so the refusal
 * rules are covered by node:test without a database.
 */
export function seedEnvironmentProblem(
  environment: Readonly<Record<string, string | undefined>>,
  cwd: string = process.cwd(),
  temporaryDirectory?: string,
): string | null {
  if (environment.VERCEL || environment.VERCEL_ENV)
    return "Refusing: the CI fixtures are never written on Vercel.";
  if (environment.PAYLOAD_DATABASE !== "sqlite")
    return "Refusing: PAYLOAD_DATABASE must be sqlite.";
  if (environment.PAYLOAD_STORAGE !== "local")
    return "Refusing: PAYLOAD_STORAGE must be local.";
  const file = resolveCiSqliteFile(
    environment.DATABASE_URL,
    cwd,
    temporaryDirectory,
  );
  if (file === null)
    return "Refusing: DATABASE_URL must be a file: URL under .data/ or the temporary directory.";
  // .data/ also holds the local development database (.data/payload.db):
  // the schema push and the fixtures go only into a dedicated ci-*.db file.
  if (
    file.startsWith(`${path.join(cwd, ".data")}${path.sep}`) &&
    !/^ci-[\w.-]*\.db$/.test(path.basename(file))
  )
    return "Refusing: under .data/ the fixtures go only into a ci-*.db file, never the local development database.";
  return null;
}

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

async function createMedia(payload: Payload): Promise<string> {
  const { default: sharp } = await import("sharp");
  const data = await sharp({
    create: {
      width: fixtureImage.width,
      height: fixtureImage.height,
      channels: 3,
      background: fixtureImage.background,
    },
  })
    .png()
    .toBuffer();
  const media = await payload.create({
    collection: "media",
    data: {
      alt: fixtureImage.alt,
      description: fixtureImage.description,
      sourceCopyright: fixtureImage.sourceCopyright,
    },
    file: {
      data,
      mimetype: "image/png",
      name: fixtureImage.filename,
      size: data.length,
    },
  });
  return String(media.id);
}

/**
 * Writes the fixtures through the Local API into an empty database and
 * returns the record count of each seeded collection.
 */
export async function seedFixtures(
  payload: Payload,
): Promise<Record<string, number>> {
  for (const collection of SEEDED_COLLECTIONS) {
    const { totalDocs } = await payload.count({ collection });
    if (totalDocs > 0)
      throw new Error(
        `Refusing: ${collection} already holds ${totalDocs} record(s); the fixtures go into an empty database only.`,
      );
  }
  const existingNavigation = await payload.findGlobal({
    slug: "navigation",
    depth: 0,
    draft: true,
  });
  if (
    (existingNavigation.headerItems?.length ?? 0) > 0 ||
    (existingNavigation.footerGroups?.length ?? 0) > 0 ||
    (existingNavigation.enFooter?.length ?? 0) > 0
  )
    throw new Error(
      "Refusing: the Navigation global already holds links; the fixtures go into an empty database only.",
    );

  const mediaId = await createMedia(payload);

  const category = await payload.create({
    collection: "categories",
    locale: "tr",
    data: { name: "CI test kategorisi", slug: "ci-test-kategorisi" },
  });
  await payload.update({
    collection: "categories",
    id: category.id,
    locale: "en",
    data: { name: "CI test category", slug: "ci-test-category" },
  });

  const article = await payload.create({
    collection: "articles",
    locale: "tr",
    data: {
      title: `${FIXTURE_MARK}: makale şablonu`,
      slug: fixtureSlugs.articleTr,
      excerpt:
        "Makale şablonunun sürekli entegrasyonda denetlenmesi için oluşturulan kurgusal kayıt.",
      content: articleBody("tr", mediaId),
      categories: [category.id],
      featuredImage: mediaId,
      featuredImageAlt: fixtureImage.alt,
      articleType: "article",
      publishedAt: minutesAgo(120),
      _status: "published",
    },
  });
  await payload.update({
    collection: "articles",
    id: article.id,
    locale: "en",
    data: {
      title: `${FIXTURE_MARK_EN}: article template`,
      slug: fixtureSlugs.articleEn,
      excerpt:
        "A fictional record that exists only to check the article template in continuous integration.",
      content: articleBody("en", mediaId),
      featuredImageAlt: "CI test image: a flat coloured rectangle",
      _status: "published",
    },
  });

  await payload.create({
    collection: "articles",
    locale: "tr",
    data: {
      title: `${FIXTURE_MARK}: ilçe haberi şablonu`,
      slug: fixtureSlugs.districtNews,
      excerpt:
        "İlçe haber listesinin dolu hâlini denetlemek için oluşturulan kurgusal kayıt; gerçek bir haber değildir.",
      categories: [category.id],
      articleType: "district-news",
      district: FIXTURE_DISTRICT,
      newsCategory: "yasam",
      externalSource: {
        name: "CI test kaynağı (kurgusal)",
        url: "https://example.org/ci-test-haberi",
      },
      publishedAt: minutesAgo(90),
      _status: "published",
    },
  });

  const englishBook = await payload.create({
    collection: "books",
    data: {
      ...bookReviewFields("en"),
      coverImage: mediaId,
      coverImageAlt: "CI test image: a flat coloured rectangle",
      translationStatus: "none",
      startedAt: minutesAgo(60 * 24 * 30),
      completedAt: minutesAgo(60 * 24 * 2),
      publishedAt: minutesAgo(80),
      _status: "published",
    },
  });
  await payload.create({
    collection: "books",
    data: {
      ...bookReviewFields("tr"),
      coverImage: mediaId,
      coverImageAlt: fixtureImage.alt,
      translation: englishBook.id,
      translationStatus: "completed",
      startedAt: minutesAgo(60 * 24 * 30),
      completedAt: minutesAgo(60 * 24 * 2),
      publishedAt: minutesAgo(70),
      _status: "published",
    },
  });

  const photoCollection = await payload.create({
    collection: "photo-collections",
    locale: "tr",
    data: {
      title: "CI test koleksiyonu",
      slug: "ci-test-koleksiyonu",
    },
  });
  await payload.update({
    collection: "photo-collections",
    id: photoCollection.id,
    locale: "en",
    data: {
      title: "CI test collection",
      slug: "ci-test-collection",
    },
  });
  const photo = await payload.create({
    collection: "photos",
    locale: "tr",
    data: {
      title: `${FIXTURE_MARK}: fotoğraf şablonu`,
      slug: fixtureSlugs.photoTr,
      description:
        "Fotoğraf detay şablonunun denetimi için üretilmiş düz renkli görsel.",
      altText: fixtureImage.alt,
      image: mediaId,
      collections: [photoCollection.id],
      // Also the hero of the district guide fixture.
      district: FIXTURE_DISTRICT,
      districtPhotoCategory: "sokak",
      neighborhood: "CI test mahallesi A",
      featured: true,
      photographer: "CI test",
      creditLicense: "Telif yok (üretilmiş görsel)",
      publishedAt: minutesAgo(60),
      _status: "published",
    },
  });
  await payload.update({
    collection: "photos",
    id: photo.id,
    locale: "en",
    data: {
      title: `${FIXTURE_MARK_EN}: photo template`,
      slug: fixtureSlugs.photoEn,
      description:
        "A generated flat colour image for the check of the photo template.",
      altText: "CI test image: a flat coloured rectangle",
      _status: "published",
    },
  });

  // The guide's gallery: an archive-style frame with a source record link.
  await payload.create({
    collection: "photos",
    locale: "tr",
    data: {
      title: `${FIXTURE_MARK}: ilçe arşiv karesi`,
      slug: fixtureSlugs.districtArchivePhoto,
      description:
        "İlçe rehberi galerisinin denetimi için üretilmiş düz renkli görsel.",
      altText: fixtureImage.alt,
      image: mediaId,
      collections: [photoCollection.id],
      district: FIXTURE_DISTRICT,
      districtPhotoCategory: "tarih",
      photographer: "CI test",
      creditLicense:
        "Telif yok (üretilmiş görsel) · Kaynak kaydı: https://example.org/ci-test-kaynak-kaydi",
      publishedAt: minutesAgo(55),
      _status: "published",
    },
  });

  await payload.create({
    collection: "district-guides",
    locale: "tr",
    data: districtGuideFields(Date.now()),
  });

  const page = await payload.create({
    collection: "pages",
    data: {
      title: `${FIXTURE_MARK}: sayfa blokları`,
      slug: fixtureSlugs.page,
      language: "tr",
      pageType: "standard",
      summary:
        "Standart sayfa bloklarının sürekli entegrasyonda denetlenmesi için oluşturulan kurgusal kayıt.",
      layout: pageLayout(mediaId),
      publishedAt: minutesAgo(50),
      seo: { index: false, follow: false },
      _status: "published",
    },
  });

  // Published, so the site reads it with NAVIGATION_PUBLIC_SOURCE=payload.
  await payload.updateGlobal({
    slug: "navigation",
    data: navigationFields(String(page.id)),
  });

  const counts: Record<string, number> = {};
  for (const collection of SEEDED_COLLECTIONS) {
    counts[collection] = (await payload.count({ collection })).totalDocs;
  }
  return counts;
}

async function main(): Promise<void> {
  const problem = seedEnvironmentProblem(process.env);
  if (problem) throw new Error(problem);
  const fixtures = fixtureProblems();
  if (fixtures.length > 0) throw new Error(fixtures.join("\n"));
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const file = resolveCiSqliteFile(databaseUrl);
  if (file === null) throw new Error("Refusing: unexpected DATABASE_URL.");
  mkdirSync(path.dirname(file), { recursive: true });

  const { default: configPromise } = await import("../../src/payload.config");
  const { sqliteAdapter } = await import("@payloadcms/db-sqlite");
  const { getPayload } = await import("payload");

  const config: SanitizedConfig = await configPromise;
  config.typescript.autoGenerate = false;
  Object.assign(
    config.db,
    sqliteAdapter({ client: { url: databaseUrl }, idType: "uuid", push: true }),
  );
  const payload = await getPayload({ config });
  try {
    const counts = await seedFixtures(payload);
    console.log(
      `CI fixtures seeded in ${path.relative(process.cwd(), file)}: ${JSON.stringify(counts)}`,
    );
  } finally {
    await payload.destroy();
  }
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
