import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Media } from "@/collections/Media";
import { Users } from "@/collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || "",
    },
    idType: "uuid",
    push: process.env.NODE_ENV === "development",
  }),
  editor: lexicalEditor(),
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
