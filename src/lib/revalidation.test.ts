import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from "payload";
import { workspaces } from "../content/workspaces";
import {
  ALL_PAGES,
  SITEMAP_PATH,
  createNavigationRevalidationHook,
  createRevalidationHooks,
  getCollectionRevalidationTargets,
  getNavigationRevalidationTargets,
  revalidateTargets,
  shouldRevalidateChange,
  type RevalidatedCollection,
  type RevalidationTarget,
} from "./revalidation";

const appDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../app",
);

type Call = { path: string; type?: "layout" | "page" };

function recorder(): {
  calls: Call[];
  revalidate: (path: string, type?: "layout" | "page") => void;
} {
  const calls: Call[] = [];
  return {
    calls,
    revalidate: (path, type) => {
      calls.push(type === undefined ? { path } : { path, type });
    },
  };
}

const warnings: string[] = [];

function fakeRequest(locale = "tr"): PayloadRequest {
  return {
    locale,
    payload: { logger: { warn: (message: string) => warnings.push(message) } },
  } as unknown as PayloadRequest;
}

function afterChange(
  hook: CollectionAfterChangeHook,
  args: {
    doc: Record<string, unknown>;
    operation: "create" | "update";
    previousDoc?: Record<string, unknown>;
    locale?: string;
  },
): unknown {
  return hook({
    collection: {},
    context: {},
    data: {},
    doc: args.doc,
    operation: args.operation,
    previousDoc: args.previousDoc ?? {},
    req: fakeRequest(args.locale),
  } as unknown as Parameters<CollectionAfterChangeHook>[0]);
}

function afterDelete(
  hook: CollectionAfterDeleteHook,
  doc: Record<string, unknown>,
): unknown {
  return hook({
    collection: {},
    context: {},
    doc,
    id: "doc-1",
    req: fakeRequest(),
  } as unknown as Parameters<CollectionAfterDeleteHook>[0]);
}

function paths(targets: readonly RevalidationTarget[]): string[] {
  return targets.map((target) =>
    target.type === undefined ? target.path : `${target.path}#${target.type}`,
  );
}

function isDirectory(candidate: string): boolean {
  return existsSync(candidate) && statSync(candidate).isDirectory();
}

/** Finds the `src/app` file that serves a URL path (route groups and dynamic segments included). */
function findRouteFile(directory: string, segments: string[]): string | null {
  if (segments.length === 0) {
    for (const file of ["page.tsx", "page.ts", "route.ts"]) {
      if (existsSync(path.join(directory, file))) {
        return path.join(directory, file);
      }
    }
  }

  const entries = readdirSync(directory);

  for (const entry of entries) {
    const entryPath = path.join(directory, entry);
    if (!isDirectory(entryPath)) continue;

    if (/^\(.+\)$/.test(entry)) {
      const found = findRouteFile(entryPath, segments);
      if (found !== null) return found;
    }
  }

  if (segments.length === 0) return null;

  const [head, ...rest] = segments;
  const exact = path.join(directory, head);

  if (isDirectory(exact)) {
    const found = findRouteFile(exact, rest);
    if (found !== null) return found;
  }

  for (const entry of entries) {
    if (
      /^\[[^.\]]+\]$/.test(entry) &&
      isDirectory(path.join(directory, entry))
    ) {
      const found = findRouteFile(path.join(directory, entry), rest);
      if (found !== null) return found;
    }
  }

  return null;
}

function assertTargetsAreRoutes(targets: readonly RevalidationTarget[]): void {
  for (const target of targets) {
    if (target === ALL_PAGES) continue;

    if (target.path === SITEMAP_PATH) {
      assert.ok(existsSync(path.join(appDirectory, "sitemap.ts")));
      continue;
    }

    if (target.type === "page") {
      // A route pattern names the page file itself, route group included.
      assert.ok(
        existsSync(path.join(appDirectory, target.path, "page.tsx")),
        `${target.path} must name an existing page file`,
      );
      continue;
    }

    assert.notEqual(
      findRouteFile(appDirectory, target.path.split("/").filter(Boolean)),
      null,
      `${target.path} must be served by a route in src/app`,
    );
  }
}

const publishedArticle = {
  _status: "published",
  district: "esenler",
  id: "article-1",
  slug: "kentsel-donusum",
};

