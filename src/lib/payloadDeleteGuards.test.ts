import assert from "node:assert/strict";
import test from "node:test";
import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  Field,
  PayloadRequest,
} from "payload";
import {
  isPayloadInternalCollection,
  preventDeletingHomePage,
  preventDeletingLastAdmin,
  preventDeletingReferencedCategory,
  preventDeletingReferencedMedia,
  preventDeletingReferencedPhotoCollection,
  preventDeletingReferencedTag,
  preventDemotingLastAdmin,
} from "./payloadDeleteGuards";

type Doc = Record<string, unknown> & { id: string };

type FakeCollection = {
  docs?: Doc[];
  fields: Field[];
  slug: string;
  versions?: Array<{ parent: string; version: Record<string, unknown> }>;
};

type FakeGlobal = {
  doc?: Record<string, unknown>;
  fields: Field[];
  slug: string;
  versions?: Array<{ version: Record<string, unknown> }>;
};

/** Minimal Where evaluation for the users queries the guards send. */
function matches(doc: Doc, where: unknown): boolean {
  if (typeof where !== "object" || where === null) return true;

  return Object.entries(where).every(([key, condition]) => {
    if (key === "and" && Array.isArray(condition)) {
      return condition.every((entry) => matches(doc, entry));
    }

    const constraint = condition as Record<string, unknown>;
    if ("equals" in constraint) return doc[key] === constraint.equals;
    if ("not_equals" in constraint) return doc[key] !== constraint.not_equals;
    if ("not_in" in constraint) {
      return (
        Array.isArray(constraint.not_in) &&
        !constraint.not_in.includes(doc[key])
      );
    }
    return true;
  });
}

function fakeRequest({
  collections = [],
  globals = [],
}: {
  collections?: FakeCollection[];
  globals?: FakeGlobal[];
}): PayloadRequest {
  const findCollection = (slug: string) => {
    const collection = collections.find((entry) => entry.slug === slug);
    assert.ok(collection, `unexpected collection ${slug}`);
    return collection;
  };

  return {
    payload: {
      config: {
        collections: collections.map(({ fields, slug, versions }) => ({
          fields,
          slug,
          versions: versions === undefined ? false : { drafts: true },
        })),
        globals: globals.map(({ fields, slug, versions }) => ({
          fields,
          slug,
          versions: versions === undefined ? false : { drafts: true },
        })),
      },
      async find({
        collection,
        where,
      }: {
        collection: string;
        where?: unknown;
      }) {
        return {
          docs: (findCollection(collection).docs ?? []).filter((doc) =>
            matches(doc, where),
          ),
        };
      },
      async findByID({ collection, id }: { collection: string; id: string }) {
        const doc = findCollection(collection).docs?.find(
          (entry) => entry.id === id,
        );
        assert.ok(doc, `missing ${collection}/${id}`);
        return doc;
      },
      async findGlobal({ slug }: { slug: string }) {
        return globals.find((entry) => entry.slug === slug)?.doc ?? {};
      },
      async findGlobalVersions({ slug }: { slug: string }) {
        return {
          docs: globals.find((entry) => entry.slug === slug)?.versions ?? [],
        };
      },
      async findVersions({ collection }: { collection: string }) {
        return { docs: findCollection(collection).versions ?? [] };
      },
    },
  } as unknown as PayloadRequest;
}

function runDelete(
  hook: CollectionBeforeDeleteHook,
  id: string,
  req: PayloadRequest,
): Promise<unknown> {
  return Promise.resolve(
    hook({
      collection: {},
      context: {},
      id,
      req,
    } as unknown as Parameters<CollectionBeforeDeleteHook>[0]),
  );
}

function conflict(pattern: RegExp) {
  return (error: unknown) =>
    error instanceof Error &&
    "status" in error &&
    error.status === 409 &&
    pattern.test(error.message);
}

const articleFields: Field[] = [
  { name: "title", type: "text", localized: true },
  {
    name: "categories",
    type: "relationship",
    hasMany: true,
    relationTo: "categories",
  },
  { name: "featuredImage", type: "upload", relationTo: "media" },
  { name: "content", type: "richText", localized: true },
];

const lockedDocuments: FakeCollection = {
  docs: [
    {
      document: { relationTo: "media", value: "media-1" },
      id: "lock-1",
    },
  ],
  fields: [
    {
      name: "document",
      type: "relationship",
      relationTo: ["media", "articles"],
    },
  ],
  slug: "payload-locked-documents",
};

test("Payload's own collections are bookkeeping, not content", () => {
  assert.equal(isPayloadInternalCollection("payload-locked-documents"), true);
  assert.equal(isPayloadInternalCollection("payload-preferences"), true);
  assert.equal(isPayloadInternalCollection("articles"), false);
});

test("a document lock never blocks deleting unused media", async () => {
  const req = fakeRequest({
    collections: [
      { docs: [], fields: [], slug: "media" },
      lockedDocuments,
      { docs: [], fields: articleFields, slug: "articles", versions: [] },
    ],
  });

  await assert.doesNotReject(
    runDelete(preventDeletingReferencedMedia, "media-1", req),
  );
});

