/**
 * End-to-end checks of the Payload configuration against a throwaway SQLite
 * database (schema pushed from the config) and a temporary media folder.
 * Nothing touches `.data/`, `public/media` or any remote service.
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import type { Payload, PayloadRequest, SanitizedConfig, Where } from "payload";
import sharp from "sharp";
import type { Article } from "../payload-types";
import { INTERNAL_LINK_COLLECTIONS } from "@/content/rich-text/internal-link-collections";

const temporaryDirectory = await mkdtemp(
  path.join(os.tmpdir(), "cms-integration-"),
);
const databaseUrl = `file:${path.join(temporaryDirectory, "cms.db")}`;
const mediaDirectory = path.join(temporaryDirectory, "media");

Object.assign(process.env, {
  DATABASE_URL: databaseUrl,
  PAYLOAD_DATABASE: "sqlite",
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || "integration-test-only-secret",
  PAYLOAD_STORAGE: "local",
});

const {
  default: configPromise,
  getCsrfAllowedOrigins,
  MAX_UPLOAD_BYTES,
  PRODUCTION_SITE_ORIGIN,
  RICH_TEXT_REMOVED_FEATURES,
} = await import("../payload.config");
const { siteUrl } = await import("../config/site");
const { sqliteAdapter } = await import("@payloadcms/db-sqlite");
const { getPayload } = await import("payload");
const { limitAnonymousRestQueries } = await import("../lib/payloadAccess");
const { LOGIN_LOCK_TIME_MS, MAX_LOGIN_ATTEMPTS } = await import("./Users");

const config: SanitizedConfig = await configPromise;
config.typescript.autoGenerate = false;
Object.assign(
  config.db,
  sqliteAdapter({ client: { url: databaseUrl }, idType: "uuid", push: true }),
);
for (const collection of config.collections) {
  if (collection.slug === "media" && collection.upload) {
    collection.upload.staticDir = mediaDirectory;
  }
}

const payload: Payload = await getPayload({ config });

after(async () => {
  await payload.destroy();
  await rm(temporaryDirectory, { force: true, recursive: true });
});

/** A request as an anonymous REST client would make it. */
function anonymousRest(): Partial<PayloadRequest> {
  return { payloadAPI: "REST" };
}

function hasStatus(status: number, pattern?: RegExp) {
  return (error: unknown) =>
    error instanceof Error &&
    "status" in error &&
    error.status === status &&
    (pattern === undefined || pattern.test(error.message));
}

function validationPaths(error: unknown): string[] {
  assert.ok(error instanceof Error && "data" in error, String(error));
  const errors = (error.data as { errors?: Array<{ path: string }> }).errors;
  assert.ok(Array.isArray(errors));
  return errors.map((entry) => entry.path);
}

