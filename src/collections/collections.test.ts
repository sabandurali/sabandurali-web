import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  ValidationError,
  type Access,
  type CollectionBeforeChangeHook,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type Field,
  type PayloadRequest,
  type RichTextField,
  type Tab,
} from "payload";
import {
  Articles,
  validateArticleContent,
  validateNewsSourceName,
  validateNewsSourceUrl,
} from "./Articles";
import { Books, normalizeAndValidateBook } from "./Books";
import { Categories } from "./Categories";
import {
  DistrictGuides,
  PUBLIC_DISTRICT_GUIDE_QUERY_PATHS,
} from "./DistrictGuides";
import { PUBLIC_DISTRICT_GUIDE_DOCUMENT_KEYS } from "../content/districts/district-guide-projection";
import { MEDIA_MAX_IMAGE_EDGE, Media } from "./Media";
import {
  LEGACY_TURKISH_HOME_SLUG,
  Pages,
  getHomeBreakingChanges,
  getUnrenderableHomeBlocks,
  protectPublishedHomePage,
  RESERVED_TURKISH_SLUGS,
  validatePageIdentity,
} from "./Pages";
import { PhotoCollections } from "./PhotoCollections";
import { Photos } from "./Photos";
import { Tags } from "./Tags";
import {
  LOGIN_LOCK_TIME_MS,
  MAX_LOGIN_ATTEMPTS,
  Users,
  assignFirstUserAdminRole,
  refusePasswordResetWithoutEmail,
} from "./Users";
import { Navigation, getNavigationPageFilter } from "../globals/Navigation";
import { denyAnonymousRestReads } from "../lib/payloadAccess";
import {
  preventDeletingLastAdmin,
  preventDemotingLastAdmin,
} from "../lib/payloadDeleteGuards";
import { revalidateNavigationAfterChange } from "../lib/revalidation";

const appDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../app",
);

const admin = { id: "u-admin", role: "admin" };
const editor = { id: "u-editor", role: "editor" };

/** Every field, including those nested in tabs, rows, collapsibles and groups. */
function flattenFields(fields: readonly Field[]): Field[] {
  return fields.flatMap((field) => {
    if (field.type === "tabs") {
      return [field, ...field.tabs.flatMap((tab) => flattenFields(tab.fields))];
    }
    if ("fields" in field && Array.isArray(field.fields)) {
      return [field, ...flattenFields(field.fields)];
    }
    return [field];
  });
}

function findField(collection: { fields: Field[] }, name: string): Field {
  const field = flattenFields(collection.fields).find(
    (candidate) => "name" in candidate && candidate.name === name,
  );
  assert.ok(field, `field ${name} must exist`);
  return field;
}

function runAccess(access: Access | undefined, user: unknown): unknown {
  assert.ok(access);
  return access({ req: { user } } as Parameters<Access>[0]);
}

function validationErrors(
  error: unknown,
): Array<{ message: string; path: string }> {
  assert.ok(error instanceof ValidationError, String(error));
  const errors = (error.data as { errors?: unknown }).errors;
  assert.ok(Array.isArray(errors));
  return errors as Array<{ message: string; path: string }>;
}

test("new users are editors; the first user is always an admin", async () => {
  const role = findField(Users, "role");
  assert.equal(
    "defaultValue" in role ? role.defaultValue : undefined,
    "editor",
  );

  const runFirstUser = (totalDocs: number, operation: "create" | "update") =>
    assignFirstUserAdminRole({
      collection: {},
      context: {},
      data: { email: "owner@example.com", role: "editor" },
      operation,
      req: {
        payload: { count: async () => ({ totalDocs }) },
      },
    } as unknown as Parameters<CollectionBeforeChangeHook>[0]);

  assert.deepEqual(await runFirstUser(0, "create"), {
    email: "owner@example.com",
    role: "admin",
  });
  assert.deepEqual(await runFirstUser(1, "create"), {
    email: "owner@example.com",
    role: "editor",
  });
  assert.deepEqual(await runFirstUser(0, "update"), {
    email: "owner@example.com",
    role: "editor",
  });

  assert.deepEqual(Users.hooks?.beforeChange, [
    assignFirstUserAdminRole,
    preventDemotingLastAdmin,
  ]);
  assert.deepEqual(Users.hooks?.beforeDelete, [preventDeletingLastAdmin]);
});

