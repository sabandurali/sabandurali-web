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
const {
  getDistrictGuide,
  getDistrictGuideSummaries,
  getPublishedDistrictGuides,
} = await import("./districts/district-guide-data-source");
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

test("lists read summaries without the rich text and require a body", async (t) => {
  // The body is removed at the adapter level, bypassing the publish
  // validation that normally guarantees it.
  const bodiless = await payload.create({
    collection: "articles",
    draft: true,
    locale: "tr",
    data: {
      title: "Gövdesiz yazı",
      slug: "govdesiz",
      excerpt: "Özet",
      articleType: "article",
      publishedAt: minutesAgo(5),
      _status: "draft",
    } as never,
  });
  await payload.db.updateOne({
    collection: "articles",
    id: bodiless.id,
    data: { _status: "published" },
  });
  const find = t.mock.method(payload, "find");
  const listed = await articles.listPublished("tr");
  // The rich text is excluded in the query itself, not dropped afterwards.
  const articleReads = find.mock.calls.filter(
    (call) => call.arguments[0]?.collection === "articles",
  );
  assert.ok(articleReads.length > 0);
  for (const call of articleReads) {
    assert.deepEqual(call.arguments[0]?.select, { content: false });
  }
  find.mock.restore();
  assert.deepEqual(slugs(listed), ["kaynak", "hedef", "kadikoy-arastirmasi"]);
  for (const item of listed) assert.equal("content" in item, false);
  assert.equal(JSON.stringify(listed).includes("Gövde metni"), false);
  assert.deepEqual(
    slugs(
      await articles.listDistrictArticles(
        "district-news",
        "kadikoy",
        "tr",
        new Date(),
        1,
      ),
    ),
    ["kadikoy-haberi"],
  );
});

test("English rich text links only to complete translations", async () => {
  const english = await createArticle({
    title: "Bağlantılı yazı",
    slug: "baglantili",
    content: lexical(
      block("paragraph", [
        text("Hedef ve kaynak."),
        internalLink(target.id, "hedef"),
        internalLink(source.id, "kaynak"),
      ]),
    ),
  });
  await translateArticle(english.id, {
    title: "Linked article",
    slug: "linked",
    excerpt: "A sourced summary",
    content: lexical(
      block("paragraph", [
        text("Target and source."),
        internalLink(target.id, "target"),
        internalLink(source.id, "source"),
      ]),
    ),
  });

  const article = await articles.findPublishedBySlug("linked", "en");
  const serialized = JSON.stringify(article?.content);
  assert.ok(serialized.includes('"url":"/en/articles/target"'));
  // `source` is a half-finished translation that its own page refuses.
  assert.equal(serialized.includes("/en/articles/source"), false);
  await payload.delete({ collection: "articles", id: english.id });
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

  const published = await getPublishedDistrictGuides();
  assert.deepEqual([...published.keys()], ["kadikoy"]);
  assert.equal(published.get("kadikoy")?.summary, "Kadıköy özeti");
  assert.equal(published.get("kadikoy")?.life, null);
  assert.equal(JSON.stringify([...published]).includes("ÖZEL"), false);

  const page = await getDistrictPageData("kadikoy");
  assert.equal(page.guide?.summary, "Kadıköy özeti");
  assert.deepEqual(slugs(page.news), ["kadikoy-haberi"]);
  assert.deepEqual(slugs(page.research), ["kadikoy-arastirmasi"]);
  assert.deepEqual(slugs(page.photos), ["kare-100", "kare-101"]);
  assert.deepEqual(page.unavailableSections, []);
});