const paragraph = (text: string): NonNullable<Article["content"]> => ({
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text,
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

test("configuration: depth cap, anonymous REST limits and a rich text editor the site can render", () => {
  assert.equal(config.maxDepth, 2);
  // Uploads pass through a Vercel Function (4.5 MB request body limit):
  // the admin must refuse a larger file itself, with a readable message.
  assert.equal(MAX_UPLOAD_BYTES, 4 * 1024 * 1024);
  assert.ok(MAX_UPLOAD_BYTES < 4.5 * 1000 * 1000);
  assert.equal(config.upload.limits?.fileSize, MAX_UPLOAD_BYTES);
  assert.equal(config.upload.abortOnLimit, true);
  assert.match(String(config.upload.responseOnLimit), /4 MiB/);
  // Deliberate refusals are named Forbidden and logged at info level.
  assert.equal(config.loggingLevels.Forbidden, "info");
  // No Gravatar request (email hash to a third party) from the admin.
  assert.equal(config.admin.avatar, "default");

  for (const slug of [
    "users",
    "media",
    "categories",
    "district-guides",
    "articles",
    "books",
    "pages",
    "photo-collections",
    "tags",
    "photos",
  ]) {
    const collection = config.collections.find((entry) => entry.slug === slug);
    assert.ok(collection, slug);
    assert.equal(
      collection.hooks.beforeOperation[0],
      limitAnonymousRestQueries,
      slug,
    );
  }

  const editorConfig = (
    config.editor as unknown as {
      editorConfig: {
        resolvedFeatureMap: Map<
          string,
          { sanitizedServerFeatureProps?: Record<string, unknown> }
        >;
      };
    }
  ).editorConfig;
  const features = editorConfig.resolvedFeatureMap;

  // The resolved editor (not only configureRichTextFeatures) offers no
  // feature the public renderer has no design for (FRONTEND-1).
  for (const key of RICH_TEXT_REMOVED_FEATURES) {
    assert.equal(features.has(key), false, key);
  }
  assert.deepEqual(
    features.get("heading")?.sanitizedServerFeatureProps?.enabledHeadingSizes,
    ["h2", "h3", "h4"],
  );
  assert.deepEqual(
    features.get("link")?.sanitizedServerFeatureProps?.enabledCollections,
    [...INTERNAL_LINK_COLLECTIONS],
  );
  assert.ok(features.has("upload") && features.has("paragraph"));
});

test("users: every way of setting a password needs 12 characters that are not the email", async () => {
  const { handleEndpoints } = await import("payload");
  const restPost = (endpoint: string, body: Record<string, unknown>) =>
    handleEndpoints({
      config,
      request: new Request(`http://localhost:3000/api/users/${endpoint}`, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    });
  const countUsers = async () =>
    (await payload.count({ collection: "users" })).totalDocs;
  const refusedPassword = (pattern: RegExp) => (error: unknown) =>
    hasStatus(400)(error) &&
    validationPaths(error).includes("password") &&
    error instanceof Error &&
    "data" in error &&
    pattern.test(JSON.stringify(error.data));

  // The first registration (REST, no account yet) follows the same rule.
  assert.equal(await countUsers(), 0);
  for (const password of ["abc", "Short-Pass1", "first@example.com"]) {
    const response = await restPost("first-register", {
      confirmPassword: password,
      email: "first@example.com",
      password,
    });
    assert.equal(response.status, 400, password);
    assert.match(await response.text(), /Parola/, password);
  }
  assert.equal(await countUsers(), 0);
  const registered = await restPost("first-register", {
    confirmPassword: "Correct-Horse-0",
    email: "first@example.com",
    password: "Correct-Horse-0",
  });
  assert.equal(registered.status, 200);
  const first = await payload.find({
    collection: "users",
    where: { email: { equals: "first@example.com" } },
  });
  const firstUser = first.docs[0];
  assert.ok(firstUser);

  // Local API create and update, by an admin or through the account page.
  await assert.rejects(
    payload.create({
      collection: "users",
      data: { email: "weak@example.com", password: "abc", role: "editor" },
    }),
    refusedPassword(/en az 12 karakter/),
  );
  await assert.rejects(
    payload.create({
      collection: "users",
      data: {
        email: "Long.Address@Example.com",
        password: "long.address@example.com",
        role: "editor",
      },
    }),
    refusedPassword(/e-posta adresiyle aynı/),
  );
  await assert.rejects(
    payload.update({
      collection: "users",
      data: { password: "abc" },
      id: firstUser.id,
    }),
    refusedPassword(/en az 12 karakter/),
  );
  await assert.rejects(
    payload.update({
      collection: "users",
      data: { password: "first@example.com" },
      id: firstUser.id,
      overrideAccess: false,
      req: { user: { ...firstUser, collection: "users" } },
    }),
    refusedPassword(/e-posta adresiyle aynı/),
  );
  assert.equal(await countUsers(), 1);

  // A bulk update (`where`, no `id`) compares with the stored email of every
  // matching account. Through the Local API (access overridden, no user) the
  // lookup must not fail on the read access, and through the caller's own
  // access it reads only the accounts that caller may see.
  const byEmail = { email: { equals: "first@example.com" } };
  await assert.rejects(
    payload.update({
      collection: "users",
      data: { password: "first@example.com" },
      where: byEmail,
    }),
    refusedPassword(/e-posta adresiyle aynı/),
  );
  await assert.rejects(
    payload.update({
      collection: "users",
      data: { password: "first@example.com" },
      overrideAccess: false,
      req: { user: { ...firstUser, collection: "users" } },
      where: byEmail,
    }),
    refusedPassword(/e-posta adresiyle aynı/),
  );
  const bulk = await payload.update({
    collection: "users",
    data: { password: "Correct-Horse-Bulk" },
    where: byEmail,
  });
  assert.equal(bulk.errors.length, 0);
  assert.equal(bulk.docs.length, 1);

  // Reset with a valid token: the short password is refused, the token stays.
  const token = "integration-reset-token";
  await payload.db.updateOne({
    collection: "users",
    data: {
      resetPasswordExpiration: new Date(Date.now() + 60_000).toISOString(),
      resetPasswordToken: token,
    },
    id: firstUser.id,
  });
  await assert.rejects(
    payload.resetPassword({
      collection: "users",
      data: { password: "abc", token },
      overrideAccess: true,
    }),
    refusedPassword(/en az 12 karakter/),
  );
  const reset = await payload.resetPassword({
    collection: "users",
    data: { password: "Correct-Horse-Reset", token },
    overrideAccess: true,
  });
  assert.ok(reset.token);

  // The next test expects an empty collection (first account is admin).
  await payload.db.deleteOne({
    collection: "users",
    where: { id: { equals: firstUser.id } },
  });
  assert.equal(await countUsers(), 0);
});

test("users: first account is admin, new accounts are editors, the last admin is protected", async () => {
  const owner = await payload.create({
    collection: "users",
    data: {
      email: "owner@example.com",
      password: "Correct-Horse-1",
      role: "editor",
    },
  });
  assert.equal(owner.role, "admin");

  // @ts-expect-error `role` is omitted on purpose: the default must apply.
  const colleague = await payload.create({
    collection: "users",
    data: { email: "editor@example.com", password: "Correct-Horse-2" },
  });
  assert.equal(colleague.role, "editor");

  await assert.rejects(
    payload.update({
      collection: "users",
      data: { role: "editor" },
      id: owner.id,
    }),
    hasStatus(409, /son yönetici/),
  );
  await assert.rejects(
    payload.delete({ collection: "users", id: owner.id }),
    hasStatus(409, /son yönetici/),
  );

  await payload.update({
    collection: "users",
    data: { role: "admin" },
    id: colleague.id,
  });
  const demoted = await payload.update({
    collection: "users",
    data: { role: "editor" },
    id: owner.id,
  });
  assert.equal(demoted.role, "editor");

  await assert.rejects(
    payload.forgotPassword({
      collection: "users",
      data: { email: "owner@example.com" },
      disableEmail: true,
    }),
    hasStatus(403, /henüz yapılandırılmadı/),
  );

  // A bulk edit or bulk delete of every admin (several users selected in the
  // admin list) runs its documents in parallel; one admin must remain.
  const countAdmins = async () =>
    (
      await payload.count({
        collection: "users",
        where: { role: { equals: "admin" } },
      })
    ).totalDocs;

  await payload.update({
    collection: "users",
    data: { role: "admin" },
    id: owner.id,
  });
  assert.equal(await countAdmins(), 2);

  const bulkEdit = await payload.update({
    collection: "users",
    data: { role: "editor" },
    where: { role: { equals: "admin" } },
  });
  assert.equal(bulkEdit.docs.length, 1);
  assert.equal(bulkEdit.errors.length, 1);
  assert.match(bulkEdit.errors[0]?.message ?? "", /son yönetici/);
  assert.equal(await countAdmins(), 1);

  await payload.update({
    collection: "users",
    data: { role: "admin" },
    where: { role: { equals: "editor" } },
  });
  assert.equal(await countAdmins(), 2);

  const bulkDelete = await payload.delete({
    collection: "users",
    where: { role: { equals: "admin" } },
  });
  assert.equal(bulkDelete.docs.length, 1);
  assert.equal(bulkDelete.errors.length, 1);
  assert.match(bulkDelete.errors[0]?.message ?? "", /son yönetici/);
  assert.equal(await countAdmins(), 1);
});

test("users: only admins unlock a locked account, and editors learn nothing about other emails", async () => {
  const lockedAdmin = await payload.create({
    collection: "users",
    data: {
      email: "locked-admin@example.com",
      password: "Correct-Horse-3",
      role: "admin",
    },
  });
  const unlockingAdmin = await payload.create({
    collection: "users",
    data: {
      email: "unlocking-admin@example.com",
      password: "Correct-Horse-4",
      role: "admin",
    },
  });
  const unlockingEditor = await payload.create({
    collection: "users",
    data: {
      email: "unlocking-editor@example.com",
      password: "Correct-Horse-5",
      role: "editor",
    },
  });

  const lock = () =>
    payload.update({
      collection: "users",
      data: {
        lockUntil: new Date(Date.now() + LOGIN_LOCK_TIME_MS).toISOString(),
        loginAttempts: MAX_LOGIN_ATTEMPTS,
      },
      id: lockedAdmin.id,
    });
  const lockState = async () => {
    const user = await payload.findByID({
      collection: "users",
      id: lockedAdmin.id,
      showHiddenFields: true,
    });
    return {
      lockUntil: user.lockUntil ?? null,
      loginAttempts: user.loginAttempts,
    };
  };
  const unlockAs = (
    user: typeof unlockingAdmin,
    email: string,
  ): Promise<boolean> =>
    payload.unlock({
      collection: "users",
      // The generated login type requires `password`; unlock ignores it.
      data: { email, password: "" },
      overrideAccess: false,
      req: { user: { ...user, collection: "users" } },
    });

  await lock();
  // Existing and unknown addresses get the same refusal: no account oracle.
  for (const email of ["locked-admin@example.com", "nobody@example.com"]) {
    await assert.rejects(unlockAs(unlockingEditor, email), hasStatus(403));
  }
  const stillLocked = await lockState();
  assert.equal(stillLocked.loginAttempts, MAX_LOGIN_ATTEMPTS);
  assert.ok(stillLocked.lockUntil, "the editor must not clear the lock");

  assert.equal(
    await unlockAs(unlockingAdmin, "locked-admin@example.com"),
    true,
  );
  assert.deepEqual(await lockState(), { lockUntil: null, loginAttempts: 0 });

  for (const user of [lockedAdmin, unlockingAdmin, unlockingEditor]) {
    await payload.delete({ collection: "users", id: user.id });
  }
});

test("users: a password change cannot confirm another account's email, and login hides the lock", async () => {
  const target = await payload.create({
    collection: "users",
    data: {
      email: "oracle-target@example.com",
      password: "Correct-Horse-6",
      role: "admin",
    },
  });
  const otherEditor = await payload.create({
    collection: "users",
    data: {
      email: "oracle-editor@example.com",
      password: "Correct-Horse-7",
      role: "editor",
    },
  });

  // The guessed email of another account is refused by access (403), never
  // by the password rule (400), for anonymous readers and editors alike.
  for (const req of [
    anonymousRest(),
    {
      payloadAPI: "REST" as const,
      user: { ...otherEditor, collection: "users" as const },
    },
  ]) {
    for (const password of [
      "oracle-target@example.com",
      "Not-The-Email-At-All",
    ]) {
      await assert.rejects(
        payload.update({
          collection: "users",
          data: { password },
          id: target.id,
          overrideAccess: false,
          req,
        }),
        hasStatus(403),
        password,
      );
    }
  }

  const { handleEndpoints } = await import("payload");
  const login = async (email: string, password: string) => {
    const response = await handleEndpoints({
      config,
      request: new Request("http://localhost:3000/api/users/login", {
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    });
    return { body: await response.json(), status: response.status };
  };

  const unknown = await login("nobody-here@example.com", "Wrong-Password-1");
  assert.equal(unknown.status, 401);
  for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt += 1) {
    assert.deepEqual(
      await login("oracle-target@example.com", "Wrong-Password-1"),
      unknown,
      `attempt ${attempt}`,
    );
  }
  // Locked now, even for the right password, but the answer does not say so.
  assert.deepEqual(
    await login("oracle-target@example.com", "Correct-Horse-6"),
    unknown,
  );
  const locked = await payload.findByID({
    collection: "users",
    id: target.id,
    showHiddenFields: true,
  });
  assert.ok(locked.lockUntil, "the lock still applies");

  for (const user of [target, otherEditor]) {
    await payload.delete({ collection: "users", id: user.id });
  }
});

test("csrf: the allowlist covers production, this Preview deployment and local development only", () => {
  assert.deepEqual(config.csrf, getCsrfAllowedOrigins(process.env));
  assert.ok(config.csrf.includes(PRODUCTION_SITE_ORIGIN));
  // One source for the canonical origin: src/config/site.ts.
  assert.equal(PRODUCTION_SITE_ORIGIN, "https://www.sabandurali.com");
  assert.equal(PRODUCTION_SITE_ORIGIN, new URL(siteUrl).origin);
  assert.equal(config.serverURL, "", "serverURL would pin one origin");

  assert.deepEqual(getCsrfAllowedOrigins({}), [
    "https://www.sabandurali.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ]);
  assert.deepEqual(getCsrfAllowedOrigins({ PORT: "4123" }).slice(1), [
    "http://localhost:4123",
    "http://127.0.0.1:4123",
    "http://[::1]:4123",
  ]);
  assert.ok(
    getCsrfAllowedOrigins({ PORT: "nope" }).includes("http://localhost:3000"),
  );

  // Production: canonical domains only, never localhost or *.vercel.app.
  assert.deepEqual(
    getCsrfAllowedOrigins({
      PORT: "3000",
      VERCEL_BRANCH_URL: "site-git-main-team.vercel.app",
      VERCEL_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "www.sabandurali.com",
      VERCEL_URL: "site-abc123-team.vercel.app",
    }),
    ["https://www.sabandurali.com"],
  );

  // Preview: this deployment's branch and deployment URLs, over HTTPS.
  assert.deepEqual(
    getCsrfAllowedOrigins({
      VERCEL_BRANCH_URL: "site-git-fix-team.vercel.app",
      VERCEL_ENV: "preview",
      VERCEL_URL: "SITE-abc123-team.vercel.app",
    }),
    [
      "https://www.sabandurali.com",
      "https://site-git-fix-team.vercel.app",
      "https://site-abc123-team.vercel.app",
    ],
  );

  // Malformed system values are ignored instead of widening the list.
  assert.deepEqual(
    getCsrfAllowedOrigins({
      VERCEL_BRANCH_URL: "evil.example/path",
      VERCEL_ENV: "preview",
      VERCEL_URL: "user@evil.example",
    }),
    ["https://www.sabandurali.com"],
  );

  // On Vercel without VERCEL_ENV (system variables not exposed) the list
  // does not fall back to the local origins.
  assert.deepEqual(getCsrfAllowedOrigins({ VERCEL: "1", PORT: "3000" }), [
    "https://www.sabandurali.com",
  ]);

  // `vercel env pull` writes VERCEL=1 with VERCEL_ENV=development into
  // .env.local: local development keeps its own origins.
  assert.deepEqual(
    getCsrfAllowedOrigins({
      VERCEL: "1",
      VERCEL_ENV: "development",
      PORT: "3000",
    }),
    [
      "https://www.sabandurali.com",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://[::1]:3000",
    ],
  );
});

test("csrf: a session cookie is ignored on cross-origin and unmarked requests", async () => {
  const email = "csrf-admin@example.com";
  const password = "Correct-Horse-6";
  const account = await payload.create({
    collection: "users",
    data: { email, password, role: "admin" },
  });
  const { token } = await payload.login({
    collection: "users",
    data: { email, password },
  });
  assert.ok(token);

  const userFor = async (headers: Record<string, string>) =>
    (
      await payload.auth({
        headers: new Headers({
          Cookie: `${config.cookiePrefix}-token=${token}`,
          ...headers,
        }),
      })
    ).user?.email ?? null;

  // Listed origins and browser-marked same-origin or direct requests.
  assert.equal(await userFor({ Origin: PRODUCTION_SITE_ORIGIN }), email);
  for (const origin of config.csrf) {
    assert.equal(await userFor({ Origin: origin }), email, origin);
  }
  assert.equal(await userFor({ "Sec-Fetch-Site": "same-origin" }), email);
  assert.equal(await userFor({ "Sec-Fetch-Site": "none" }), email);

  // A foreign page, a sibling subdomain or a non-browser client with only
  // the cookie gets no session.
  const refused: Array<Record<string, string>> = [
    { Origin: "https://evil.example" },
    { Origin: "https://evil.sabandurali.com" },
    { Origin: "http://www.sabandurali.com" },
    { Origin: "null" },
    { "Sec-Fetch-Site": "cross-site" },
    {},
  ];
  for (const headers of refused) {
    assert.equal(await userFor(headers), null, JSON.stringify(headers));
  }

  // A bearer token is not a cookie: CSRF does not apply to it.
  assert.equal(
    (
      await payload.auth({
        headers: new Headers({
          Authorization: `JWT ${token}`,
          Origin: "https://evil.example",
        }),
      })
    ).user?.email,
    email,
  );

  await payload.delete({ collection: "users", id: account.id });
});

test("media: uploads lose EXIF and GPS data and are capped at 3200 px", async () => {
  const original = await sharp({
    create: { background: "#7a7a7a", channels: 3, height: 3000, width: 4000 },
  })
    .jpeg()
    .withExif({
      IFD0: { Make: "IntegrationCam", Model: "GPS-1" },
      IFD3: { GPSLatitude: "41/1 2/1 0/1", GPSLatitudeRef: "N" },
    })
    .toBuffer();
  assert.ok((await sharp(original).metadata()).exif, "fixture carries EXIF");

  const media = await payload.create({
    collection: "media",
    data: { alt: "Gri test görseli" },
    file: {
      data: original,
      mimetype: "image/jpeg",
      name: "konumlu-fotograf.jpg",
      size: original.length,
    },
  });

  assert.ok(media.filename);
  const stored = path.join(mediaDirectory, media.filename);
  assert.ok(existsSync(stored));

  const metadata = await sharp(stored).metadata();
  assert.equal(metadata.exif, undefined, "EXIF and GPS are removed");
  assert.ok((metadata.width ?? 0) <= 3200 && (metadata.height ?? 0) <= 3200);
  assert.equal(media.width, 3200);
  assert.equal(media.height, 2400);
});

test("anonymous REST: media cannot be listed, other lists are capped, population still works", async () => {
  await assert.rejects(
    payload.find({
      collection: "media",
      overrideAccess: false,
      req: anonymousRest(),
    }),
    hasStatus(403),
  );

  // Serving `/api/media/file/<filename>` from Vercel Blob runs the storage
  // plugin's anonymous lookup; it must keep working for every visitor.
  const [upload] = (await payload.find({ collection: "media", limit: 1 })).docs;
  assert.ok(upload?.filename);
  const mediaConfig = config.collections.find(
    (collection) => collection.slug === "media",
  );
  assert.ok(mediaConfig);
  const { getFilePrefix } =
    await import("@payloadcms/plugin-cloud-storage/utilities");
  const { createLocalReq } = await import("payload");
  const fileRequest = await createLocalReq(
    {
      req: {
        payloadAPI: "REST",
        routeParams: { collection: "media", filename: upload.filename },
      },
    },
    payload,
  );
  assert.equal(
    await getFilePrefix({
      collection: mediaConfig,
      filename: upload.filename,
      req: fileRequest,
    }),
    "",
  );

  const category = await payload.create({
    collection: "categories",
    data: { name: "Gayrimenkul", slug: "gayrimenkul" },
  });
  const [image] = (await payload.find({ collection: "media", limit: 1 })).docs;
  assert.ok(image);

  await payload.create({
    collection: "articles",
    data: {
      _status: "published",
      articleType: "article",
      categories: [category.id],
      content: paragraph("Kentsel dönüşüm üzerine kısa bir not."),
      excerpt: "Kentsel dönüşüm",
      featuredImage: image.id,
      slug: "kentsel-donusum-notu",
      title: "Kentsel dönüşüm notu",
    },
  });

  const result = await payload.find({
    collection: "articles",
    depth: 1,
    limit: 0,
    overrideAccess: false,
    pagination: false,
    req: anonymousRest(),
  });

  assert.equal(result.limit, 50, "limit=0 is capped");
  assert.equal(result.docs.length, 1);

  const distinct = await payload.findDistinct({
    collection: "articles",
    field: "slug",
    overrideAccess: false,
    req: anonymousRest(),
  });
  assert.equal(distinct.limit, 50, "distinct values are capped as well");
  assert.deepEqual(
    distinct.values.map((value) => value.slug),
    ["kentsel-donusum-notu"],
  );
  const featuredImage = result.docs[0].featuredImage;
  assert.ok(
    typeof featuredImage === "object" && featuredImage !== null,
    "media relationships still populate for anonymous readers",
  );
  assert.equal(featuredImage.id, image.id);
});

test("anonymous REST: rich text links never name a document the reader cannot read", async () => {
  const internalLink = (
    target: { id: string | number },
    text: string,
  ): Record<string, unknown> => ({
    children: [
      {
        detail: 0,
        format: 0,
        mode: "normal",
        style: "",
        text,
        type: "text",
        version: 1,
      },
    ],
    direction: "ltr",
    fields: {
      doc: { relationTo: "articles", value: target.id },
      linkType: "internal",
      newTab: false,
    },
    format: "",
    indent: 0,
    type: "link",
    version: 3,
  });
  const [category] = (
    await payload.find({ collection: "categories", limit: 1 })
  ).docs;
  assert.ok(category);
  const draft = await payload.create({
    collection: "articles",
    data: {
      _status: "draft",
      articleType: "article",
      categories: [category.id],
      content: paragraph("Henüz yayımlanmadı."),
      excerpt: "Taslak",
      slug: "gizli-taslak-makale",
      title: "Gizli taslak makale",
    },
    draft: true,
  });
  const published = await payload.create({
    collection: "articles",
    data: {
      _status: "published",
      articleType: "article",
      categories: [category.id],
      content: paragraph("Yayımlanmış hedef."),
      excerpt: "Hedef",
      slug: "yayimlanmis-hedef",
      title: "Yayımlanmış hedef",
    },
  });
  const content = paragraph("Bağlantılar: ");
  const firstParagraph = content.root.children[0];
  assert.ok(firstParagraph && Array.isArray(firstParagraph.children));
  firstParagraph.children.push(
    internalLink(draft, "taslak"),
    internalLink(published, "hedef"),
  );
  const linking = await payload.create({
    collection: "articles",
    data: {
      _status: "published",
      articleType: "article",
      categories: [category.id],
      content,
      excerpt: "Bağlantılı",
      slug: "baglantili-makale",
      title: "Bağlantılı makale",
    },
  });

  const linkTargets = (doc: { content?: unknown }) => {
    const paragraphNode = (
      doc.content as { root: { children: Array<{ children: unknown[] }> } }
    ).root.children[0];
    assert.ok(paragraphNode);
    return paragraphNode.children
      .filter(
        (node): node is { fields: { doc: unknown } } =>
          typeof node === "object" &&
          node !== null &&
          "type" in node &&
          node.type === "link",
      )
      .map((node) => node.fields.doc);
  };
  const readAs = async (
    depth: number,
    req: Partial<PayloadRequest> = anonymousRest(),
  ) =>
    payload.findByID({
      collection: "articles",
      depth,
      id: linking.id,
      overrideAccess: false,
      req,
    });

  // depth=0: the published target keeps its reference, the draft loses it.
  assert.deepEqual(linkTargets(await readAs(0)), [
    null,
    { relationTo: "articles", value: published.id },
  ]);
  // depth=1: Payload populates what the reader may read.
  const [hidden, shown] = linkTargets(await readAs(1));
  assert.ok(
    hidden === null ||
      (typeof hidden === "object" &&
        "value" in hidden &&
        hidden.value === null),
    JSON.stringify(hidden),
  );
  assert.ok(
    typeof shown === "object" &&
      shown !== null &&
      "value" in shown &&
      typeof shown.value === "object" &&
      shown.value !== null &&
      "id" in shown.value &&
      shown.value.id === published.id,
  );
  // The site (Local API) and signed-in editors keep the stored reference.
  const local = await payload.findByID({
    collection: "articles",
    depth: 0,
    draft: false,
    id: linking.id,
    overrideAccess: false,
  });
  assert.deepEqual(linkTargets(local)[0], {
    relationTo: "articles",
    value: draft.id,
  });

  for (const doc of [linking, published, draft]) {
    await payload.delete({ collection: "articles", id: doc.id });
  }
});

test("articles: district news need an https source, other articles need body text; writes never fail on revalidation", async () => {
  const [category] = (
    await payload.find({ collection: "categories", limit: 1 })
  ).docs;
  assert.ok(category);

  await assert.rejects(
    payload.create({
      collection: "articles",
      data: {
        _status: "published",
        articleType: "district-news",
        categories: [category.id],
        excerpt: "Haber özeti",
        externalSource: {
          name: "Esenler Belediyesi",
          url: "http://esenler.bel.tr",
        },
        slug: "ilce-haberi",
        title: "İlçe haberi",
      },
    }),
    (error: unknown) => validationPaths(error).includes("externalSource.url"),
  );

  await assert.rejects(
    payload.create({
      collection: "articles",
      data: {
        _status: "published",
        articleType: "article",
        categories: [category.id],
        excerpt: "Boş makale",
        slug: "bos-makale",
        title: "Boş makale",
      },
    }),
    (error: unknown) => validationPaths(error).includes("content"),
  );

  // Drafts may stay incomplete.
  const draft = await payload.create({
    collection: "articles",
    data: {
      _status: "draft",
      categories: [category.id],
      excerpt: "Taslak",
      slug: "taslak",
      title: "Taslak",
    },
    draft: true,
  });

  const published = await payload.update({
    collection: "articles",
    data: {
      _status: "published",
      content: paragraph("Artık içerik var."),
      seo: { canonical: "/makaleler/taslak" },
    },
    id: draft.id,
  });
  assert.equal(published._status, "published");
  assert.equal(published.seo?.index, true);
  assert.equal(published.author?.name, "Şaban Durali");

  await assert.rejects(
    payload.update({
      collection: "articles",
      data: { seo: { canonical: "https://example.com/kopya" } },
      id: draft.id,
    }),
    (error: unknown) => validationPaths(error).includes("seo.canonical"),
  );

  // Unpublish and delete run the revalidation hooks outside Next.js.
  await payload.update({
    collection: "articles",
    data: { _status: "draft" },
    id: draft.id,
  });
  await payload.delete({ collection: "articles", id: draft.id });
});

test("books: publishing runs the public rules and the database enforces one slug per language", async () => {
  const base = {
    language: "tr" as const,
    personalEvaluation: "Kişisel değerlendirme",
    readingStatus: "planned" as const,
    reviewStatus: "draft" as const,
    seo: {
      description: "Açıklama",
      follow: true,
      index: false,
      title: "Başlık",
    },
    summary: "Özet",
    title: "Derin Çalışma",
    translationStatus: "none" as const,
  };

  const draft = await payload.create({
    collection: "books",
    data: base,
    draft: true,
  });

  await assert.rejects(
    payload.update({
      collection: "books",
      data: { _status: "published" },
      id: draft.id,
    }),
    (error: unknown) => validationPaths(error).includes("reviewStatus"),
  );

  await assert.rejects(
    payload.update({
      collection: "books",
      data: { _status: "published", reviewStatus: "published" },
      id: draft.id,
    }),
    (error: unknown) => {
      const paths = validationPaths(error);
      return [
        "seo.index",
        "authors",
        "category",
        "coverImage",
        "rating",
        "publishedAt",
      ].every((expected) => paths.includes(expected));
    },
  );

  // The unique index works even when the hook is bypassed.
  await assert.rejects(
    payload.db.create({
      collection: "books",
      data: { ...base, _status: "draft", slug: "derin-calisma" },
      req: {},
    }),
    // The database adapter turns the unique-constraint violation into a
    // "Value must be unique" validation error.
    (error: unknown) =>
      error instanceof Error &&
      "data" in error &&
      /must be unique/i.test(JSON.stringify(error.data)),
  );

  // A different language may reuse the slug.
  await assert.doesNotReject(
    payload.db.create({
      collection: "books",
      data: {
        ...base,
        _status: "draft",
        language: "en",
        slug: "derin-calisma",
      },
      req: {},
    }),
  );
});

test("pages: English standard pages stay drafts and the home renders only its own blocks", async () => {
  await assert.rejects(
    payload.create({
      collection: "pages",
      data: {
        _status: "published",
        language: "en",
        pageType: "standard",
        slug: "about",
        summary: "About",
        title: "About",
      },
    }),
    (error: unknown) => validationPaths(error).includes("language"),
  );

  await assert.rejects(
    payload.create({
      collection: "pages",
      data: {
        _status: "published",
        language: "tr",
        layout: [
          {
            action: { href: "/iletisim", label: "İletişim" },
            blockType: "cta",
            title: "Bize ulaşın",
          },
        ],
        pageType: "home",
        slug: "ana-sayfa",
        summary: "Ana sayfa",
        title: "Ana sayfa",
      },
    }),
    (error: unknown) => validationPaths(error).includes("layout"),
  );
});

test("pages: a published home renders all its blocks and stays on the site", async () => {
  const link = (label: string, href: string) => ({ label, href });
  const layout = (aboutLink: { label?: string; href?: string }) => [
    {
      blockType: "hero" as const,
      titleLines: [{ text: "Şaban Durali" }],
      description: "İstanbul üzerine araştırmalar",
      primaryAction: link("Makaleler", "/makaleler"),
      secondaryAction: link("İletişim", "/iletisim"),
    },
    {
      blockType: "homeAbout" as const,
      eyebrow: "Hakkımda",
      titleLines: [{ text: "Kısa biyografi" }],
      paragraphs: [{ text: "Paragraf" }],
      imageAlt: "Portre",
      link: aboutLink,
    },
    {
      blockType: "homeFocusAreas" as const,
      eyebrow: "Alanlar",
      title: "Çalışma alanları",
      cards: [
        {
          icon: "city" as const,
          title: "İstanbul",
          description: "İlçe rehberleri",
          linkLabel: "Rehberler",
        },
      ],
    },
  ];
  const homeData = {
    language: "tr" as const,
    pageType: "home" as const,
    slug: "anasayfa-kaydi",
    summary: "Ana sayfa",
    title: "Ana sayfa",
  };

  // A link label without an address passes the field rules but the public
  // mapper drops the block, so the home would fall back to static content.
  await assert.rejects(
    payload.create({
      collection: "pages",
      data: {
        ...homeData,
        _status: "published",
        layout: layout({ label: "Devamı" }),
      },
    }),
    (error: unknown) => validationPaths(error).includes("layout"),
  );

  const home = await payload.create({
    collection: "pages",
    data: {
      ...homeData,
      _status: "published",
      layout: layout(link("Devamı", "/hakkimda")),
    },
  });
  assert.ok(home.publishedAt);

  const refused = hasStatus(400, /Yayındaki Türkçe Ana Sayfa/);
  const update = (data: Record<string, unknown>, draft = false) =>
    payload.update({ collection: "pages", id: home.id, data, draft });

  await assert.rejects(update({ _status: "draft" }), refused);
  await assert.rejects(
    update({ publishedAt: new Date(Date.now() + 86_400_000).toISOString() }),
    refused,
  );
  await assert.rejects(update({ publishedAt: null }), refused);
  await assert.rejects(update({ pageType: "standard" }), refused);
  await assert.rejects(update({ language: "en" }, true), refused);
  await assert.rejects(
    payload.update({
      collection: "pages",
      where: { id: { equals: home.id } },
      data: { _status: "draft" },
    }),
    refused,
  );

  // A draft over the published home only writes a version.
  await update({ _status: "draft", title: "Taslak başlık" }, true);
  const published = await payload.findByID({
    collection: "pages",
    id: home.id,
    draft: false,
  });
  assert.equal(published._status, "published");
  assert.equal(published.title, "Ana sayfa");

  const republished = await update({ _status: "published", title: "Yeni" });
  assert.equal(republished.title, "Yeni");
});

test("district guides: anonymous readers cannot filter on hidden fields", async () => {
  await assert.rejects(
    payload.find({
      collection: "district-guides",
      overrideAccess: false,
      where: { "marketData.salePricePerM2": { greater_than: 0 } },
    }),
    hasStatus(403),
  );
  await assert.rejects(
    payload.count({
      collection: "district-guides",
      overrideAccess: false,
      req: anonymousRest(),
      where: { "sources.url": { like: "gov" } },
    }),
    hasStatus(403),
  );

  const visible = await payload.find({
    collection: "district-guides",
    overrideAccess: false,
    where: { district: { equals: "esenler" } },
  });
  assert.equal(visible.totalDocs, 0);
});

test("books: anonymous REST readers never see or filter on editorial fields", async () => {
  const [author] = (
    await payload.find({ collection: "users", limit: 1, sort: "createdAt" })
  ).docs;
  assert.ok(author);

  const base = {
    language: "tr" as const,
    personalEvaluation: "Kişisel değerlendirme",
    readingStatus: "completed" as const,
    seo: {
      description: "Açıklama",
      follow: true,
      index: true,
      title: "Başlık",
    },
    summary: "Özet",
  };
  // Written directly: only the read rules are under test here. The draft is
  // a review the public must not learn about through `relatedBooks`.
  const hidden = await payload.db.create({
    collection: "books",
    data: {
      ...base,
      _status: "draft",
      reviewStatus: "draft",
      slug: "gizli-taslak",
      title: "Gizli taslak",
      translationStatus: "none",
    },
    req: {},
  });
  const published = await payload.db.create({
    collection: "books",
    data: {
      ...base,
      _status: "published",
      authorId: author.id,
      editorId: author.id,
      publishedAt: "2026-01-01T00:00:00.000Z",
      relatedBooks: [hidden.id],
      reviewStatus: "published",
      showOnHomepage: true,
      // A draft translation: its ID must not reach the anonymous API.
      translation: hidden.id,
      slug: "editoryal-alanlar",
      title: "Editoryal alanlar",
      translationStatus: "draft",
    },
    req: {},
  });
  const editorialKeys = [
    "authorId",
    "editorId",
    "relatedBooks",
    "reviewStatus",
    "showOnHomepage",
    "translation",
    "translationStatus",
  ];

  const anonymous = await payload.find({
    collection: "books",
    depth: 0,
    overrideAccess: false,
    req: anonymousRest(),
    where: { slug: { equals: "editoryal-alanlar" } },
  });
  assert.equal(anonymous.docs.length, 1);
  const publicDoc: Record<string, unknown> = { ...anonymous.docs[0] };
  assert.deepEqual(
    editorialKeys.filter((key) => key in publicDoc),
    [],
    "editorial fields are removed from the anonymous REST response",
  );
  assert.equal(publicDoc.title, "Editoryal alanlar");

  const editorialFilters: Where[] = [
    { authorId: { equals: author.id } },
    { showOnHomepage: { equals: true } },
    { relatedBooks: { in: [hidden.id] } },
    { translation: { equals: hidden.id } },
  ];
  for (const where of editorialFilters) {
    await assert.rejects(
      payload.find({
        collection: "books",
        overrideAccess: false,
        req: anonymousRest(),
        where,
      }),
      (error: unknown) =>
        error instanceof Error && "status" in error && error.status === 400,
      JSON.stringify(where),
    );
  }

  // The public pages read through the Local API: the mapper still gets the
  // workflow values it checks and then drops.
  const local = await payload.findByID({
    collection: "books",
    depth: 0,
    id: published.id,
    overrideAccess: false,
  });
  assert.equal(local.reviewStatus, "published");
  assert.equal(local.translationStatus, "draft");
  assert.equal(local.translation, hidden.id);

  // Editors keep every field in the REST API (and so in the admin).
  const asEditor = await payload.findByID({
    collection: "books",
    depth: 0,
    id: published.id,
    overrideAccess: false,
    req: { payloadAPI: "REST", user: { ...author, collection: "users" } },
  });
  assert.equal(asEditor.showOnHomepage, true);
  assert.equal(asEditor.reviewStatus, "published");
  assert.deepEqual(asEditor.relatedBooks, [hidden.id]);
});
