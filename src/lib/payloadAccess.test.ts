import assert from "node:assert/strict";
import test from "node:test";
import type {
  Access,
  CollectionBeforeOperationHook,
  CollectionConfig,
  PayloadRequest,
  Where,
} from "payload";
import {
  ANONYMOUS_REST_MAX_LIMIT,
  PublicRequestRefusal,
  adminOnly,
  adminOrEditor,
  collectWherePaths,
  createAnonymousQueryAllowlist,
  createPublishedBookReviewWhere,
  createPublishedWhere,
  denyAnonymousRestReads,
  editorialFieldRead,
  isAdmin,
  isAdminOrEditor,
  isPublicApiReader,
  limitAnonymousRestQueries,
  publishedBookReviewOrAdminOrEditor,
  publishedOrAdminOrEditor,
  publishedPageOrAdminOrEditor,
  withAnonymousRestLimits,
} from "./payloadAccess";

const admin = { id: "u-admin", role: "admin" };
const editor = { id: "u-editor", role: "editor" };

function request(
  user: unknown = null,
  payloadAPI: "GraphQL" | "local" | "REST" = "REST",
): PayloadRequest {
  return { payloadAPI, user } as unknown as PayloadRequest;
}

function runAccess(access: Access, user: unknown): unknown {
  return access({ req: request(user) } as Parameters<Access>[0]);
}

type HookCall = {
  args: Record<string, unknown>;
  operation: string;
  overrideAccess?: boolean;
  req: PayloadRequest;
};

function runHook(hook: CollectionBeforeOperationHook, call: HookCall): unknown {
  return hook({
    collection: {},
    context: {},
    ...call,
  } as unknown as Parameters<CollectionBeforeOperationHook>[0]);
}

function getAnd(where: unknown): Where[] {
  assert.ok(typeof where === "object" && where !== null && "and" in where);
  const and = (where as { and?: unknown }).and;
  assert.ok(Array.isArray(and));
  return and as Where[];
}

test("roles: only admin and editor are staff", () => {
  assert.equal(isAdmin(admin), true);
  assert.equal(isAdmin(editor), false);
  assert.equal(isAdminOrEditor(editor), true);
  for (const user of [null, undefined, {}, { role: "viewer" }, "admin", 1]) {
    assert.equal(isAdmin(user), false);
    assert.equal(isAdminOrEditor(user), false);
  }
  assert.equal(runAccess(adminOnly, admin), true);
  assert.equal(runAccess(adminOnly, editor), false);
  assert.equal(runAccess(adminOrEditor, editor), true);
  assert.equal(runAccess(adminOrEditor, null), false);
});

test("anonymous readers only see published content whose date has passed", () => {
  const now = new Date("2026-10-28T10:00:00.000Z");

  assert.deepEqual(createPublishedWhere(now), {
    and: [
      { _status: { equals: "published" } },
      { publishedAt: { less_than_equal: "2026-10-28T10:00:00.000Z" } },
    ],
  });

  for (const access of [
    publishedOrAdminOrEditor,
    publishedPageOrAdminOrEditor,
  ]) {
    assert.equal(runAccess(access, admin), true);
    assert.equal(runAccess(access, editor), true);

    const before = Date.now();
    const [status, publishedAt] = getAnd(runAccess(access, null));
    assert.deepEqual(status, { _status: { equals: "published" } });

    const limit = Date.parse(
      String(
        (publishedAt as { publishedAt: { less_than_equal: string } })
          .publishedAt.less_than_equal,
      ),
    );
    assert.ok(limit >= before && limit <= Date.now(), "uses the current time");
  }
});

test("anonymous book readers also need a published review with indexing on", () => {
  const now = new Date("2026-10-28T10:00:00.000Z");

  assert.deepEqual(createPublishedBookReviewWhere(now), {
    and: [
      { _status: { equals: "published" } },
      { reviewStatus: { equals: "published" } },
      { publishedAt: { less_than_equal: "2026-10-28T10:00:00.000Z" } },
      { "seo.index": { equals: true } },
    ],
  });
  assert.equal(runAccess(publishedBookReviewOrAdminOrEditor, editor), true);
  assert.equal(
    getAnd(runAccess(publishedBookReviewOrAdminOrEditor, null)).length,
    4,
  );
});