test("session cookies and login lockout are explicit", () => {
  assert.ok(typeof Users.auth === "object");
  assert.equal(Users.auth.cookies?.sameSite, "Lax");
  assert.equal(
    Users.auth.cookies?.secure,
    process.env.VERCEL_ENV === "production" ||
      process.env.VERCEL_ENV === "preview",
  );
  assert.equal(Users.auth.maxLoginAttempts, MAX_LOGIN_ATTEMPTS);
  assert.equal(Users.auth.lockTime, LOGIN_LOCK_TIME_MS);

  // Payload's default unlock access admits every signed-in user, which would
  // let an editor reset an admin's lockout between password guesses.
  assert.equal(runAccess(Users.access?.unlock, admin), true);
  assert.equal(runAccess(Users.access?.unlock, editor), false);
  assert.equal(runAccess(Users.access?.unlock, null), false);
});

test("password reset is refused while no email adapter exists", () => {
  const run = (operation: string, emailAdapter: string) =>
    refusePasswordResetWithoutEmail({
      args: { data: { email: "owner@example.com" } },
      collection: {},
      context: {},
      operation,
      req: { payload: { email: { name: emailAdapter } } },
    } as unknown as Parameters<CollectionBeforeOperationHook>[0]);

  assert.throws(
    () => run("forgotPassword", "console"),
    (error: unknown) =>
      error instanceof Error &&
      "status" in error &&
      error.status === 403 &&
      error.name === "Forbidden" &&
      /henüz yapılandırılmadı/.test(error.message),
  );
  assert.deepEqual(run("forgotPassword", "resend"), {
    data: { email: "owner@example.com" },
  });
  assert.deepEqual(run("login", "console"), {
    data: { email: "owner@example.com" },
  });
});

test("only admins delete content that keeps a version history", () => {
  for (const collection of [Articles, Books, Pages, Photos, DistrictGuides]) {
    assert.equal(
      runAccess(collection.access?.delete, admin),
      true,
      collection.slug,
    );
    assert.equal(
      runAccess(collection.access?.delete, editor),
      false,
      collection.slug,
    );
    assert.equal(
      runAccess(collection.access?.delete, null),
      false,
      collection.slug,
    );
  }
});

test("every content collection and the Navigation global revalidate public pages", () => {
  for (const collection of [
    Articles,
    Books,
    Categories,
    DistrictGuides,
    Media,
    Pages,
    PhotoCollections,
    Photos,
    Tags,
  ]) {
    assert.equal(collection.hooks?.afterChange?.length, 1, collection.slug);
    assert.equal(collection.hooks?.afterDelete?.length, 1, collection.slug);
  }
  assert.deepEqual(Navigation.hooks?.afterChange, [
    revalidateNavigationAfterChange,
  ]);
});

test("image fields only accept image media", () => {
  const imageFields: Array<[CollectionConfig, string]> = [
    [Articles, "featuredImage"],
    [Books, "coverImage"],
    [Books, "openGraphImage"],
    [Pages, "socialImage"],
    [Photos, "image"],
    [Photos, "openGraphImage"],
    [DistrictGuides, "image"],
  ];

  for (const [collection, name] of imageFields) {
    const field = findField(collection, name);
    assert.ok("filterOptions" in field, `${collection.slug}.${name}`);
    assert.deepEqual(field.filterOptions, { mimeType: { contains: "image/" } });
  }
});

test("uploaded images are re-encoded without EXIF and capped in size", () => {
  assert.ok(typeof Media.upload === "object");
  assert.equal(Media.upload.withMetadata, false);
  assert.deepEqual(Media.upload.resizeOptions, {
    fit: "inside",
    height: MEDIA_MAX_IMAGE_EDGE,
    width: MEDIA_MAX_IMAGE_EDGE,
    withoutEnlargement: true,
  });
  assert.deepEqual(Media.hooks?.beforeOperation, [denyAnonymousRestReads]);
  assert.equal(runAccess(Media.access?.read, null), true, "files stay public");
});

