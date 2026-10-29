import {
  APIError,
  type Access,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type FieldAccess,
  type FieldHook,
  type PayloadRequest,
  type Where,
} from "payload";
import { isRecord } from "@/content/guards";
import {
  INTERNAL_LINK_COLLECTIONS,
  type InternalLinkCollection,
} from "@/content/rich-text/internal-link-collections";

function getUserRole(user: unknown): unknown {
  if (typeof user !== "object" || user === null || !("role" in user)) {
    return undefined;
  }

  return user.role;
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
 * True when a read must not see editorial fields: an anonymous (or
 * non-editor) reader that reached Payload through the REST or GraphQL API
 * and not through the server's own Local API.
 *
 * The public pages read through the Local API with `overrideAccess: false`;
 * their mappers need some workflow values to apply the visibility rules and
 * then drop them (see `src/content/books/public-types.ts`). Anything an API
 * client sends arrives as `REST`, including relationship population inside
 * that request, which reuses the same `req`.
 */
export function isPublicApiReader(req: PayloadRequest): boolean {
  return req.payloadAPI !== "local" && !isAdminOrEditor(req.user);
}

/**
 * Field-level `access.read` for editorial fields that public pages never
 * show (CLAUDE.md, rule 5). Payload removes the field from the response and
 * refuses `where`/`sort` on it, so an anonymous REST query cannot use it as
 * a filter either.
 */
export const editorialFieldRead: FieldAccess = ({ req }) =>
  !isPublicApiReader(req);

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

/**
 * A deliberate 403 refusal of a public request (a blocked listing, a
 * hidden-field query, a disabled feature) with a specific public message.
 * Payload picks the log level by error name; "Forbidden" is logged at "info"
 * by default, so bots probing the API do not flood the error log.
 */
export class PublicRequestRefusal extends APIError {
  constructor(message: string) {
    super(message, 403, null, true);
    // Set explicitly: minifiers rename classes (see Payload's APIError).
    this.name = "Forbidden";
  }
}

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
  const { args, operation } = hookArgs;

  if (!isAnonymousTopLevelRestRead(hookArgs)) return args;

  const nextArgs: Record<string, unknown> = { ...args };
  const requestedLimit = getOperationArg(args, "limit");
  const requested =
    typeof requestedLimit === "number" && Number.isFinite(requestedLimit)
      ? requestedLimit
      : undefined;

  if (requested !== undefined) {
    nextArgs.limit =
      requested <= 0
        ? ANONYMOUS_REST_MAX_LIMIT
        : Math.min(requested, ANONYMOUS_REST_MAX_LIMIT);
  } else if (operation === "readDistinct") {
    // `find` falls back to a page of 10 documents, but `findDistinct`
    // without a limit returns every distinct value of the field.
    nextArgs.limit = ANONYMOUS_REST_MAX_LIMIT;
  } else if ("limit" in args) {
    nextArgs.limit = undefined;
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
    throw new PublicRequestRefusal(
      "Bu kayıtlar herkese açık API'de listelenmez.",
    );
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
      throw new PublicRequestRefusal(
        `Bu alanlar herkese açık sorgularda kullanılamaz: ${rejected.join(", ")}.`,
      );
    }

    return args;
  };
}

// ---------------------------------------------------------------------------
// Rich text internal links in public API responses

type RawLinkTarget = string | number;

function isRawLinkTarget(value: unknown): value is RawLinkTarget {
  return typeof value === "string" || typeof value === "number";
}

function isInternalLinkCollection(
  value: unknown,
): value is InternalLinkCollection {
  return INTERNAL_LINK_COLLECTIONS.some((slug) => slug === value);
}

/**
 * Every unpopulated internal link target (`fields.doc.value` still an ID) in
 * a Lexical tree, grouped by collection. Targets in an unknown collection are
 * grouped under `null`: no public reader may see them.
 */
export function collectRawInternalLinkTargets(
  tree: unknown,
): Map<InternalLinkCollection | null, Set<RawLinkTarget>> {
  const targets = new Map<InternalLinkCollection | null, Set<RawLinkTarget>>();

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!isRecord(node)) return;

    const fields = node.fields;
    if (isRecord(fields) && isRecord(fields.doc)) {
      const { relationTo, value } = fields.doc;
      if (isRawLinkTarget(value)) {
        const key = isInternalLinkCollection(relationTo) ? relationTo : null;
        const ids = targets.get(key) ?? new Set<RawLinkTarget>();
        ids.add(value);
        targets.set(key, ids);
      }
    }

    visit(node.root);
    visit(node.children);
  };

  visit(tree);
  return targets;
}

/**
 * A copy of the Lexical tree in which every unpopulated internal link whose
 * target is not in `visible` loses its `doc` reference. Populated targets
 * (objects or `null`) are already access-checked by Payload and stay as they
 * are; so does everything that is not an internal link reference.
 */
export function withoutHiddenInternalLinkTargets(
  tree: unknown,
  visible: ReadonlyMap<InternalLinkCollection, ReadonlySet<string>>,
): unknown {
  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(visit);
    if (!isRecord(node)) return node;

    const next: Record<string, unknown> = { ...node };
    const fields = node.fields;
    if (isRecord(fields) && isRecord(fields.doc)) {
      const { relationTo, value } = fields.doc;
      if (isRawLinkTarget(value)) {
        const isVisible =
          isInternalLinkCollection(relationTo) &&
          visible.get(relationTo)?.has(String(value)) === true;
        if (!isVisible) next.fields = { ...fields, doc: null };
      }
    }
    if ("root" in node) next.root = visit(node.root);
    if ("children" in node) next.children = visit(node.children);
    return next;
  };

  return visit(tree);
}

/**
 * Field `afterRead` hook for every rich text field (CLAUDE.md, rule 5).
 *
 * Lexical stores an internal link as `{ relationTo, value: <id> }` and only
 * replaces the ID with the access-checked document when the request asks for
 * enough `depth`. A REST client asking for `depth=0` (or reading the deepest
 * populated level) would otherwise receive the collection and ID of a draft
 * or scheduled document that a published text links to. For public API
 * readers, an ID stays only when the reader may read that document itself;
 * the Local API used by the site and editors keep the stored value.
 */
export const hideNonPublicRichTextLinks: FieldHook = async ({ req, value }) => {
  if (!isPublicApiReader(req)) return value;

  const targets = collectRawInternalLinkTargets(value);
  if (targets.size === 0) return value;

  const visible = new Map<InternalLinkCollection, Set<string>>();
  for (const [collection, ids] of targets) {
    if (collection === null) continue;
    const { docs } = await req.payload.find({
      collection,
      depth: 0,
      limit: ids.size,
      overrideAccess: false,
      req,
      where: { id: { in: [...ids] } },
    });
    visible.set(collection, new Set(docs.map((doc) => String(doc.id))));
  }

  return withoutHiddenInternalLinkTargets(value, visible);
};