test("anonymous REST reads are capped and always paginated", () => {
  const cases: Array<[unknown, unknown]> = [
    [0, ANONYMOUS_REST_MAX_LIMIT],
    [-1, ANONYMOUS_REST_MAX_LIMIT],
    [1000, ANONYMOUS_REST_MAX_LIMIT],
    [20, 20],
    [undefined, undefined],
  ];

  for (const [limit, expected] of cases) {
    const result = runHook(limitAnonymousRestQueries, {
      args: { depth: 10, limit, pagination: false, where: {} },
      operation: "read",
      req: request(null, "REST"),
    }) as Record<string, unknown>;

    assert.equal(result.limit, expected, `limit ${String(limit)}`);
    assert.equal(result.pagination, true);
    assert.equal(result.depth, 10, "depth is bounded by config.maxDepth");
  }
});

test("anonymous distinct queries are capped even without a limit", () => {
  // `findDistinct` has no default page size: without a limit it returns
  // every distinct value.
  for (const [args, expected] of [
    [{ field: "slug" }, ANONYMOUS_REST_MAX_LIMIT],
    [{ field: "slug", limit: undefined }, ANONYMOUS_REST_MAX_LIMIT],
    [{ field: "slug", limit: 0 }, ANONYMOUS_REST_MAX_LIMIT],
    [{ field: "slug", limit: 500 }, ANONYMOUS_REST_MAX_LIMIT],
    [{ field: "slug", limit: 5 }, 5],
  ] as const) {
    const result = runHook(limitAnonymousRestQueries, {
      args: { ...args },
      operation: "readDistinct",
      req: request(null, "REST"),
    }) as Record<string, unknown>;

    assert.equal(result.limit, expected, JSON.stringify(args));
    assert.equal("pagination" in result, false);
  }

  // Counting returns no documents, so it gets no limit.
  assert.deepEqual(
    runHook(limitAnonymousRestQueries, {
      args: { where: {} },
      operation: "count",
      req: request(null, "REST"),
    }),
    { where: {} },
  );
});

test("REST limits leave staff, the Local API, nested population and writes alone", () => {
  const args = { limit: 0, pagination: false };
  const untouched: HookCall[] = [
    { args, operation: "read", req: request(editor, "REST") },
    { args, operation: "read", req: request(admin, "REST") },
    { args, operation: "read", req: request(null, "local") },
    { args, operation: "read", overrideAccess: true, req: request(null) },
    {
      args: { ...args, currentDepth: 2 },
      operation: "read",
      req: request(null, "REST"),
    },
    { args, operation: "create", req: request(null, "REST") },
  ];

  for (const call of untouched) {
    assert.equal(runHook(limitAnonymousRestQueries, call), call.args);
  }
});

test("withAnonymousRestLimits runs the limit first and keeps existing hooks", () => {
  const existing: CollectionBeforeOperationHook = ({ args }) => args;
  const collection: CollectionConfig = {
    fields: [],
    hooks: { beforeOperation: [existing] },
    slug: "examples",
  };
  const limited = withAnonymousRestLimits(collection);

  assert.deepEqual(limited.hooks?.beforeOperation, [
    limitAnonymousRestQueries,
    existing,
  ]);
  assert.deepEqual(
    withAnonymousRestLimits({ fields: [], slug: "plain" }).hooks
      ?.beforeOperation,
    [limitAnonymousRestQueries],
  );
});

test("media cannot be listed anonymously over REST, but population and files keep working", () => {
  for (const operation of ["read", "count", "readDistinct"]) {
    assert.throws(
      () =>
        runHook(denyAnonymousRestReads, {
          args: { limit: 10 },
          operation,
          req: request(null, "REST"),
        }),
      (error: unknown) =>
        error instanceof PublicRequestRefusal &&
        // Payload picks the log level by name; it must survive minification.
        error.name === "Forbidden" &&
        error.isPublic === true &&
        error.status === 403 &&
        /listelenmez/.test(error.message),
    );
  }

  const allowed: HookCall[] = [
    // Relationship population inside an anonymous request.
    { args: { currentDepth: 2 }, operation: "read", req: request(null) },
    // The public site's Local API reads.
    { args: {}, operation: "read", req: request(null, "local") },
    { args: {}, operation: "read", req: request(editor, "REST") },
    { args: {}, operation: "create", req: request(editor, "REST") },
  ];

  for (const call of allowed) {
    assert.equal(runHook(denyAnonymousRestReads, call), call.args);
  }
});

