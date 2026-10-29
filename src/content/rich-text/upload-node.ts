import { getSafePayloadMediaPath } from "@/content/articles/article-images";
import { getPositiveNumber, getText, isRecord } from "@/content/guards";

export type RichTextUpload =
  | {
      kind: "image";
      src: string;
      alt: string;
      /**
       * "tr" when `alt` is the media document's own alt text, which is
       * written in Turkish. Absent when the node carries its own alt (in the
       * document's language). English documents render a Turkish alt with
       * lang="tr".
       */
      altLanguage?: "tr";
      width: number | null;
      height: number | null;
      caption: string | null;
      credit: string | null;
    }
  | {
      kind: "file";
      src: string;
      label: string;
    };

export type RichTextUploadResult =
  | { ok: true; upload: RichTextUpload }
  | { ok: false; reason: string; detail?: string };

/**
 * Reads a Lexical upload node defensively. Uploads inserted from the editor
 * toolbar or slash menu are stored with `fields: null`, so every access to
 * `fields` is optional (as in Payload's own converter). The populated media
 * document provides the URL, MIME type, alt text, size, caption and credit.
 */
export function getRichTextUpload(node: unknown): RichTextUploadResult {
  if (!isRecord(node)) return { ok: false, reason: "node is not an object" };

  const media = node.value;
  if (!isRecord(media)) {
    return { ok: false, reason: "media relationship is not populated" };
  }

  const src = getSafePayloadMediaPath(media.url);
  const mimeType = getText(media.mimeType);

  if (src === null || mimeType === null) {
    return { ok: false, reason: "media URL or MIME type is invalid" };
  }

  if (mimeType === "application/pdf") {
    return {
      ok: true,
      upload: {
        kind: "file",
        src,
        label: getText(media.filename) ?? getText(media.alt) ?? "PDF",
      },
    };
  }

  if (!mimeType.startsWith("image/")) {
    return { ok: false, reason: "unsupported MIME type", detail: mimeType };
  }

  const fields = isRecord(node.fields) ? node.fields : null;
  const nodeAlt = getText(fields?.alt);
  const mediaAlt = nodeAlt === null ? getText(media.alt) : null;

  return {
    ok: true,
    upload: {
      kind: "image",
      src,
      alt: nodeAlt ?? mediaAlt ?? "",
      ...(mediaAlt === null ? {} : { altLanguage: "tr" as const }),
      width: getPositiveNumber(media.width),
      height: getPositiveNumber(media.height),
      caption: getText(media.description),
      credit: getText(media.sourceCopyright),
    },
  };
}
