import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import {
  HeadingFeature,
  LinkFeature,
  lexicalEditor,
  type LexicalEditorProps,
} from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Articles } from "@/collections/Articles";
import { Books } from "@/collections/Books";
import { Categories } from "@/collections/Categories";
import { DistrictGuides } from "@/collections/DistrictGuides";
import { Media } from "@/collections/Media";
import { Pages } from "@/collections/Pages";
import { PhotoCollections } from "@/collections/PhotoCollections";
import { Photos } from "@/collections/Photos";
import { Tags } from "@/collections/Tags";
import { Users } from "@/collections/Users";
import { ADMIN_I18N, ADMIN_META } from "@/components/admin/admin-settings";
import { INTERNAL_LINK_COLLECTIONS } from "@/content/rich-text/internal-link-collections";
import { siteUrl } from "@/config/site";
import { Navigation } from "@/globals/Navigation";
import { withAnonymousRestLimits } from "@/lib/payloadAccess";
import {
  assertProductionPayloadInfrastructure,
  getPayloadDatabaseProvider,
  getPayloadSecret,
  getPayloadStorageProvider,
  requirePayloadEnvironmentVariable,
} from "@/lib/payloadInfrastructure";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const databaseProvider = getPayloadDatabaseProvider();
const storageProvider = getPayloadStorageProvider();

assertProductionPayloadInfrastructure();

/**
 * Largest upload the admin accepts. Uploads go through a Vercel Function,
 * whose request body limit is 4.5 MB; a larger file would fail there with an
 * opaque 413 instead of this message. Images are re-encoded to at most 3200
 * px on the long edge (see `Media`), so 4 MiB originals are plenty. Direct
 * browser-to-Blob uploads (`clientUploads`) would lift the limit but must be
 * verified on a Preview deployment first.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Heading levels editors may use: the page title is the only `h1`. */
export const RICH_TEXT_HEADING_SIZES = ["h2", "h3", "h4"] as const;

/**
 * Default Lexical features the public renderer has no design for; removed
 * from the editor by `configureRichTextFeatures`.
 */
export const RICH_TEXT_REMOVED_FEATURES = [
  "relationship",
  "checklist",
  "underline",
  "strikethrough",
  "align",
  "indent",
] as const;

const removedRichTextFeatures: ReadonlySet<string> = new Set(
  RICH_TEXT_REMOVED_FEATURES,
);

type RichTextFeatures = Exclude<
  NonNullable<LexicalEditorProps["features"]>,
  (...args: never[]) => unknown
>;

/**
 * The default Lexical features, adjusted to what the public renderer shows:
 *
 * - headings: `h2`–`h4` only;
 * - links: custom URLs, plus internal links to the collections the public
 *   renderer resolves to a page (`INTERNAL_LINK_COLLECTIONS`);
 * - relationship blocks: removed, the public site cannot render them;
 * - checklists, underline, strikethrough, alignment and indentation:
 *   removed (`RICH_TEXT_REMOVED_FEATURES`). A checklist renders as nested
 *   interactive controls, underlined text reads as a link (DESIGN-SYSTEM §6)
 *   and the rest are inline styles outside the design system or are dropped
 *   by the public renderer, so the editor would show what readers never see.
 */
export function configureRichTextFeatures(
  defaultFeatures: RichTextFeatures,
): RichTextFeatures {
  return defaultFeatures.flatMap((feature) => {
    switch (feature.key) {
      case "heading":
        return [
          HeadingFeature({ enabledHeadingSizes: [...RICH_TEXT_HEADING_SIZES] }),
        ];
      case "link":
        return [
          LinkFeature({ enabledCollections: [...INTERNAL_LINK_COLLECTIONS] }),
        ];
      default:
        return removedRichTextFeatures.has(feature.key) ? [] : [feature];
    }
  });
}

/**
 * The canonical public origin (the bare domain redirects here), derived
 * from the one site URL in src/config/site.ts.
 */
export const PRODUCTION_SITE_ORIGIN = new URL(siteUrl).origin;

const LOCAL_DEFAULT_PORT = 3000;

function httpsOriginFromHost(host: string | undefined): string | null {
  const value = host?.trim().toLowerCase();
  if (!value) return null;
  try {
    const url = new URL(`https://${value}`);
    // A bare host name only: no path, credentials, query or port tricks.
    return url.host === value ? url.origin : null;
  } catch {
    return null;
  }
}

function localPort(port: string | undefined): number {
  const value = Number(port?.trim());
  return Number.isInteger(value) && value > 0 && value < 65536
    ? value
    : LOCAL_DEFAULT_PORT;
}