test("media used by current content, a version, rich text or a global cannot be deleted", async () => {
  const cases: Array<{ pattern: RegExp; req: PayloadRequest }> = [
    {
      pattern: /mevcut içerikte \(articles\)/,
      req: fakeRequest({
        collections: [
          {
            docs: [{ featuredImage: "media-1", id: "a1" }],
            fields: articleFields,
            slug: "articles",
          },
        ],
      }),
    },
    {
      pattern: /geçmiş bir içerik sürümünde \(articles\)/,
      req: fakeRequest({
        collections: [
          {
            docs: [{ id: "a1" }],
            fields: articleFields,
            slug: "articles",
            versions: [
              { parent: "a1", version: { featuredImage: { id: "media-1" } } },
            ],
          },
        ],
      }),
    },
    {
      pattern: /mevcut içerikte \(articles\)/,
      req: fakeRequest({
        collections: [
          {
            docs: [
              {
                content: {
                  en: null,
                  tr: {
                    root: {
                      children: [
                        {
                          relationTo: "media",
                          type: "upload",
                          value: { id: "media-1" },
                        },
                      ],
                    },
                  },
                },
                id: "a1",
              },
            ],
            fields: articleFields,
            slug: "articles",
          },
        ],
      }),
    },
    {
      pattern: /mevcut içerikte \(navigation\)/,
      req: fakeRequest({
        globals: [
          {
            doc: { socialImage: "media-1" },
            fields: [
              { name: "socialImage", type: "upload", relationTo: "media" },
            ],
            slug: "navigation",
          },
        ],
      }),
    },
    {
      // A global with drafts: the current document no longer uses the
      // image, an older version still does.
      pattern: /geçmiş bir içerik sürümünde \(navigation\)/,
      req: fakeRequest({
        globals: [
          {
            doc: {},
            fields: [
              { name: "socialImage", type: "upload", relationTo: "media" },
            ],
            slug: "navigation",
            versions: [{ version: { socialImage: "media-1" } }],
          },
        ],
      }),
    },
    {
      // A collection that can reach media only through rich text uploads.
      pattern: /mevcut içerikte \(notes\)/,
      req: fakeRequest({
        collections: [
          {
            docs: [
              {
                body: {
                  root: {
                    children: [
                      {
                        relationTo: "media",
                        type: "upload",
                        value: "media-1",
                      },
                    ],
                  },
                },
                id: "n1",
              },
            ],
            fields: [{ name: "body", type: "richText" }],
            slug: "notes",
          },
        ],
      }),
    },
  ];

  for (const { pattern, req } of cases) {
    await assert.rejects(
      runDelete(preventDeletingReferencedMedia, "media-1", req),
      conflict(pattern),
    );
  }
});

test("categories are checked like every other relationship, versions included", async () => {
  const current = fakeRequest({
    collections: [
      {
        docs: [{ categories: ["cat-1", "cat-2"], id: "a1" }],
        fields: articleFields,
        slug: "articles",
      },
    ],
  });
  await assert.rejects(
    runDelete(preventDeletingReferencedCategory, "cat-2", current),
    conflict(/Bu kategori mevcut içerikte \(articles\)/),
  );

  const versionOnly = fakeRequest({
    collections: [
      {
        docs: [{ categories: [], id: "a1" }],
        fields: articleFields,
        slug: "articles",
        versions: [{ parent: "a1", version: { categories: ["cat-9"] } }],
      },
    ],
  });
  await assert.rejects(
    runDelete(preventDeletingReferencedCategory, "cat-9", versionOnly),
    conflict(/Bu kategori geçmiş bir içerik sürümünde/),
  );

  await assert.doesNotReject(
    runDelete(preventDeletingReferencedCategory, "unused", versionOnly),
  );
});

test("a parent photo collection cannot be deleted while a child points at it", async () => {
  const collections: FakeCollection = {
    docs: [
      { id: "parent", parent: null },
      { id: "child", parent: "parent" },
    ],
    fields: [
      { name: "parent", type: "relationship", relationTo: "photo-collections" },
    ],
    slug: "photo-collections",
  };
  const req = fakeRequest({ collections: [collections] });

  await assert.rejects(
    runDelete(preventDeletingReferencedPhotoCollection, "parent", req),
    conflict(/fotoğraf koleksiyonu mevcut içerikte \(photo-collections\)/),
  );
  await assert.doesNotReject(
    runDelete(preventDeletingReferencedPhotoCollection, "child", req),
    "a document is never a usage of itself",
  );
});

test("tags used in a photo's localized relationship are protected", async () => {
  const req = fakeRequest({
    collections: [
      {
        docs: [{ id: "p1", tags: { en: [], tr: ["tag-1"] } }],
        fields: [
          {
            name: "tags",
            type: "relationship",
            hasMany: true,
            localized: true,
            relationTo: "tags",
          },
        ],
        slug: "photos",
      },
    ],
  });

  await assert.rejects(
    runDelete(preventDeletingReferencedTag, "tag-1", req),
    conflict(/Bu etiket mevcut içerikte \(photos\)/),
  );
});