test("District Guides refuse anonymous queries on hidden fields", () => {
  const [allowlist] = DistrictGuides.hooks?.beforeOperation ?? [];
  assert.ok(allowlist);

  const run = (where: Record<string, unknown>) =>
    allowlist({
      args: { where },
      collection: {},
      context: {},
      operation: "read",
      req: { payloadAPI: "REST", user: null },
    } as unknown as Parameters<CollectionBeforeOperationHook>[0]);

  assert.throws(() =>
    run({ "marketData.salePricePerM2": { greater_than: 1 } }),
  );
  assert.throws(() => run({ "sources.url": { like: "gov" } }));
  assert.doesNotThrow(() =>
    run({
      and: [
        { _status: { equals: "published" } },
        { district: { equals: "esenler" } },
        { publishedAt: { less_than_equal: "2026-10-28T00:00:00.000Z" } },
      ],
    }),
  );
  assert.deepEqual([...PUBLIC_DISTRICT_GUIDE_QUERY_PATHS].sort(), [
    "_status",
    "createdAt",
    "district",
    "id",
    "publishedAt",
    "updatedAt",
  ]);
});

test("District Guides return the allowlisted public document to anonymous readers", async () => {
  const [project] = DistrictGuides.hooks?.afterRead ?? [];
  assert.ok(project);

  const stored = {
    id: "guide-1",
    district: "esenler",
    _status: "published",
    publishedAt: "2026-09-13T10:00:00Z",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-13T11:00:00Z",
    summary: "İncelenmemiş özet",
    neighborhoods: [{ id: "n1", name: "Örnek", image: "media-secret-id" }],
    researchNotes: "PRIVATE-RESEARCH-NOTES",
    importProvenance: { pdfSha256: "PRIVATE-PROVENANCE" },
    internalComment: "PRIVATE-FUTURE-FIELD",
  };
  const run = (user: unknown, overrideAccess = false) =>
    project({
      doc: stored,
      overrideAccess,
      req: { user },
    } as unknown as Parameters<NonNullable<typeof project>>[0]);

  const anonymous: unknown = await run(null);
  const keys = Object.keys(anonymous as Record<string, unknown>);
  assert.deepEqual(
    keys.filter(
      (key) =>
        !(PUBLIC_DISTRICT_GUIDE_DOCUMENT_KEYS as readonly string[]).includes(
          key,
        ),
    ),
    [],
  );
  assert.equal(JSON.stringify(anonymous).includes("PRIVATE"), false);
  assert.equal(JSON.stringify(anonymous).includes("media-secret-id"), false);
  assert.equal(
    (anonymous as Record<string, unknown>).summary,
    null,
    "an unreviewed section stays hidden",
  );

  assert.equal(await run(editor), stored, "editors read the stored document");
  assert.equal(await run(null, true), stored, "trusted server reads");
});

test("book translations and related books cannot expand recursively", () => {
  for (const name of ["translation", "relatedBooks"]) {
    const field = findField(Books, name);
    assert.ok("maxDepth" in field);
    assert.equal(field.maxDepth, 1, name);
  }
  assert.deepEqual(Books.indexes, [
    { fields: ["language", "slug"], unique: true },
  ]);
});

type FakeBook = { id: string; language: string; translation?: string | null };

function bookRequest(books: FakeBook[]): PayloadRequest {
  return {
    payload: {
      async find({
        where,
      }: {
        where: {
          and: Array<
            Record<string, { equals?: unknown; not_equals?: unknown }>
          >;
        };
      }) {
        const conditions = where.and;
        return {
          docs: books.filter((book) =>
            conditions.every((condition) =>
              Object.entries(condition).every(([key, value]) => {
                const actual = (book as Record<string, unknown>)[key] ?? null;
                if ("equals" in value) return actual === value.equals;
                if ("not_equals" in value) return actual !== value.not_equals;
                return true;
              }),
            ),
          ),
        };
      },
      async findByID({ id }: { id: string }) {
        const book = books.find((entry) => entry.id === id);
        assert.ok(book);
        return book;
      },
    },
  } as unknown as PayloadRequest;
}

