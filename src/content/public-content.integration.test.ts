/**
 * The public content repositories and data sources against a throwaway
 * SQLite database whose schema is pushed from the Payload config. They are
 * the code that turns CMS records into public pages, so the database
 * filters, Local API options (select, populate, locale) and rich text
 * population are checked here, not only the pure condition builders.
 * Nothing touches `.data/`, `public/media` or any remote service.
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { register } from "node:module";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import type { Payload, SanitizedConfig } from "payload";

// `server-only` is resolved by Next and is not installed as a package; the
// data sources import it, so it is an empty module outside Next.
register(
  "data:text/javascript," +
    encodeURIComponent(
      'export async function resolve(specifier, context, next) { if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true }; return next(specifier, context); }',
    ),
);

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "public-content-integration-"),
);
const databaseUrl = `file:${path.join(temporaryDirectory, "content.db")}`;

Object.assign(process.env, {
  DATABASE_URL: databaseUrl,
  DISABLE_PAYLOAD_HMR: "true",
  PAYLOAD_DATABASE: "sqlite",
  PAYLOAD_SECRET:
    process.env.PAYLOAD_SECRET || "public-content-integration-only-secret",
  PAYLOAD_STORAGE: "local",
  ARTICLE_PUBLIC_SOURCE: "payload",
  PAGE_PUBLIC_SOURCE: "payload",
  PHOTO_PUBLIC_SOURCE: "payload",
});

const { default: configPromise } = await import("../payload.config");
const { sqliteAdapter } = await import("@payloadcms/db-sqlite");
const { getPayload } = await import("payload");

const config: SanitizedConfig = await configPromise;
config.typescript.autoGenerate = false;
Object.assign(
  config.db,
  sqliteAdapter({ client: { url: databaseUrl }, idType: "uuid", push: true }),
);

const payload: Payload = await getPayload({ config });

after(async () => {
  await payload.destroy();
  await rm(temporaryDirectory, { force: true, recursive: true });
});

const { PayloadPublicArticleRepository } =
  await import("./articles/payload-article-repository");
const { getPublishedArticlePageData } =
  await import("./articles/article-data-source");
const { PayloadPublicPhotoRepository } =
  await import("./photos/payload-photo-repository");
const { getDistrictGuide, getDistrictGuideSummaries } =
  await import("./districts/district-guide-data-source");
const { getDistrictPageData } = await import("./districts/district-page-data");

const articles = new PayloadPublicArticleRepository();
const photos = new PayloadPublicPhotoRepository();

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

function text(value: string) {
  return {
    type: "text",
    text: value,
    format: 0,
    detail: 0,
    mode: "normal",
    style: "",
    version: 1,
  };
}

function block(type: "paragraph" | "heading", children: unknown[]) {
  return {
    type,
    ...(type === "heading" ? { tag: "h2" } : {}),
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  };
}

function lexical(...children: unknown[]) {
  return {
    root: {
      type: "root",
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  };
}

function internalLink(id: string, label: string) {
  return {
    type: "link",
    fields: {
      linkType: "internal",
      newTab: false,
      doc: { relationTo: "articles", value: id },
    },
    children: [text(label)],
    direction: "ltr",
    format: "",
    indent: 0,
    version: 3,
  };
}

function slugs(items: ReadonlyArray<{ slug: string }>): string[] {
  return items.map((item) => item.slug);
}

const words = (count: number) =>
  Array.from({ length: count }, () => "kelime").join(" ");

// Seed data. Media rows are created at the adapter level (no file upload).
const media = await payload.db.create({
  collection: "media",
  data: {
    alt: "Kadıköy rıhtımı",
    description: "Kadıköy iskelesi, sabah",
    sourceCopyright: "Şaban Durali · CC BY 4.0",
    filename: "kadikoy.jpg",
    mimeType: "image/jpeg",
    url: "/api/media/file/kadikoy.jpg",
    width: 1600,
    height: 900,
  },
});
const category = await payload.create({
  collection: "categories",
  data: { name: "Şehir", slug: "sehir" } as never,
  locale: "tr",
});
await payload.update({
  collection: "categories",
  id: category.id,
  locale: "en",
  data: { name: "City", slug: "city" } as never,
});

async function createArticle(data: Record<string, unknown>) {
  return payload.create({
    collection: "articles",
    locale: "tr",
    data: {
      excerpt: "Kaynaklı özet",
      content: lexical(block("paragraph", [text("Gövde metni")])),
      categories: [category.id],
      articleType: "article",
      publishedAt: minutesAgo(60),
      _status: "published",
      ...data,
    } as never,
  });
}

async function translateArticle(id: string, data: Record<string, unknown>) {
  await payload.update({
    collection: "articles",
    id,
    locale: "en",
    data: { _status: "published", ...data } as never,
  });
}

const target = await createArticle({ title: "Hedef yazı", slug: "hedef" });
const draft = await createArticle({
  title: "Taslak yazı",
  slug: "taslak",
  _status: "draft",
});
const news = await createArticle({
  title: "Kadıköy haberi",
  slug: "kadikoy-haberi",
  articleType: "district-news",
  district: "kadikoy",
  content: null,
  externalSource: {
    name: "Kadıköy Belediyesi",
    url: "https://www.kadikoy.bel.tr/haber",
  },
});
const research = await createArticle({
  title: "Kadıköy araştırması",
  slug: "kadikoy-arastirmasi",
  articleType: "district-research",
  district: "kadikoy",
  publishedAt: minutesAgo(90),
});
const source = await createArticle({
  title: "Kaynak yazı",
  slug: "kaynak",
  publishedAt: minutesAgo(30),
  content: lexical(
    block("heading", [text("Konum")]),
    block("paragraph", [
      text(words(40)),
      internalLink(target.id, "hedefe"),
      internalLink(draft.id, "taslağa"),
      internalLink(news.id, "habere"),
    ]),
    {
      type: "upload",
      relationTo: "media",
      value: media.id,
      // Uploads inserted from the editor toolbar are stored without fields.
      fields: null,
      format: "",
      id: "upload-node-1",
      version: 3,
    },
  ),
});
await translateArticle(target.id, {
  title: "Target article",
  slug: "target",
  excerpt: "A sourced summary",
  content: lexical(block("paragraph", [text("Body text")])),
});
// Only a first paragraph: a half-finished English translation.
await translateArticle(source.id, {
  title: "Source article",
  slug: "source",
  excerpt: "A sourced summary",
  content: lexical(block("paragraph", [text("Only the first paragraph.")])),
});

test("article reads filter in the database and prepare rich text for the page", async () => {
  const article = await articles.findPublishedBySlug("kaynak", "tr");

  assert.ok(article);
  assert.equal(article.content.source, "lexical");
  const root =
    article.content.source === "lexical" ? article.content.data?.root : null;
  assert.ok(root);
  const [, paragraph, upload] = root.children as Array<Record<string, unknown>>;
  const links = (paragraph?.children as Array<Record<string, unknown>>).filter(
    (node) => node.type === "link",
  );

  // A published target becomes its public path; a draft or a district news
  // target stays an unresolved internal link that renders as plain text.
  assert.deepEqual(
    links.map((node) => node.fields),
    [
      { linkType: "custom", newTab: false, doc: null, url: "/makaleler/hedef" },
      { linkType: "internal", newTab: false, doc: null },
      { linkType: "internal", newTab: false, doc: null },
    ],
  );
  // The toolbar upload keeps only the public media fields, with its credit.
  assert.equal(upload?.fields, null);
  assert.deepEqual(upload?.value, {
    id: media.id,
    url: "/api/media/file/kadikoy.jpg",
    mimeType: "image/jpeg",
    filename: "kadikoy.jpg",
    alt: "Kadıköy rıhtımı",
    width: 1600,
    height: 900,
    description: "Kadıköy iskelesi, sabah",
    sourceCopyright: "Şaban Durali · CC BY 4.0",
  });

  // District news has no standalone article page (COR-11).
  assert.equal(
    await articles.findPublishedBySlug("kadikoy-haberi", "tr"),
    null,
  );
  assert.deepEqual(slugs(await articles.listPublished("tr")), [
    "kaynak",
    "hedef",
    "kadikoy-arastirmasi",
  ]);
  assert.deepEqual(slugs(await articles.listByCategory("sehir", "tr")), [
    "kaynak",
    "hedef",
    "kadikoy-arastirmasi",
  ]);
  assert.deepEqual(
    slugs(
      await articles.listDistrictArticles("district-research", "kadikoy", "tr"),
    ),
    ["kadikoy-arastirmasi"],
  );
  assert.deepEqual(
    slugs(
      await articles.listDistrictArticles("district-news", "kadikoy", "tr"),
    ),
    ["kadikoy-haberi"],
  );
});

test("English lists, pages and links only offer complete translations", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});

  // Untranslated articles are skipped by the database, the half translation
  // by the completeness rule (COR-16).
  assert.deepEqual(slugs(await articles.listPublished("en")), ["target"]);
  assert.deepEqual(slugs(await articles.listByCategory("city", "en")), [
    "target",
  ]);
  assert.equal(
    await articles.findPublishedTranslation(research.id, "en"),
    null,
    "a Turkish-only article has no English version",
  );
  assert.equal(
    (await getPublishedArticlePageData("source", "en")).article,
    null,
  );
  assert.equal(
    (await getPublishedArticlePageData("kaynak", "tr")).translation,
    null,
  );
  assert.equal(
    (await getPublishedArticlePageData("hedef", "tr")).translation?.slug,
    "target",
  );
  assert.equal(
    (await getPublishedArticlePageData("target", "en")).translation?.slug,
    "hedef",
  );

  // Only the half translation is reported; untranslated articles are not.
  const lines = warn.mock.calls.map((call) => String(call.arguments[0]));
  assert.ok(lines.length > 0);
  assert.ok(lines.every((line) => line.includes(`"id":"${source.id}"`)));
});

test("photo lists paginate, count and filter translated photos in the database", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const collection = await payload.create({
    collection: "photo-collections",
    data: {
      title: "İstanbul",
      slug: "istanbul",
      _status: "published",
    } as never,
    locale: "tr",
  });
  await payload.update({
    collection: "photo-collections",
    id: collection.id,
    locale: "en",
    data: {
      title: "Istanbul",
      slug: "istanbul-en",
      _status: "published",
    } as never,
  });
  const tag = await payload.create({
    collection: "tags",
    data: { title: "Kule", slug: "kule" } as never,
    locale: "tr",
  });

  async function createPhoto(index: number, data: Record<string, unknown>) {
    return payload.create({
      collection: "photos",
      locale: "tr",
      data: {
        title: `Kare ${index}`,
        slug: `kare-${index}`,
        altText: "Alternatif metin",
        image: media.id,
        collections: [collection.id],
        photographer: "Şaban Durali",
        publishedAt: minutesAgo(index + 1),
        _status: "published",
        ...data,
      } as never,
    });
  }

  // 25 newer Turkish-only photos and two older translated ones.
  for (let index = 0; index < 25; index += 1) {
    await createPhoto(index, { district: "beyoglu" });
  }
  for (const index of [100, 101]) {
    const photo = await createPhoto(index, {
      district: "kadikoy",
      tags: [tag.id],
    });
    await payload.update({
      collection: "photos",
      id: photo.id,
      locale: "en",
      data: {
        title: `Frame ${index}`,
        slug: `frame-${index}`,
        altText: "Alt text",
        _status: "published",
      } as never,
    });
  }

  const english = await photos.listPublished("en");
  assert.deepEqual(slugs(english.photos), ["frame-100", "frame-101"]);
  assert.equal(english.totalItems, 2);
  assert.equal(english.totalPages, 1);
  assert.deepEqual(slugs(english.collections), ["istanbul-en"]);

  const secondPage = await photos.listPublished("tr", { page: 2 });
  assert.equal(secondPage.totalItems, 27);
  assert.equal(secondPage.totalPages, 2);
  assert.deepEqual(slugs(secondPage.collections), ["istanbul"]);
  assert.deepEqual(slugs(secondPage.tags), ["kule"]);
  assert.deepEqual(slugs(secondPage.photos), [
    "kare-24",
    "kare-100",
    "kare-101",
  ]);
  // Past the end, Payload reports no total when the query joins tables.
  assert.deepEqual(await photos.listPublished("tr", { page: 9 }), secondPage);
  const tagged = await photos.listPublished("tr", { tag: "kule", page: 5 });
  assert.deepEqual(slugs(tagged.photos), ["kare-100", "kare-101"]);
  assert.equal(tagged.page, 1);
  assert.equal(tagged.totalItems, 2);
  assert.equal((await photos.listPublished("en", { page: 3 })).totalItems, 2);
  assert.deepEqual(slugs(await photos.listByDistrict("kadikoy", "tr")), [
    "kare-100",
    "kare-101",
  ]);
  assert.deepEqual(slugs(await photos.listByCollectionOrTag("kule", "tr")), [
    "kare-100",
    "kare-101",
  ]);

  const frame = await photos.findPublishedBySlug("kare-100", "tr");
  assert.ok(frame);
  assert.deepEqual(slugs(await photos.related(frame)), [
    "kare-0",
    "kare-1",
    "kare-2",
    "kare-3",
  ]);
  const turkishOnly = await photos.findPublishedBySlug("kare-0", "tr");
  assert.ok(turkishOnly);
  assert.equal(await photos.findPublishedByID(turkishOnly.id, "en"), null);
  assert.equal(warn.mock.callCount(), 0, "untranslated photos are not issues");
});

test("district guides: one summary query, allowlisted fields, isolated sections", async () => {
  const checkedAt = minutesAgo(24 * 60);
  await payload.create({
    collection: "district-guides",
    locale: "tr",
    data: {
      district: "kadikoy",
      summary: "Kadıköy özeti",
      history: "Kadıköy tarihçesi",
      geography: "Kadıköy coğrafyası",
      life: "Kaynağı olmayan yaşam metni",
      reviewedSections: ["summary", "history", "geography", "life"],
      sources: [
        {
          title: "Kadıköy Belediyesi",
          publisher: "Kadıköy Belediyesi",
          url: "https://www.kadikoy.bel.tr/",
          sourceType: "official",
          primary: true,
          checkedAt,
          dataDate: checkedAt,
          needsVerification: false,
          sections: ["summary", "history", "geography"],
        },
      ],
      researchNotes: "ÖZEL-ARAŞTIRMA-NOTU",
      _status: "published",
      publishedAt: minutesAgo(60),
    } as never,
  });

  const summaries = await getDistrictGuideSummaries();
  assert.deepEqual([...summaries.entries()], [["kadikoy", "Kadıköy özeti"]]);

  const guide = await getDistrictGuide("kadikoy");
  assert.equal(guide?.summary, "Kadıköy özeti");
  assert.equal(guide?.life, null, "reviewed but not supported by a source");
  assert.equal(JSON.stringify(guide).includes("ÖZEL-ARAŞTIRMA-NOTU"), false);
  assert.equal(await getDistrictGuide("besiktas"), null);

  const page = await getDistrictPageData("kadikoy");
  assert.equal(page.guide?.summary, "Kadıköy özeti");
  assert.deepEqual(slugs(page.news), ["kadikoy-haberi"]);
  assert.deepEqual(slugs(page.research), ["kadikoy-arastirmasi"]);
  assert.deepEqual(slugs(page.photos), ["kare-100", "kare-101"]);
  assert.deepEqual(page.unavailableSections, []);
});