test("an article change reaches its detail pages, lists, homes, districts, workspaces and the sitemap", () => {
  const targets = getCollectionRevalidationTargets(
    "articles",
    [publishedArticle, { ...publishedArticle, slug: "eski-baslik" }],
    "tr",
  );
  const listed = paths(targets);

  for (const expected of [
    "/",
    "/en",
    "/makaleler",
    "/en/articles",
    "/makaleler/kentsel-donusum",
    "/makaleler/eski-baslik",
    "/(tr)/makaleler/[slug]#page",
    "/(en)/en/articles/[slug]#page",
    "/istanbul/ilceler",
    "/istanbul/ilceler/esenler",
    "/istanbul/ilceler/esenler/haberler",
    "/(tr)/istanbul/ilceler/[district]#page",
    "/(tr)/istanbul/ilceler/[district]/haberler#page",
    SITEMAP_PATH,
  ]) {
    assert.ok(listed.includes(expected), `missing ${expected}`);
  }

  const articleFeeds = workspaces.flatMap((workspace) =>
    workspace.entries.filter((entry) => entry.articleCategory !== undefined),
  );
  assert.ok(articleFeeds.length > 0);
  for (const entry of articleFeeds) {
    assert.ok(listed.includes(entry.href), `missing workspace ${entry.href}`);
  }

  assert.equal(new Set(listed).size, listed.length, "targets are unique");
  assertTargetsAreRoutes(targets);
});

test("localized slugs resolve per language, whatever locale the request used", () => {
  assert.ok(
    paths(
      getCollectionRevalidationTargets(
        "articles",
        [{ slug: "urban-renewal" }],
        "en",
      ),
    ).includes("/en/articles/urban-renewal"),
  );

  const listed = paths(
    getCollectionRevalidationTargets(
      "photos",
      [{ slug: { en: "bosphorus-at-night", tr: "gece-bogaz" } }],
      "tr",
    ),
  );
  assert.ok(listed.includes("/fotograflar/gece-bogaz"));
  assert.ok(listed.includes("/en/photography/bosphorus-at-night"));
});

test("unsafe slugs never become literal paths; the route pattern still covers them", () => {
  const listed = paths(
    getCollectionRevalidationTargets(
      "articles",
      [{ slug: "../admin" }, { slug: "a b" }, { slug: "Büyük" }],
      "tr",
    ),
  );

  assert.ok(!listed.some((entry) => entry.includes("..")));
  assert.ok(!listed.includes("/makaleler/a b"));
  assert.ok(!listed.includes("/makaleler/Büyük"));
  assert.ok(listed.includes("/(tr)/makaleler/[slug]#page"));
});

test("book reviews use the document language for the detail path", () => {
  const targets = getCollectionRevalidationTargets(
    "books",
    [
      { language: "en", slug: "deep-work" },
      { language: "tr", slug: "derin-calisma" },
    ],
    "tr",
  );
  const listed = paths(targets);

  for (const expected of [
    "/",
    "/en",
    "/kitaplar",
    "/en/books",
    "/en/books/deep-work",
    "/kitaplar/derin-calisma",
    "/(tr)/kitaplar/[slug]#page",
    "/(en)/en/books/[slug]#page",
    SITEMAP_PATH,
  ]) {
    assert.ok(listed.includes(expected), `missing ${expected}`);
  }
  assertTargetsAreRoutes(targets);
});

test("pages revalidate every route because navigation links resolve them", () => {
  const home = getCollectionRevalidationTargets(
    "pages",
    [{ language: "tr", pageType: "home", slug: "ana-sayfa" }],
    "tr",
  );
  assert.ok(home.includes(ALL_PAGES));
  assert.ok(paths(home).includes("/"));

  const english = paths(
    getCollectionRevalidationTargets(
      "pages",
      [{ language: "en", pageType: "home", slug: "home" }],
      "tr",
    ),
  );
  assert.ok(english.includes("/en"));

  const standard = getCollectionRevalidationTargets(
    "pages",
    [
      { language: "tr", pageType: "standard", slug: "yeni-sayfa" },
      { language: "en", pageType: "standard", slug: "new-page" },
    ],
    "tr",
  );
  const listed = paths(standard);
  assert.ok(listed.includes("/yeni-sayfa"));
  assert.ok(listed.includes("/(tr)/[slug]#page"));
  assert.ok(
    !listed.includes("/en/new-page"),
    "there is no English standard-page route",
  );
  assertTargetsAreRoutes(standard);
});