test("the home page cannot be deleted, standard pages can", async () => {
  const req = fakeRequest({
    collections: [
      {
        docs: [
          { id: "home", pageType: "home" },
          { id: "about", pageType: "standard" },
        ],
        fields: [],
        slug: "pages",
      },
    ],
  });

  await assert.rejects(
    runDelete(preventDeletingHomePage, "home", req),
    conflict(/Ana Sayfa kaydı silinemez/),
  );
  await assert.doesNotReject(runDelete(preventDeletingHomePage, "about", req));
});

function usersRequest(users: Doc[]): PayloadRequest {
  return fakeRequest({
    collections: [{ docs: users, fields: [], slug: "users" }],
  });
}

test("the last admin cannot be deleted", async () => {
  await assert.rejects(
    runDelete(
      preventDeletingLastAdmin,
      "a1",
      usersRequest([
        { id: "a1", role: "admin" },
        { id: "e1", role: "editor" },
      ]),
    ),
    conflict(/son yönetici hesabı silinemez/),
  );
  await assert.doesNotReject(
    runDelete(
      preventDeletingLastAdmin,
      "a1",
      usersRequest([
        { id: "a1", role: "admin" },
        { id: "a2", role: "admin" },
      ]),
    ),
  );
  await assert.doesNotReject(
    runDelete(
      preventDeletingLastAdmin,
      "e1",
      usersRequest([
        { id: "a1", role: "admin" },
        { id: "e1", role: "editor" },
      ]),
    ),
  );
});

function runChange(
  args: {
    data: Record<string, unknown>;
    operation: "create" | "update";
    originalDoc?: Record<string, unknown>;
  },
  req: PayloadRequest,
): Promise<unknown> {
  return Promise.resolve(
    preventDemotingLastAdmin({
      collection: {},
      context: {},
      req,
      ...args,
    } as unknown as Parameters<CollectionBeforeChangeHook>[0]),
  );
}

test("the last admin cannot be demoted; other role changes go through", async () => {
  const onlyAdmin = usersRequest([
    { id: "a1", role: "admin" },
    { id: "e1", role: "editor" },
  ]);

  await assert.rejects(
    runChange(
      {
        data: { role: "editor" },
        operation: "update",
        originalDoc: { id: "a1", role: "admin" },
      },
      onlyAdmin,
    ),
    conflict(/son yönetici hesabının rolü değiştirilemez/),
  );

  const data = { role: "editor" };
  assert.equal(
    await runChange(
      { data, operation: "update", originalDoc: { id: "a1", role: "admin" } },
      usersRequest([
        { id: "a1", role: "admin" },
        { id: "a2", role: "admin" },
      ]),
    ),
    data,
  );

  for (const args of [
    {
      data: { role: "admin" },
      operation: "update" as const,
      originalDoc: { id: "a1", role: "admin" },
    },
    {
      data: { email: "x@example.com" },
      operation: "update" as const,
      originalDoc: { id: "a1", role: "admin" },
    },
    {
      data: { role: "admin" },
      operation: "update" as const,
      originalDoc: { id: "e1", role: "editor" },
    },
    { data: { role: "editor" }, operation: "create" as const },
  ]) {
    assert.equal(await runChange(args, onlyAdmin), args.data);
  }
});

test("one request cannot remove every admin, although a bulk edit or delete checks its documents in parallel", async () => {
  const users: Doc[] = [
    { id: "a1", role: "admin" },
    { id: "a2", role: "admin" },
    { id: "a3", role: "admin" },
    { id: "e1", role: "editor" },
  ];
  const outcome = (results: PromiseSettledResult<unknown>[]) => ({
    allowed: results.filter((result) => result.status === "fulfilled").length,
    refused: results.filter(
      (result) =>
        result.status === "rejected" && conflict(/son yönetici/)(result.reason),
    ).length,
  });
  const demote = (id: string, req: PayloadRequest) =>
    runChange(
      {
        data: { role: "editor" },
        operation: "update",
        originalDoc: { id, role: "admin" },
      },
      req,
    );

  // Nothing is written until every hook has run, as in Payload's bulk
  // operations: each check alone would still see two other admins.
  const bulkDelete = usersRequest(users);
  assert.deepEqual(
    outcome(
      await Promise.allSettled(
        ["a1", "a2", "a3"].map((id) =>
          runDelete(preventDeletingLastAdmin, id, bulkDelete),
        ),
      ),
    ),
    { allowed: 2, refused: 1 },
  );

  const bulkEdit = usersRequest(users);
  assert.deepEqual(
    outcome(
      await Promise.allSettled(
        ["a1", "a2", "a3"].map((id) => demote(id, bulkEdit)),
      ),
    ),
    { allowed: 2, refused: 1 },
  );

  // Editors in the same bulk request are never counted as removed admins.
  const mixed = usersRequest(users);
  await assert.doesNotReject(runDelete(preventDeletingLastAdmin, "e1", mixed));
  await assert.doesNotReject(runDelete(preventDeletingLastAdmin, "a1", mixed));

  // Another request starts with nothing removed.
  await assert.doesNotReject(demote("a1", usersRequest(users)));
});
