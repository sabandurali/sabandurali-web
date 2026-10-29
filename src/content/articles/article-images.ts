import type { PublicArticleImage } from "@/content/articles/public-types";
import {
  getAvailableLocalImage,
  getSafePayloadMediaPath,
} from "@/content/media-paths";

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