test("photos, tags and photo collections reach photo lists, homes, workspaces and districts", () => {
  const photo = getCollectionRevalidationTargets(
    "photos",
    [{ district: "fatih", slug: "suleymaniye" }],
    "tr",
  );
  const listed = paths(photo);

  for (const expected of [
    "/",
    "/en",
    "/fotograflar",
    "/en/photography",
    "/fotograflar/suleymaniye",
    "/(tr)/fotograflar/[slug]#page",
    "/(en)/en/photography/[slug]#page",
    "/istanbul/ilceler/fatih",
    "/(tr)/istanbul/ilceler/[district]#page",
    SITEMAP_PATH,
  ]) {
    assert.ok(listed.includes(expected), `missing ${expected}`);
  }
  for (const entry of workspaces.flatMap((workspace) =>
    workspace.entries.filter((item) => item.photoCategory !== undefined),
  )) {
    assert.ok(listed.includes(entry.href), `missing workspace ${entry.href}`);
  }
  assertTargetsAreRoutes(photo);

  for (const collection of ["tags", "photo-collections"] as const) {
    const related = getCollectionRevalidationTargets(
      collection,
      [{ slug: "mimari" }],
      "tr",
    );
    assert.ok(paths(related).includes("/(tr)/fotograflar/[slug]#page"));
    assert.ok(
      !paths(related).includes("/fotograflar/mimari"),
      `${collection} slugs are not photo slugs`,
    );
    assertTargetsAreRoutes(related);
  }
});

test("categories reach every article surface but no article detail by their own slug", () => {
  const targets = getCollectionRevalidationTargets(
    "categories",
    [{ slug: "gayrimenkul" }],
    "tr",
  );
  const listed = paths(targets);

  assert.ok(listed.includes("/makaleler"));
  assert.ok(listed.includes("/(tr)/makaleler/[slug]#page"));
  assert.ok(!listed.includes("/makaleler/gayrimenkul"));
  assertTargetsAreRoutes(targets);
});

test("district guides reach the directory, the guide and its news page", () => {
  const targets = getCollectionRevalidationTargets(
    "district-guides",
    [{ _status: "published", district: "kadikoy" }],
    "tr",
  );

  assert.deepEqual(
    paths(targets).filter((entry) => !entry.includes("#")),
    [
      "/istanbul/ilceler",
      "/istanbul/ilceler/kadikoy",
      "/istanbul/ilceler/kadikoy/haberler",
      SITEMAP_PATH,
    ],
  );
  assertTargetsAreRoutes(targets);
});

test("media and navigation reach every page", () => {
  assert.deepEqual(getCollectionRevalidationTargets("media", [{ id: "m1" }]), [
    ALL_PAGES,
    { path: SITEMAP_PATH },
  ]);
  assert.deepEqual(getNavigationRevalidationTargets(), [ALL_PAGES]);
  assert.deepEqual(ALL_PAGES, { path: "/", type: "layout" });
});

test("draft saves of never-published documents are skipped; publish and unpublish are not", () => {
  assert.equal(
    shouldRevalidateChange({ doc: { _status: "draft" }, operation: "create" }),
    false,
  );
  assert.equal(
    shouldRevalidateChange({
      doc: { _status: "draft" },
      operation: "update",
      previousDoc: { _status: "draft" },
    }),
    false,
  );
  assert.equal(
    shouldRevalidateChange({
      doc: { _status: "published" },
      operation: "create",
    }),
    true,
  );
  assert.equal(
    shouldRevalidateChange({
      doc: { _status: "draft" },
      operation: "update",
      previousDoc: { _status: "published" },
    }),
    true,
    "unpublishing must revalidate",
  );
  assert.equal(
    shouldRevalidateChange({ doc: { id: "tag" }, operation: "create" }),
    true,
    "collections without drafts always revalidate",
  );
});

test("regression: unpublishing an article revalidates its page so it returns 404 on the next visit", () => {
  const { calls, revalidate } = recorder();
  const hooks = createRevalidationHooks("articles", { revalidate });
  const doc = { ...publishedArticle, _status: "draft" };

  assert.equal(
    afterChange(hooks.afterChange, {
      doc,
      operation: "update",
      previousDoc: publishedArticle,
    }),
    doc,
    "the hook returns the document unchanged",
  );
  assert.ok(calls.some((call) => call.path === "/makaleler/kentsel-donusum"));
  assert.ok(calls.some((call) => call.path === "/makaleler"));
  assert.ok(
    calls.some(
      (call) =>
        call.path === "/(en)/en/articles/[slug]" && call.type === "page",
    ),
  );
});