async function validateBook(
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown> | undefined,
  books: FakeBook[],
): Promise<unknown> {
  return normalizeAndValidateBook({
    collection: {},
    context: {},
    data,
    operation: originalDoc === undefined ? "create" : "update",
    originalDoc,
    req: bookRequest(books),
  } as unknown as Parameters<CollectionBeforeValidateHook>[0]);
}

test("book translations are reciprocal 1:1 pairs", async () => {
  const books: FakeBook[] = [
    { id: "tr-1", language: "tr", translation: null },
    { id: "en-1", language: "en", translation: "tr-1" },
    { id: "en-2", language: "en", translation: null },
    { id: "tr-2", language: "tr", translation: null },
  ];

  // en-1 already points at tr-1: tr-1 may point back at en-1.
  await assert.doesNotReject(
    validateBook(
      { language: "tr", slug: "kitap", title: "Kitap", translation: "en-1" },
      { id: "tr-1", language: "tr", slug: "kitap" },
      books,
    ),
  );

  // tr-2 cannot claim en-1, whose translation is tr-1.
  await assert.rejects(
    validateBook(
      { language: "tr", slug: "baska", title: "Başka", translation: "en-1" },
      { id: "tr-2", language: "tr", slug: "baska" },
      books,
    ),
    (error: unknown) =>
      validationErrors(error).some((entry) =>
        /başka bir incelemeye çeviri olarak bağlı/.test(entry.message),
      ),
  );

  // en-2 cannot take tr-1 as translation while en-1 already points at tr-1.
  await assert.rejects(
    validateBook(
      { language: "en", slug: "other", title: "Other", translation: "tr-1" },
      { id: "en-2", language: "en", slug: "other" },
      books,
    ),
    (error: unknown) =>
      validationErrors(error).some((entry) =>
        /zaten seçili/.test(entry.message),
      ),
  );

  // tr-1 is linked from en-1, so it cannot pick another translation.
  await assert.rejects(
    validateBook(
      { language: "tr", slug: "kitap", title: "Kitap", translation: "en-2" },
      { id: "tr-1", language: "tr", slug: "kitap" },
      books,
    ),
    (error: unknown) =>
      validationErrors(error).some((entry) =>
        /başka bir kaydın çevirisi olarak bağlı/.test(entry.message),
      ),
  );
});

async function validatePage(
  data: Record<string, unknown>,
  originalDoc?: Record<string, unknown>,
): Promise<unknown> {
  return validatePageIdentity({
    collection: {},
    context: {},
    data,
    operation: originalDoc === undefined ? "create" : "update",
    originalDoc,
    req: { payload: { find: async () => ({ docs: [] }) } },
  } as unknown as Parameters<CollectionBeforeValidateHook>[0]);
}

const homeLayout = [
  {
    blockType: "hero",
    titleLines: [{ text: "Şaban Durali" }],
    description: "İstanbul üzerine araştırmalar",
    primaryAction: { label: "Makaleler", href: "/makaleler" },
    secondaryAction: { label: "İletişim", href: "/iletisim" },
  },
  {
    blockType: "homeAbout",
    eyebrow: "Hakkımda",
    titleLines: [{ text: "Kısa biyografi" }],
    paragraphs: [{ text: "Paragraf" }],
    imageAlt: "Portre",
    image: "media-id",
  },
  {
    blockType: "homeFocusAreas",
    eyebrow: "Alanlar",
    title: "Çalışma alanları",
    cards: [
      {
        icon: "city",
        title: "İstanbul",
        description: "İlçe rehberleri",
        linkLabel: "Rehberler",
        linkHref: "/istanbul/ilceler",
      },
    ],
  },
];