/**
 * Origins whose requests may use the admin session cookie (Payload `csrf`).
 * With an allowlist, Payload ignores the cookie on a request whose `Origin`
 * is not listed, and on a request without `Origin` unless `Sec-Fetch-Site` is
 * `same-origin`, `same-site` or `none`. This is a second layer behind the
 * `SameSite=Lax` cookie (see `Users`), which alone admits every subdomain.
 *
 * `serverURL` is deliberately not set: one fixed URL would break Preview
 * deployments and local development. The list is derived from the
 * environment instead (Vercel system variables, read at runtime):
 *
 * - every environment: the canonical production origin;
 * - Production (`VERCEL_ENV=production`): also `VERCEL_PROJECT_PRODUCTION_URL`;
 * - Preview: the branch URL and the deployment URL of this deployment only;
 * - off Vercel (`next dev`, local `next start`, CI) and in Vercel's local
 *   development environment (`VERCEL_ENV=development`, which `vercel dev`
 *   and an `.env.local` from `vercel env pull` set together with
 *   `VERCEL=1`): `localhost`, `127.0.0.1` and `[::1]` on `PORT` (default
 *   3000), over plain HTTP;
 * - on Vercel (`VERCEL=1`) without a known `VERCEL_ENV` (system variables
 *   not exposed): the canonical origin only, never localhost.
 *
 * The admin of a Production deployment opened through its `*.vercel.app`
 * deployment URL therefore cannot save; use the canonical domain.
 */
export function getCsrfAllowedOrigins(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string[] {
  const origins = new Set<string>([PRODUCTION_SITE_ORIGIN]);
  const addHost = (host: string | undefined) => {
    const origin = httpsOriginFromHost(host);
    if (origin) origins.add(origin);
  };

  if (env.VERCEL_ENV === "production") {
    addHost(env.VERCEL_PROJECT_PRODUCTION_URL);
  } else if (env.VERCEL_ENV === "preview") {
    addHost(env.VERCEL_BRANCH_URL);
    addHost(env.VERCEL_URL);
  } else if (env.VERCEL !== "1" || env.VERCEL_ENV === "development") {
    const port = localPort(env.PORT);
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
      origins.add(`http://${host}:${port}`);
    }
  }

  return [...origins];
}

const database =
  databaseProvider === "postgres"
    ? postgresAdapter({
        disableCreateDatabase: true,
        idType: "uuid",
        migrationDir: path.resolve(dirname, "migrations"),
        pool: {
          connectionString: requirePayloadEnvironmentVariable(
            "DATABASE_URL",
            "PAYLOAD_DATABASE=postgres",
          ),
        },
        push: false,
      })
    : sqliteAdapter({
        client: {
          url: process.env.DATABASE_URL || "",
        },
        idType: "uuid",
        push: process.env.NODE_ENV === "development",
      });

const plugins =
  storageProvider === "vercel-blob"
    ? [
        vercelBlobStorage({
          clientUploads: false,
          collections: {
            media: true,
          },
          token: requirePayloadEnvironmentVariable(
            "BLOB_READ_WRITE_TOKEN",
            "PAYLOAD_STORAGE=vercel-blob",
          ),
        }),
      ]
    : [];

// Email: no adapter is configured, so Payload only logs that an email was
// attempted, and the Users collection refuses password-reset requests (see
// `refusePasswordResetWithoutEmail`). Recovery today: a second admin account
// resets the password from the admin. To enable reset emails, add a provider
// package and these environment variables, then pass `email` here:
// - Resend (`@payloadcms/email-resend`): RESEND_API_KEY, EMAIL_FROM_ADDRESS,
//   EMAIL_FROM_NAME.
// - SMTP (`@payloadcms/email-nodemailer`): SMTP_HOST, SMTP_PORT, SMTP_USER,
//   SMTP_PASS, EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME.
export default buildConfig({
  admin: {
    // Payload's default "gravatar" avatar loads
    // https://www.gravatar.com/avatar/<hash of the user's email> on every
    // admin page: a third-party request that shares a stable identifier of
    // each account holder and needs another image origin in the admin CSP.
    avatar: "default",
    components: {
      afterNavLinks: ["/components/admin/help/AdminHelpNavLink"],
      views: {
        help: {
          Component: "/components/admin/help/AdminHelpView#AdminHelpView",
          exact: true,
          path: "/help",
        },
      },
    },
    meta: ADMIN_META,
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // Order matters for the database: Payload names compound indexes after
  // their fields (`language_slug_idx`) and suffixes the later duplicates, so
  // Pages must stay ahead of Books to keep its existing index name.
  collections: [
    Users,
    Media,
    Categories,
    DistrictGuides,
    Articles,
    Pages,
    Books,
    PhotoCollections,
    Tags,
    Photos,
  ].map(withAnonymousRestLimits),
  csrf: getCsrfAllowedOrigins(),
  globals: [Navigation],
  db: database,
  i18n: ADMIN_I18N,
  editor: lexicalEditor({
    features: ({ defaultFeatures }) =>
      configureRichTextFeatures(defaultFeatures),
  }),
  localization: {
    defaultLocale: "tr",
    fallback: false,
    locales: [
      { code: "tr", label: "Türkçe" },
      { code: "en", label: "English" },
    ],
  },
  // The public site needs two levels (photo -> collection -> parent). A
  // higher `?depth=` would let one anonymous request expand relationships
  // (book translations point at each other) into a huge response.
  maxDepth: 2,
  plugins,
  secret: getPayloadSecret(),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  upload: {
    abortOnLimit: true,
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
      files: 1,
    },
    preserveExtension: 10,
    responseOnLimit:
      "Dosya 4 MiB yükleme sınırını aşıyor. Görseli küçültüp (ör. uzun kenarı 3200 piksel, JPEG) yeniden yükleyin.",
    safeFileNames: true,
  },
});
