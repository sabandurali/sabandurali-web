import {
  APIError,
  type Access,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type PayloadRequest,
  type Where,
} from "payload";

function getUserRole(user: unknown): unknown {
  if (typeof user !== "object" || user === null || !("role" in user)) {
    return undefined;
  }

  return user.role;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Reads one operation argument; operation argument types differ per operation. */
function getOperationArg(args: unknown, key: string): unknown {
  return isRecord(args) ? args[key] : undefined;
}

export function isAdmin(user: unknown): boolean {
  return getUserRole(user) === "admin";
}

export function isAdminOrEditor(user: unknown): boolean {
  const role = getUserRole(user);

  return role === "admin" || role === "editor";
}

export const adminOnly: Access = ({ req }) => isAdmin(req.user);

export const adminOrEditor: Access = ({ req }) => isAdminOrEditor(req.user);

/**
 * Public rows of a collection with drafts: published and no longer scheduled.
 * `now` is a parameter so tests can pin the clock.
 */
export function createPublishedWhere(now: Date = new Date()): Where {
  return {
    and: [
      {
        _status: {
          equals: "published",
        },
      },
      {
        publishedAt: {
          less_than_equal: now.toISOString(),
        },
      },
    ],
  };
}

/**
 * Book reviews are public only when Payload published them, the review itself
 * is marked published, the publication date has passed and indexing is on.
 */
export function createPublishedBookReviewWhere(now: Date = new Date()): Where {
  return {
    and: [
      {
        _status: {
          equals: "published",
        },
      },
      {
        reviewStatus: {
          equals: "published",
        },
      },
      {
        publishedAt: {
          less_than_equal: now.toISOString(),
        },
      },
      {
        "seo.index": {
          equals: true,
        },
      },
    ],
  };
}

export const publishedOrAdminOrEditor: Access = ({ req }) =>
  isAdminOrEditor(req.user) ? true : createPublishedWhere();

export const publishedBookReviewOrAdminOrEditor: Access = ({ req }) =>
  isAdminOrEditor(req.user) ? true : createPublishedBookReviewWhere();

export const publishedPageOrAdminOrEditor: Access = ({ req }) =>
  isAdminOrEditor(req.user) ? true : createPublishedWhere();

// ---------------------------------------------------------------------------
// Anonymous query limits
//
// The public site renders through the Local API. The REST API at `/api/*` is
// still reachable without a session, so anonymous REST reads are part of the
// public surface (CLAUDE.md, rule 5) and get explicit limits.
// ---------------------------------------------------------------------------

/** Largest page an anonymous REST client may request (`limit=0` included). */
export const ANONYMOUS_REST_MAX_LIMIT = 50;

const READ_OPERATIONS: ReadonlySet<string> = new Set([
  "count",
  "read",
  "readDistinct",
]);

type BeforeOperationArgs = Parameters<CollectionBeforeOperationHook>[0];

function isAnonymousRead({
  operation,
  overrideAccess,
  req,
}: Pick<BeforeOperationArgs, "operation" | "overrideAccess" | "req">): boolean {
  return (
    READ_OPERATIONS.has(operation) &&
    overrideAccess !== true &&
    !isAdminOrEditor(req.user)
  );
}

/**
 * `/api/<collection>/file/<filename>` serves one upload. Storage adapters look
 * the file up with an anonymous `find` (Vercel Blob resolves its folder that
 * way), which must keep working: that request lists nothing.
 */
function isFileRequest(req: PayloadRequest): boolean {
  return typeof req.routeParams?.filename === "string";
}

/**
 * True for a read that an anonymous client sent to the REST API itself.
 * Relationship population inside such a request runs nested `find` calls
 * with the same `req` but always passes `currentDepth`; those must keep
 * working, so they are not top-level requests. Nor is serving a file.
 */
export function isAnonymousTopLevelRestRead({
  args,
  operation,
  overrideAccess,
  req,
}: Pick<
  BeforeOperationArgs,
  "args" | "operation" | "overrideAccess" | "req"
>): boolean {
  return (
    isAnonymousRead({ operation, overrideAccess, req }) &&
    req.payloadAPI === "REST" &&
    !isFileRequest(req) &&
    isRecord(args) &&
    getOperationArg(args, "currentDepth") === undefined
  );
}

/**
 * Caps `limit` and forces pagination for anonymous REST reads, so a single
 * request such as `?limit=0&depth=10` cannot return every document of a
 * collection. `maxDepth` in `payload.config.ts` bounds the depth.
 */
export const limitAnonymousRestQueries: CollectionBeforeOperationHook = (
  hookArgs,
) => {
  const { args } = hookArgs;

  if (!isAnonymousTopLevelRestRead(hookArgs)) return args;

  const nextArgs: Record<string, unknown> = { ...args };

  if ("limit" in args) {
    const requested =
      typeof args.limit === "number" && Number.isFinite(args.limit)
        ? args.limit
        : undefined;

    nextArgs.limit =
      requested === undefined
        ? undefined
        : requested <= 0
          ? ANONYMOUS_REST_MAX_LIMIT
          : Math.min(requested, ANONYMOUS_REST_MAX_LIMIT);
  }

  if ("pagination" in args) {
    nextArgs.pagination = true;
  }

  return nextArgs as typeof args;
};

/** Adds {@link limitAnonymousRestQueries} as the first `beforeOperation` hook. */
export function withAnonymousRestLimits(
  collection: CollectionConfig,
): CollectionConfig {
  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      beforeOperation: [
        limitAnonymousRestQueries,
        ...(collection.hooks?.beforeOperation ?? []),
      ],
    },
  };
}