test("serving a file is not a listing: the Blob adapter's own lookup passes untouched", () => {
  // What @payloadcms/plugin-cloud-storage's getFilePrefix sends while
  // `/api/media/file/<filename>` is served to an anonymous visitor.
  const fileLookup: HookCall = {
    args: {
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      select: { _objectKey: true, prefix: true },
      where: { or: [{ filename: { equals: "kapak.jpg" } }] },
    },
    operation: "read",
    req: {
      payloadAPI: "REST",
      routeParams: { collection: "media", filename: "kapak.jpg" },
      user: null,
    } as unknown as PayloadRequest,
  };

  assert.equal(runHook(denyAnonymousRestReads, fileLookup), fileLookup.args);
  assert.equal(runHook(limitAnonymousRestQueries, fileLookup), fileLookup.args);

  // The list endpoint of the same collection stays closed.
  assert.throws(() =>
    runHook(denyAnonymousRestReads, {
      ...fileLookup,
      req: {
        payloadAPI: "REST",
        routeParams: { collection: "media" },
        user: null,
      } as unknown as PayloadRequest,
    }),
  );
});

test("collectWherePaths walks nested and/or groups", () => {
  assert.deepEqual(
    collectWherePaths({
      and: [
        { _status: { equals: "published" } },
        {
          or: [
            { "marketData.salePricePerM2": { greater_than: 1 } },
            { "sources.url": { like: "x" } },
          ],
        },
      ],
      district: { equals: "esenler" },
    }),
    ["_status", "marketData.salePricePerM2", "sources.url", "district"],
  );
  assert.deepEqual(collectWherePaths(undefined), []);
  assert.deepEqual(collectWherePaths({ and: "not-an-array" }), []);
});

test("the anonymous query allowlist blocks oracles on hidden fields", () => {
  const hook = createAnonymousQueryAllowlist([
    "_status",
    "district",
    "publishedAt",
  ]);
  const allowedArgs = {
    sort: "-publishedAt",
    where: {
      and: [
        { _status: { equals: "published" } },
        { district: { equals: "esenler" } },
      ],
    },
  };

  for (const payloadAPI of ["REST", "local"] as const) {
    assert.equal(
      runHook(hook, {
        args: allowedArgs,
        operation: "read",
        req: request(null, payloadAPI),
      }),
      allowedArgs,
    );
  }

  const rejected: Array<Record<string, unknown>> = [
    { where: { "marketData.salePricePerM2": { greater_than: 50000 } } },
    {
      where: {
        or: [
          { district: { equals: "esenler" } },
          { "sources.url": { like: "belediye" } },
        ],
      },
    },
    { sort: "-marketData.averageRent" },
    { sort: ["publishedAt", "history"] },
    { field: "researchNotes" },
  ];

  for (const args of rejected) {
    for (const operation of ["read", "count", "readDistinct"]) {
      assert.throws(
        () => runHook(hook, { args, operation, req: request(null, "local") }),
        (error: unknown) =>
          error instanceof Error && "status" in error && error.status === 403,
        JSON.stringify(args),
      );
    }
  }

  // Staff and trusted server code keep full query access.
  const hidden = { where: { "marketData.salePricePerM2": { exists: true } } };
  assert.equal(
    runHook(hook, { args: hidden, operation: "read", req: request(editor) }),
    hidden,
  );
  assert.equal(
    runHook(hook, {
      args: hidden,
      operation: "read",
      overrideAccess: true,
      req: request(null, "local"),
    }),
    hidden,
  );
  assert.equal(
    runHook(hook, { args: hidden, operation: "update", req: request(null) }),
    hidden,
    "writes are governed by access control, not this allowlist",
  );
});

test("editorial fields stay hidden from anonymous REST and GraphQL readers only", () => {
  const read = (user: unknown, api: "GraphQL" | "local" | "REST") =>
    editorialFieldRead({ req: request(user, api) } as Parameters<
      typeof editorialFieldRead
    >[0]);

  assert.equal(read(null, "REST"), false);
  assert.equal(read(null, "GraphQL"), false);
  assert.equal(read({ id: "u-x", role: "viewer" }, "REST"), false);
  assert.equal(read(admin, "REST"), true);
  assert.equal(read(editor, "REST"), true);
  // The public pages read through the Local API and drop the fields in
  // their mappers.
  assert.equal(read(null, "local"), true);
  assert.equal(isPublicApiReader(request(null, "REST")), true);
  assert.equal(isPublicApiReader(request(null, "local")), false);
});