test("a published home refuses blocks the public mapper would skip", async () => {
  assert.deepEqual(getUnrenderableHomeBlocks(homeLayout, "tr"), []);

  const [hero, about, focus] = homeLayout;
  const broken = [
    { ...hero, primaryAction: { label: "Makaleler", href: "javascript:x" } },
    { ...about, link: { label: "Devamı" } },
    { ...focus, cards: [{ title: "Eksik" }] },
    { blockType: "hero", visible: false },
    { blockType: "hero" },
  ];
  assert.deepEqual(getUnrenderableHomeBlocks(broken, "tr"), [
    "hero#1",
    "homeAbout#2",
    "homeFocusAreas#3",
    "hero#5",
  ]);

  await assert.rejects(
    validatePage({
      _status: "published",
      language: "tr",
      layout: [hero, { ...about, paragraphs: [] }, focus],
      pageType: "home",
      slug: "ana-sayfa",
      title: "Ana sayfa",
    }),
    (error: unknown) =>
      validationErrors(error).some((entry) =>
        /homeAbout#2/.test(entry.message),
      ),
  );
  await assert.doesNotReject(
    validatePage({
      _status: "draft",
      language: "tr",
      layout: [{ blockType: "hero" }],
      pageType: "home",
      slug: "ana-sayfa",
      title: "Ana sayfa",
    }),
    "drafts may be incomplete",
  );
});

test("the published home cannot be unpublished, scheduled or moved", () => {
  const now = new Date("2026-10-29T12:00:00Z");
  const home = { language: "tr" };
  const changes = (
    data: unknown,
    options: Partial<{ draft: boolean; unpublishAllLocales: boolean }> = {},
  ) =>
    getHomeBreakingChanges(data, home, {
      draft: false,
      unpublishAllLocales: false,
      now,
      ...options,
    });

  assert.deepEqual(changes({ _status: "published", title: "Yeni" }), []);
  assert.deepEqual(changes({ publishedAt: "2026-10-01T00:00:00Z" }), []);
  assert.deepEqual(
    changes({ _status: "draft", title: "Taslak" }, { draft: true }),
    [],
  );
  assert.deepEqual(changes({ _status: "draft" }), ["unpublish"]);
  assert.deepEqual(changes({}, { unpublishAllLocales: true }), ["unpublish"]);
  assert.deepEqual(changes({ publishedAt: "2026-11-01T00:00:00Z" }), [
    "schedule",
  ]);
  assert.deepEqual(changes({ publishedAt: null }), ["schedule"]);
  assert.deepEqual(
    changes({ pageType: "standard", language: "en" }, { draft: true }),
    ["pageType", "language"],
    "a draft that would break the home on publish is refused too",
  );
  assert.deepEqual(changes({ pageType: "home", language: "tr" }), []);
  assert.deepEqual(Pages.hooks?.beforeOperation, [protectPublishedHomePage]);
});

test("the home guard never runs an anonymous REST where with overrideAccess", async () => {
  const args = {
    data: { _status: "draft" },
    where: { title: { like: "Ana" } },
  };
  let queried = false;
  const req = {
    payloadAPI: "REST",
    user: null,
    payload: {
      find: async () => {
        queried = true;
        return { docs: [] };
      },
    },
  };
  const hook = protectPublishedHomePage as unknown as (input: {
    args: unknown;
    operation: string;
    req: unknown;
  }) => Promise<unknown>;

  assert.equal(await hook({ args, operation: "update", req }), args);
  assert.equal(queried, false, "access control refuses the update instead");

  await hook({
    args,
    operation: "update",
    req: { ...req, user: { role: "editor" } },
  });
  assert.equal(queried, true, "an editor's bulk update is still checked");
});

test("English standard pages can be drafted but not published", async () => {
  await assert.doesNotReject(
    validatePage({
      _status: "draft",
      language: "en",
      pageType: "standard",
      slug: "about",
      title: "About",
    }),
  );
  await assert.rejects(
    validatePage({
      _status: "published",
      language: "en",
      pageType: "standard",
      slug: "about",
      title: "About",
    }),
    (error: unknown) =>
      validationErrors(error).some(
        (entry) =>
          entry.path === "language" && /site adresi yok/.test(entry.message),
      ),
  );
  await assert.doesNotReject(
    validatePage({
      _status: "published",
      language: "en",
      layout: homeLayout,
      pageType: "home",
      slug: "home",
      title: "Home",
    }),
  );
});

