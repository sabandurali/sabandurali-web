import type { PublicArticleImage } from "@/content/articles/public-types";
import {
  getAvailableLocalImage,
  getSafePayloadMediaPath,
} from "@/content/media-paths";

/**
 * Kept for importers outside the content layer that still name this module;
 * new code imports it from `@/content/media-paths`.
 */
export { getSafePayloadMediaPath } from "@/content/media-paths";

export function getAvailableLocalArticleImage(
  src: string | undefined,
): string | null {
  return getAvailableLocalImage(src);
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
