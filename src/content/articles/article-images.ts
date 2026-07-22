import { existsSync, statSync } from "node:fs";
import {
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";

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
