import { existsSync, statSync } from "node:fs";
import {
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";
import type { PublicArticleImage } from "@/content/articles/public-types";

const SUPPORTED_ARTICLE_IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

export function getAvailableLocalArticleImage(
  src: string | undefined,
): string | null {
  if (
    src === undefined ||
    !src.startsWith("/") ||
    src.startsWith("//") ||
    !SUPPORTED_ARTICLE_IMAGE_EXTENSIONS.has(extname(src).toLowerCase())
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

export function getSafePayloadMediaPath(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/api/media/file/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#")
  ) {
    return null;
  }

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

export function getAvailablePublicArticleImage(
  image: PublicArticleImage | null,
): string | null {
  if (image === null) {
    return null;
  }

  return image.source === "payload"
    ? getSafePayloadMediaPath(image.src)
    : getAvailableLocalArticleImage(image.src);
}