test("the home page refuses visible blocks it does not render", async () => {
  await assert.rejects(
    validatePage({
      _status: "published",
      language: "tr",
      layout: [...homeLayout, { blockType: "cta" }, { blockType: "richText" }],
      pageType: "home",
      slug: "ana-sayfa",
      title: "Ana sayfa",
    }),
    (error: unknown) =>
      validationErrors(error).some((entry) =>
        /cta, richText/.test(entry.message),
      ),
  );
  await assert.doesNotReject(
    validatePage({
      _status: "published",
      language: "tr",
      layout: [...homeLayout, { blockType: "cta", visible: false }],
      pageType: "home",
      slug: "ana-sayfa",
      title: "Ana sayfa",
    }),
  );
});

test("standard Turkish pages cannot take reserved or legacy home slugs", async () => {
  await assert.rejects(
    validatePage({
      language: "tr",
      pageType: "standard",
      slug: "makaleler",
      title: "X",
    }),
    (error: unknown) =>
      validationErrors(error).some((entry) => entry.path === "slug"),
  );
  await assert.rejects(
    validatePage({
      language: "tr",
      pageType: "standard",
      slug: LEGACY_TURKISH_HOME_SLUG,
      title: "X",
    }),
    (error: unknown) =>
      validationErrors(error).some((entry) =>
        /eski Ana Sayfa/.test(entry.message),
      ),
  );
  // The existing legacy record keeps working until it is converted.
  await assert.doesNotReject(
    validatePage(
      { language: "tr", pageType: "standard", title: "Ana Sayfa" },
      {
        id: "legacy",
        language: "tr",
        pageType: "standard",
        slug: LEGACY_TURKISH_HOME_SLUG,
      },
    ),
  );
});

test("every top-level Turkish route is reserved for CMS page slugs", () => {
  const routeSegments = (directory: string): string[] =>
    readdirSync(directory).filter((entry) => {
      const entryPath = path.join(directory, entry);
      return (
        statSync(entryPath).isDirectory() &&
        !entry.startsWith("[") &&
        !entry.startsWith("(") &&
        !entry.startsWith("_")
      );
    });

  const groups = readdirSync(appDirectory).filter(
    (entry) =>
      /^\(.+\)$/.test(entry) &&
      statSync(path.join(appDirectory, entry)).isDirectory(),
  );
  const topLevel = new Set([
    ...routeSegments(appDirectory),
    ...groups.flatMap((group) => routeSegments(path.join(appDirectory, group))),
  ]);

  assert.ok(
    topLevel.has("makaleler") && topLevel.has("admin") && topLevel.has("en"),
  );
  for (const segment of topLevel) {
    assert.ok(
      RESERVED_TURKISH_SLUGS.has(segment),
      `${segment} must be reserved`,
    );
  }

  // Reserved slugs without a route must be deliberate.
  const retired = new Set(["geri-bildirim", "yonetim"]);
  for (const slug of RESERVED_TURKISH_SLUGS) {
    assert.ok(topLevel.has(slug) || retired.has(slug), `${slug} has no route`);
  }
  assert.ok(existsSync(path.join(appDirectory, "(tr)", "[slug]", "page.tsx")));
});