/**
 * Rejects anonymous REST reads entirely. Used for Media: files stay public at
 * `/api/media/file/*` (that route does not run collection operations) and
 * relationship population keeps working, but nobody can list every upload,
 * including the images of unpublished drafts.
 */
export const denyAnonymousRestReads: CollectionBeforeOperationHook = (
  hookArgs,
) => {
  if (isAnonymousTopLevelRestRead(hookArgs)) {
    throw new APIError("Bu kayıtlar herkese açık API'de listelenmez.", 403);
  }

  return hookArgs.args;
};

/** Every field path that a `where` query filters on, including nested and/or. */
export function collectWherePaths(where: unknown): string[] {
  if (!isRecord(where)) return [];

  return Object.entries(where).flatMap(([key, value]) => {
    if (key === "and" || key === "or") {
      return Array.isArray(value) ? value.flatMap(collectWherePaths) : [];
    }

    return [key];
  });
}

function collectSortPaths(sort: unknown): string[] {
  const values =
    typeof sort === "string"
      ? sort.split(",")
      : Array.isArray(sort)
        ? sort.filter((value): value is string => typeof value === "string")
        : [];

  return values
    .map((value) => value.trim().replace(/^-/, ""))
    .filter((value) => value.length > 0);
}

/**
 * Restricts which fields anonymous reads may filter, sort or group by.
 *
 * A collection can hide raw values from anonymous readers in `afterRead`
 * (District Guides project only reviewed and sourced sections), but `where`
 * and `sort` run against the raw database columns. Without this allowlist a
 * query like `where[marketData.salePricePerM2][greater_than]=N` works as a
 * boolean oracle for hidden values. Applies to every anonymous read without
 * `overrideAccess`, so the Local API is held to the same rule.
 */
export function createAnonymousQueryAllowlist(
  allowedPaths: readonly string[],
): CollectionBeforeOperationHook {
  const allowed = new Set(allowedPaths);

  return (hookArgs) => {
    const { args } = hookArgs;

    if (!isAnonymousRead(hookArgs)) return args;

    const field = getOperationArg(args, "field");
    const paths = [
      ...collectWherePaths(getOperationArg(args, "where")),
      ...collectSortPaths(getOperationArg(args, "sort")),
      ...(typeof field === "string" ? [field] : []),
    ];
    const rejected = [...new Set(paths.filter((path) => !allowed.has(path)))];

    if (rejected.length > 0) {
      throw new APIError(
        `Bu alanlar herkese açık sorgularda kullanılamaz: ${rejected.join(", ")}.`,
        403,
      );
    }

    return args;
  };
}
