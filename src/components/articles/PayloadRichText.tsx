import Image from "next/image";
import {
  RichText,
  type JSXConverter,
  type JSXConvertersFunction,
} from "@payloadcms/richtext-lexical/react";
import type {
  SerializedAutoLinkNode,
  SerializedLinkNode,
  SerializedUploadNode,
} from "@payloadcms/richtext-lexical";
import { getSafePayloadMediaPath } from "@/content/articles/article-images";
import { getSafeArticleHref } from "@/content/articles/article-links";
import type { PublicArticle } from "@/content/articles/public-types";

type PayloadRichTextProps = {
  data: Extract<
    PublicArticle["content"],
    { source: "lexical" }
  >["data"];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getPositiveDimension(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : null;
}

function reportSkippedNode(type: string, reason: string): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[public-articles] Lexical ${type} node was skipped: ${reason}`);
  }
}

const linkConverter: JSXConverter<SerializedLinkNode> = ({
  node,
  nodesToJSX,
}) => {
  const children = nodesToJSX({ nodes: node.children });
  const href =
    node.fields.linkType === "custom"
      ? getSafeArticleHref(node.fields.url)
      : null;

  if (href === null) {
    if (node.fields.linkType === "internal") {
      reportSkippedNode("link", "internal document links are not configured");
    } else if (node.fields.url) {
      reportSkippedNode("link", "URL is not safe");
    }

    return <>{children}</>;
  }

  return (
    <a
      href={href}
      target={node.fields.newTab ? "_blank" : undefined}
      rel={node.fields.newTab ? "noopener noreferrer" : undefined}
      className="font-semibold text-accent-strong underline decoration-border underline-offset-4 hover:text-ivory"
    >
      {children}
    </a>
  );
};

const autoLinkConverter: JSXConverter<SerializedAutoLinkNode> = ({
  node,
  nodesToJSX,
}) => {
  const children = nodesToJSX({ nodes: node.children });
  const href = getSafeArticleHref(node.fields.url);

  if (href === null) {
    if (node.fields.url) {
      reportSkippedNode("autolink", "URL is not safe");
    }

    return <>{children}</>;
  }

  return (
    <a
      href={href}
      target={node.fields.newTab ? "_blank" : undefined}
      rel={node.fields.newTab ? "noopener noreferrer" : undefined}
      className="font-semibold text-accent-strong underline decoration-border underline-offset-4 hover:text-ivory"
    >
      {children}
    </a>
  );
};

const uploadConverter: JSXConverter<SerializedUploadNode> = ({ node }) => {
  if (!isRecord(node.value)) {
    reportSkippedNode("upload", "relationship is not populated");
    return null;
  }

  const src = getSafePayloadMediaPath(node.value.url);
  const mimeType = getText(node.value.mimeType);

  if (src === null || mimeType === null) {
    reportSkippedNode("upload", "media URL or MIME type is invalid");
    return null;
  }

  if (mimeType === "application/pdf") {
    const label =
      getText(node.value.filename) ?? getText(node.value.alt) ?? "PDF";

    return (
      <a
        href={src}
        className="flex min-h-12 items-center justify-between gap-4 rounded-sm border border-border bg-surface px-5 py-3 text-sm font-semibold text-ivory hover:border-accent hover:text-accent-strong"
      >
        <span>{label}</span>
        <span aria-hidden="true">↓</span>
      </a>
    );
  }

  if (!mimeType.startsWith("image/")) {
    reportSkippedNode("upload", `unsupported MIME type ${mimeType}`);
    return null;
  }

  const alt =
    getText(node.fields.alt) ?? getText(node.value.alt) ?? "";
  const width = getPositiveDimension(node.value.width);
  const height = getPositiveDimension(node.value.height);

  return (
    <figure>
      {width !== null && height !== null ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(min-width: 1024px) 768px, 100vw"
          className="h-auto w-full rounded-sm border border-border object-cover"
        />
      ) : (
        <span className="relative block aspect-video overflow-hidden rounded-sm border border-border">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
          />
        </span>
      )}
    </figure>
  );
};

const publicConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  autolink: autoLinkConverter,
  link: linkConverter,
  upload: uploadConverter,
  unknown: ({ node }) => {
    reportSkippedNode(node.type, "node type is not supported");
    return null;
  },
});

export default function PayloadRichText({ data }: PayloadRichTextProps) {
  return (
    <RichText
      data={data}
      converters={publicConverters}
      className="space-y-7 text-base leading-8 text-muted sm:space-y-9 sm:text-lg [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-5 [&_blockquote]:text-ivory [&_blockquote]:italic sm:[&_blockquote]:pl-7 [&_h2]:pt-5 [&_h2]:text-3xl [&_h2]:leading-tight [&_h2]:text-ivory sm:[&_h2]:text-4xl [&_h3]:pt-3 [&_h3]:text-2xl [&_h3]:leading-tight [&_h3]:text-ivory sm:[&_h3]:text-3xl [&_h4]:pt-2 [&_h4]:text-xl [&_h4]:leading-tight [&_h4]:text-ivory sm:[&_h4]:text-2xl [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_table]:w-full [&_table]:min-w-xl [&_table]:border-collapse [&_table]:text-left [&_td]:border-b [&_td]:border-border [&_td]:p-4 [&_th]:border-b [&_th]:border-border [&_th]:bg-surface-soft [&_th]:p-4 [&_th]:text-ivory [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
    />
  );
}