test("district news need a named https source; other articles need body text", async () => {
  const news = { articleType: "district-news" };
  const article = { articleType: "article" };
  const options = (data: Record<string, unknown>) =>
    ({ data, siblingData: {} }) as unknown as Parameters<
      typeof validateNewsSourceUrl
    >[1];

  assert.match(
    String(validateNewsSourceName("", options(news))),
    /kaynağın adı zorunludur/,
  );
  assert.equal(
    validateNewsSourceName("Esenler Belediyesi", options(news)),
    true,
  );
  assert.equal(validateNewsSourceName("", options(article)), true);

  assert.match(
    String(validateNewsSourceUrl(undefined, options(news))),
    /zorunludur/,
  );
  assert.match(
    String(validateNewsSourceUrl("http://esenler.bel.tr", options(news))),
    /https/,
  );
  assert.match(
    String(validateNewsSourceUrl("javascript:alert(1)", options(article))),
    /https/,
  );
  assert.equal(
    validateNewsSourceUrl("https://www.esenler.bel.tr/haber", options(news)),
    true,
  );
  assert.equal(validateNewsSourceUrl("", options(article)), true);

  const richTextOptions = (data: Record<string, unknown>) =>
    ({
      data,
      editor: { validate: async () => true },
      siblingData: {},
    }) as unknown as Parameters<NonNullable<RichTextField["validate"]>>[1];
  const empty = { root: { children: [] } };
  const filled = {
    root: {
      children: [
        { children: [{ text: "Gövde", type: "text" }], type: "paragraph" },
      ],
    },
  };

  assert.match(
    String(await validateArticleContent(empty, richTextOptions(article))),
    /görünür bir içeriği/,
  );
  assert.equal(
    await validateArticleContent(empty, richTextOptions(news)),
    true,
  );
  assert.equal(
    await validateArticleContent(filled, richTextOptions(article)),
    true,
  );
});

test("articles carry SEO controls and an author", () => {
  const canonical = findField(Articles, "canonical");
  assert.ok("localized" in canonical && canonical.localized === true);
  for (const name of ["index", "follow"]) {
    const field = findField(Articles, name);
    assert.ok("defaultValue" in field);
    assert.equal(field.defaultValue, true, name);
  }
  const author = findField(Articles, "author");
  assert.equal(author.type, "group");
});

test("the English header tab is hidden and English links may only target the English home", () => {
  const tabs = Navigation.fields.find((field) => field.type === "tabs");
  assert.ok(tabs && tabs.type === "tabs");
  const englishHeader = tabs.tabs.find(
    (tab: Tab) => tab.label === "English Header menu",
  );
  assert.ok(englishHeader);
  assert.equal(
    englishHeader.admin?.condition?.(
      {},
      {},
      { blockData: {}, operation: "update", path: [], user: null },
    ),
    false,
  );

  const enHeader = findField(Navigation, "enHeader");
  assert.equal(enHeader.type, "array");
  assert.ok(enHeader.type === "array");
  assert.equal(enHeader.admin?.hidden, true);

  for (const name of ["footerGroups", "enFooter"]) {
    const footer = findField(Navigation, name);
    assert.ok(footer.type === "array", name);
    assert.equal(footer.minRows, 1, `${name} keeps the KVKK/contact links`);
  }

  assert.deepEqual(getNavigationPageFilter("tr"), {
    language: { equals: "tr" },
  });
  assert.deepEqual(getNavigationPageFilter("en"), {
    and: [{ language: { equals: "en" } }, { pageType: { equals: "home" } }],
  });
});

test("CORRECTNESS-5: publishing a district guide checks normalized sources", async () => {
  const [protect] = DistrictGuides.hooks?.beforeChange ?? [];
  assert.ok(protect);
  const source = {
    title: "Adrese Dayalı Nüfus Kayıt Sistemi",
    publisher: "TÜİK",
    url: "https://data.tuik.gov.tr/",
    sourceType: "official",
    primary: true,
    checkedAt: "2026-09-01",
    dataDate: "2025-12-31",
    needsVerification: false,
    sections: ["summary", "history", "geography"],
  };
  const publish = async (sources: unknown) =>
    protect({
      data: {
        district: "esenler",
        _status: "published",
        summary: "Özet",
        history: "Tarih",
        geography: "Coğrafya",
        reviewedSections: ["summary", "history", "geography"],
        sources,
      },
      originalDoc: undefined,
      operation: "create",
    } as unknown as Parameters<NonNullable<typeof protect>>[0]);

  assert.ok(await publish([source]));
  // A null row is dropped, not dereferenced (no TypeError, no 500).
  assert.ok(await publish([null, source]));
  // A string is not a section list: "summary history geography" must not
  // satisfy `sections.includes(section)`.
  await assert.rejects(
    publish([{ ...source, sections: "summary history geography" }]),
    (error: unknown) =>
      error instanceof Error && /kontrol edilmiş kaynak/.test(error.message),
  );
});
