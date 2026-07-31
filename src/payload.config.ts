import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Articles } from "@/collections/Articles";
import { Books } from "@/collections/Books";
import { Categories } from "@/collections/Categories";
import { Media } from "@/collections/Media";
import { Pages } from "@/collections/Pages";
import { Users } from "@/collections/Users";
import { Navigation } from "@/globals/Navigation";
import {
  assertProductionPayloadInfrastructure,
  getPayloadDatabaseProvider,
  getPayloadStorageProvider,
  requirePayloadEnvironmentVariable,
} from "@/lib/payloadInfrastructure";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const databaseProvider = getPayloadDatabaseProvider();
const storageProvider = getPayloadStorageProvider();

assertProductionPayloadInfrastructure();

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

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Articles, Books, Pages],
  globals: [Navigation],
  db: database,
  editor: lexicalEditor(),
  localization: {
    defaultLocale: "tr",
    fallback: false,
    locales: [
      { code: "tr", label: "Türkçe" },
      { code: "en", label: "English" },
    ],
  },
  plugins,
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  upload: {
    abortOnLimit: true,
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 1,
    },
    preserveExtension: 10,
    responseOnLimit: "File exceeds the 10 MiB upload limit.",
    safeFileNames: true,
  },
});