test("draft saves call nothing; create, delete and navigation changes do", () => {
  const draft = recorder();
  afterChange(
    createRevalidationHooks("articles", { revalidate: draft.revalidate })
      .afterChange,
    { doc: { _status: "draft", slug: "taslak" }, operation: "create" },
  );
  assert.deepEqual(draft.calls, []);

  const created = recorder();
  afterChange(
    createRevalidationHooks("tags", { revalidate: created.revalidate })
      .afterChange,
    { doc: { slug: "sokak" }, operation: "create" },
  );
  assert.ok(created.calls.length > 0);

  const deleted = recorder();
  afterDelete(
    createRevalidationHooks("books", { revalidate: deleted.revalidate })
      .afterDelete,
    { language: "tr", slug: "silinen" },
  );
  assert.ok(deleted.calls.some((call) => call.path === "/kitaplar/silinen"));

  const navigation = recorder();
  const navigationHook: GlobalAfterChangeHook =
    createNavigationRevalidationHook({ revalidate: navigation.revalidate });
  navigationHook({
    context: {},
    doc: { _status: "published" },
    global: {},
    previousDoc: { _status: "published" },
    req: fakeRequest(),
  } as unknown as Parameters<GlobalAfterChangeHook>[0]);
  assert.deepEqual(navigation.calls, [{ path: "/", type: "layout" }]);
});

test("outside a Next.js request revalidation is a silent no-op", () => {
  warnings.length = 0;

  assert.doesNotThrow(() =>
    revalidateTargets([{ path: "/makaleler" }, ALL_PAGES]),
  );
  assert.doesNotThrow(() =>
    afterChange(createRevalidationHooks("articles").afterChange, {
      doc: publishedArticle,
      operation: "update",
      previousDoc: publishedArticle,
    }),
  );
  assert.deepEqual(warnings, []);
});

test("any other revalidation failure is logged and never fails the write", () => {
  const logged: string[] = [];
  const attempted: string[] = [];

  assert.doesNotThrow(() =>
    revalidateTargets([{ path: "/a" }, { path: "/b" }], {
      logger: { warn: (message) => logged.push(message) },
      revalidate: (target) => {
        attempted.push(target);
        throw new Error("cache handler unavailable");
      },
    }),
  );
  assert.deepEqual(attempted, ["/a", "/b"]);
  assert.equal(logged.length, 2);
  assert.match(logged[0], /\/a was not revalidated: cache handler unavailable/);
});

test("every content collection maps to at least one existing route", () => {
  const collections: RevalidatedCollection[] = [
    "articles",
    "books",
    "categories",
    "district-guides",
    "media",
    "pages",
    "photo-collections",
    "photos",
    "tags",
  ];

  for (const collection of collections) {
    const targets = getCollectionRevalidationTargets(collection, [], "tr");
    assert.ok(targets.length > 0, collection);
    assert.ok(
      targets.some((target) => target.path === SITEMAP_PATH),
      `${collection} changes can change /sitemap.xml`,
    );
    assertTargetsAreRoutes(targets);
  }
});

test("a target that rich text can link to refreshes every page rendering rich text", () => {
  for (const [collection, doc] of [
    ["articles", { _status: "published", slug: "eski-makale" }],
    ["photos", { _status: "published", slug: "galata" }],
    ["books", { language: "tr", slug: "derin-calisma" }],
  ] as const) {
    const listed = paths(getCollectionRevalidationTargets(collection, [doc]));

    for (const expected of [
      "/",
      "/en",
      "/(tr)/[slug]#page",
      "/(tr)/makaleler/[slug]#page",
      "/(en)/en/articles/[slug]#page",
    ]) {
      assert.ok(
        listed.includes(expected),
        `${collection}: missing ${expected}`,
      );
    }
  }
});

function listRouteFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const candidate = path.join(directory, entry);
    if (isDirectory(candidate)) return listRouteFiles(candidate);
    return /^(page|layout)\.tsx$/.test(entry) ? [candidate] : [];
  });
}

function readRevalidate(file: string): number | null {
  const match = /export const revalidate = (\d+);/.exec(
    readFileSync(file, "utf8"),
  );
  return match === null ? null : Number(match[1]);
}

test("the time-based safety net covers every public route", () => {
  for (const file of [
    path.join(appDirectory, "(tr)/layout.tsx"),
    path.join(appDirectory, "(en)/layout.tsx"),
    path.join(appDirectory, "sitemap.ts"),
  ]) {
    const seconds = readRevalidate(file);
    assert.ok(
      seconds !== null && seconds <= 3600,
      `${path.relative(appDirectory, file)} must export revalidate <= 3600`,
    );
  }

  const publicRoutes = ["(tr)", "(en)"].flatMap((group) =>
    listRouteFiles(path.join(appDirectory, group)),
  );
  assert.ok(publicRoutes.length > 10);
  for (const file of publicRoutes) {
    assert.doesNotMatch(
      readFileSync(file, "utf8"),
      /export const dynamic = "force-dynamic"/,
      `${path.relative(appDirectory, file)}: on-demand revalidation keeps it fresh`,
    );
  }
});
