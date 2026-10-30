import {
  getAvailableLocalImage,
  getSafePayloadMediaPath,
} from "@/content/media-paths";

/** A book cover or share image: a Payload media path or a `public/` image. */
export function getAvailableLocalBookImage(
  src: string | undefined,
): string | null {
  return getSafePayloadMediaPath(src) ?? getAvailableLocalImage(src);
}
