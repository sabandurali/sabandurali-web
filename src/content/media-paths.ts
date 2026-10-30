import { existsSync, statSync } from "node:fs";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { getVercelBlobStoreHostname } from "@/lib/payloadInfrastructure";

/**
 * Image path safety shared by every content type (articles, books, photos,
 * pages, rich text uploads and the CMS collections). One implementation, so
 * a path-traversal fix cannot miss a copy.
 */

/** Raster formats the site renders from `public/`. */
export const SUPPORTED_LOCAL_IMAGE_EXTENSIONS: ReadonlySet<string> = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

/**
 * A site path to an existing image file inside `public/`, or null: never a
 * protocol-relative URL, a path that escapes `public/` or an unsupported
 * extension.
 */
export function getAvailableLocalImage(
  src: string | undefined,
  extensions: ReadonlySet<string> = SUPPORTED_LOCAL_IMAGE_EXTENSIONS,
): string | null {
  if (
    src === undefined ||
    !src.startsWith("/") ||
    src.startsWith("//") ||
    !extensions.has(extname(src).toLowerCase())
  ) {
    return null;
  }

  const publicDirectory = resolve(process.cwd(), "public");
  const absolutePath = resolve(publicDirectory, `.${src}`);
  const relativePath = relative(publicDirectory, absolutePath);

  if (
    relativePath.startsWith(`..${sep}`) ||
    relativePath === ".." ||
    isAbsolute(relativePath)
  ) {
    return null;
  }

  try {
    return existsSync(absolutePath) && statSync(absolutePath).isFile()
      ? src
      : null;
  } catch {
    return null;
  }
}

/**
 * A Payload media URL the site may render: a `/api/media/file/<name>` path,
 * or an https URL on this project's own Vercel Blob store (the hostname
 * derived from `BLOB_READ_WRITE_TOKEN`). Without a token (local storage,
 * CI) no remote URL is accepted, so another Blob store cannot be embedded.
 */
export function getSafePayloadMediaPath(
  value: unknown,
  blobStoreHostname: string | null = getVercelBlobStoreHostname(),
): string | null {
  if (typeof value !== "string") return null;

  if (value.startsWith("https://")) {
    if (blobStoreHostname === null) return null;

    try {
      const url = new URL(value);
      return url.protocol === "https:" &&
        url.hostname === blobStoreHostname &&
        url.port === "" &&
        url.username === "" &&
        url.password === "" &&
        url.pathname.length > 1
        ? value
        : null;
    } catch {
      return null;
    }
  }

  if (
    !value.startsWith("/api/media/file/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#")
  )
    return null;

  try {
    const decodedPath = decodeURIComponent(value);
    const filename = decodedPath.slice("/api/media/file/".length);

    if (
      filename.length === 0 ||
      filename.includes("/") ||
      filename === "." ||
      filename === ".."
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return value;
}