test("limited reads stop at the limit and news pages paginate in the database", async (t) => {
  t.mock.method(console, "warn", () => {});
  // Newest first; the English half translation is skipped and the limit is
  // filled from the next page instead of returning fewer items.
  assert.deepEqual(slugs(await articles.listPublished("tr", new Date(), 2)), [
    "kaynak",
    "hedef",
  ]);
  assert.deepEqual(slugs(await articles.listPublished("en", new Date(), 1)), [
    "target",
  ]);

  for (const index of [1, 2, 3, 4]) {
    await createArticle({
      title: `Kadıköy haberi ${index}`,
      slug: `kadikoy-haberi-${index}`,
      articleType: "district-news",
      district: "kadikoy",
      content: null,
      publishedAt: minutesAgo(10 * index),
      externalSource: {
        name: "Kadıköy Belediyesi",
        url: `https://www.kadikoy.bel.tr/haber-${index}`,
      },
    });
  }
  const find = t.mock.method(payload, "find");
  const second = await articles.listDistrictNewsPage("kadikoy", 2, 2);
  // One page of `pageSize` documents is read, not the district's history.
  const newsReads = find.mock.calls.filter(
    (call) => call.arguments[0]?.collection === "articles",
  );
  assert.equal(newsReads.length, 1);
  assert.equal(newsReads[0]?.arguments[0]?.limit, 2);
  find.mock.restore();
  assert.deepEqual(slugs(second.items), [
    "kadikoy-haberi-3",
    "kadikoy-haberi-4",
  ]);
  assert.deepEqual(
    { ...second, items: undefined },
    { items: undefined, currentPage: 2, totalPages: 3, totalItems: 5 },
  );
  // A page past the end is the last page; an empty district is one page.
  const last = await articles.listDistrictNewsPage("kadikoy", 99, 2);
  assert.equal(last.currentPage, 3);
  assert.deepEqual(slugs(last.items), ["kadikoy-haberi"]);
  assert.deepEqual(await articles.listDistrictNewsPage("besiktas", 4, 2), {
    items: [],
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
});

test("home photos put Istanbul photos first with two limited reads", async () => {
  const nature = await payload.create({
    collection: "photo-collections",
    data: { title: "Doğa", slug: "doga", _status: "published" } as never,
    locale: "tr",
  });
  await payload.update({
    collection: "photo-collections",
    id: nature.id,
    locale: "en",
    data: { title: "Nature", slug: "nature", _status: "published" } as never,
  });
  const other = await payload.create({
    collection: "photos",
    locale: "tr",
    data: {
      title: "Deniz feneri",
      slug: "deniz-feneri",
      altText: "Deniz feneri",
      image: media.id,
      collections: [nature.id],
      photographer: "Şaban Durali",
      publishedAt: minutesAgo(0.5),
      _status: "published",
    } as never,
  });
  await payload.update({
    collection: "photos",
    id: other.id,
    locale: "en",
    data: {
      title: "Lighthouse",
      slug: "lighthouse",
      altText: "Lighthouse",
      _status: "published",
    } as never,
  });

  // 27 Turkish Istanbul photos: the newer lighthouse does not make it.
  assert.deepEqual(slugs(await photos.listHomePhotos("tr", 4)), [
    "kare-0",
    "kare-1",
    "kare-2",
    "kare-3",
  ]);
  // Two English Istanbul photos, then the newest other one.
  assert.deepEqual(slugs(await photos.listHomePhotos("en", 4)), [
    "frame-100",
    "frame-101",
    "lighthouse",
  ]);
  await payload.delete({ collection: "photos", id: other.id });
  await payload.delete({ collection: "photo-collections", id: nature.id });
});

const { PayloadPublicBookReviewRepository } =
  await import("./books/payload-book-review-repository");
const { PayloadPublicPageRepository } =
  await import("./pages/payload-page-repository");

const bookReviews = new PayloadPublicBookReviewRepository();
const pages = new PayloadPublicPageRepository();

// Books and pages are created at the adapter level: the publication hooks
// are covered in cms.integration.test.ts, the read rules are checked here.
async function createBook(data: Record<string, unknown>) {
  return payload.db.create({
    collection: "books",
    req: {},
    data: {
      _status: "published",
      language: "tr",
      // Array rows need their own IDs below the Local API.
      authors: [
        { id: crypto.randomUUID(), name: "Cal Newport", slug: "cal-newport" },
      ],
      category: "business_and_management",
      coverImage: media.id,
      coverImageAlt: "Kitap kapağı",
      personalEvaluation: "Kişisel değerlendirme",
      rating: 4,
      readingStatus: "planned",
      reviewStatus: "published",
      summary: "Kitap özeti",
      translationStatus: "none",
      publishedAt: minutesAgo(60),
      seo: {
        title: "Kitap | Şaban Durali",
        description: "Kitap incelemesi",
        index: true,
        follow: true,
      },
      ...data,
    },
  });
}

test("book reviews: public rules, both translation directions, limits and narrow population", async (t) => {
  t.mock.method(console, "warn", () => {});
  const english = await createBook({
    title: "Deep Work",
    slug: "deep-work",
    language: "en",
    publishedAt: minutesAgo(50),
  });
  // The Turkish review points to the English one; the English one does not
  // point back.
  await createBook({
    title: "Derin Çalışma",
    slug: "derin-calisma",
    translation: english.id,
    relatedBooks: [english.id],
    publishedAt: minutesAgo(40),
  });
  await createBook({
    title: "Eski inceleme",
    slug: "eski-inceleme",
    publishedAt: minutesAgo(400),
  });
  await createBook({
    title: "İndekssiz",
    slug: "indekssiz",
    publishedAt: minutesAgo(10),
    seo: {
      title: "İndekssiz",
      description: "İndekssiz",
      index: false,
      follow: true,
    },
  });
  await createBook({
    title: "Arşivlenmiş",
    slug: "arsivlenmis",
    reviewStatus: "archived",
    publishedAt: minutesAgo(5),
  });
  await createBook({
    title: "Zamanlanmış",
    slug: "zamanlanmis",
    publishedAt: new Date(Date.now() + 60 * 60_000).toISOString(),
  });

  const find = t.mock.method(payload, "find");
  const turkish = await bookReviews.listPublished("tr");
  // Related books are populated with their ID and update date only.
  const bookReads = find.mock.calls.filter(
    (call) => call.arguments[0]?.collection === "books",
  );
  assert.ok(bookReads.length > 0);
  for (const call of bookReads) {
    assert.deepEqual(call.arguments[0]?.populate, {
      books: { updatedAt: true },
    });
  }
  find.mock.restore();
  assert.deepEqual(slugs(turkish), ["derin-calisma", "eski-inceleme"]);
  // The repository returns public types: no editorial field leaves it.
  for (const review of turkish) {
    for (const field of ["reviewStatus", "relatedBookIds", "showOnHomepage"]) {
      assert.equal(field in review, false, field);
    }
  }
  assert.deepEqual(
    slugs(await bookReviews.listPublished("tr", new Date(), 1)),
    ["derin-calisma"],
  );
  for (const slug of ["indekssiz", "arsivlenmis", "zamanlanmis"]) {
    assert.equal(await bookReviews.findPublishedBySlug(slug, "tr"), null, slug);
  }

  const turkishReview = await bookReviews.findPublishedBySlug(
    "derin-calisma",
    "tr",
  );
  const englishReview = await bookReviews.findPublishedBySlug(
    "deep-work",
    "en",
  );
  assert.ok(turkishReview && englishReview);
  assert.equal(
    (await bookReviews.findPublishedTranslation(turkishReview, "en"))?.slug,
    "deep-work",
  );
  // The back link is found by querying the other side's `translation`.
  assert.equal(
    (await bookReviews.findPublishedTranslation(englishReview, "tr"))?.slug,
    "derin-calisma",
  );
});

async function createPage(data: Record<string, unknown>) {
  return payload.db.create({
    collection: "pages",
    req: {},
    data: {
      _status: "published",
      language: "tr",
      pageType: "standard",
      summary: "Sayfa özeti",
      publishedAt: minutesAgo(60),
      seo: { index: true, follow: true },
      ...data,
    },
  });
}

test("pages: the home falls back to the legacy record and never to another language", async (t) => {
  t.mock.method(console, "warn", () => {});
  const legacy = await createPage({ title: "Ana sayfa", slug: "ana-sayfa" });
  await createPage({ title: "Projeler", slug: "projeler" });
  await createPage({
    title: "Taslak sayfa",
    slug: "taslak-sayfa",
    _status: "draft",
  });

  // Without a home record the legacy "ana-sayfa" page is served as home.
  const fallback = await pages.findHome("tr");
  assert.equal(fallback?.id, legacy.id);
  assert.equal(fallback?.pageType, "home");
  // The English home never falls back to Turkish content.
  assert.equal(await pages.findHome("en"), null);

  const home = await createPage({
    title: "Ana sayfa kaydı",
    slug: "anasayfa-kaydi",
    pageType: "home",
  });
  assert.equal((await pages.findHome("tr"))?.id, home.id);
  assert.equal(await pages.findHome("en"), null);

  assert.equal(
    (await pages.findStandardBySlug("projeler", "tr"))?.slug,
    "projeler",
  );
  assert.equal(await pages.findStandardBySlug("taslak-sayfa", "tr"), null);
  assert.equal(await pages.findStandardBySlug("projeler", "en"), null);
  assert.deepEqual(slugs(await pages.listStandards("tr")), [
    "ana-sayfa",
    "projeler",
  ]);
});
