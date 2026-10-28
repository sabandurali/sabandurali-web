import Image from "next/image";
import type { ComponentProps, ReactElement } from "react";
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
import { getSafeArticleHref } from "@/content/articles/article-links";
import { reportContentIssue } from "@/content/content-log";
import { isRecord } from "@/content/guards";
import { getRichTextUpload } from "@/content/rich-text/upload-node";

/**
 * Public renderer for Payload Lexical content. The data is prepared by the
 * content mappers (src/content/rich-text/prepare-rich-text.ts): internal
 * links already carry their public path and uploads only their public
 * fields. Everything this renderer cannot show is skipped explicitly and
 * reported as a structured content issue in every environment.
 */
type PayloadRichTextProps = {
  data: ComponentProps<typeof RichText>["data"];
};

function reportSkippedNode(type: string, reason: string, detail?: string) {
  reportContentIssue({
    scope: "rich-text",
    reason: `${type} node skipped: ${reason}`,
    ...(detail === undefined ? {} : { detail }),
  });
}

function getLinkTarget(fields: unknown) {
  const linkFields = isRecord(fields) ? fields : null;

  return {
    linkType: linkFields?.linkType,
    url: typeof linkFields?.url === "string" ? linkFields.url : undefined,
    newTab: linkFields?.newTab === true,
  };
}

function SafeLink({
  href,
  newTab,
  children,
}: {
  href: string;
  newTab: boolean;
  children: ComponentProps<"a">["children"];
}) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className="font-semibold text-accent-strong underline decoration-border underline-offset-4 hover:text-ivory"
    >
      {children}
    </a>
  );
}

const linkConverter: JSXConverter<SerializedLinkNode> = ({
  node,
  nodesToJSX,
}) => {
  const children = nodesToJSX({ nodes: node.children });
  const { linkType, url, newTab } = getLinkTarget(node.fields);

  if (linkType === "internal") {
    // Resolvable internal links were turned into paths by the mapper.
    reportSkippedNode(
      "link",
      "internal link target is not public or has no public route",
    );
    return <>{children}</>;
  }

  const href = getSafeArticleHref(url);

  if (href === null) {
    if (url) reportSkippedNode("link", "URL is not safe");
    return <>{children}</>;
  }

  return (
    <SafeLink href={href} newTab={newTab}>
      {children}
    </SafeLink>
  );
};

const autoLinkConverter: JSXConverter<SerializedAutoLinkNode> = ({
  node,
  nodesToJSX,
}) => {
  const children = nodesToJSX({ nodes: node.children });
  const { url, newTab } = getLinkTarget(node.fields);
  const href = getSafeArticleHref(url);

  if (href === null) {
    if (url) reportSkippedNode("autolink", "URL is not safe");
    return <>{children}</>;
  }

  return (
    <SafeLink href={href} newTab={newTab}>
      {children}
    </SafeLink>
  );
};

/**
 * Element for one Lexical upload node, or null when it cannot be shown.
 * Exported for tests: it never throws, whatever the stored node looks like.
 */
export function renderRichTextUpload(node: unknown): ReactElement | null {
  const result = getRichTextUpload(node);

  if (!result.ok) {
    reportSkippedNode("upload", result.reason, result.detail);
    return null;
  }

  const { upload } = result;

  if (upload.kind === "file") {
    return (
      <a
        href={upload.src}
        className="flex min-h-12 items-center justify-between gap-4 rounded-sm border border-border bg-surface px-5 py-3 text-sm font-semibold text-ivory hover:border-accent hover:text-accent-strong"
      >
        <span>{upload.label}</span>
        <span aria-hidden="true">↓</span>
      </a>
    );
  }

  return (
    <figure>
      {upload.width !== null && upload.height !== null ? (
        <Image
          src={upload.src}
          alt={upload.alt}
          width={upload.width}
          height={upload.height}
          sizes="(min-width: 1024px) 768px, 100vw"
          className="h-auto w-full rounded-sm border border-border object-cover"
        />
      ) : (
        <span className="relative block aspect-video overflow-hidden rounded-sm border border-border">
          <Image
            src={upload.src}
            alt={upload.alt}
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
          />
        </span>
      )}
      {(upload.caption !== null || upload.credit !== null) && (
        <figcaption className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm leading-6 text-muted">
          {upload.caption !== null && <span>{upload.caption}</span>}
          {upload.credit !== null && (
            <span data-image-credit="">{upload.credit}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

const uploadConverter: JSXConverter<SerializedUploadNode> = ({ node }) =>
  renderRichTextUpload(node);

const publicConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  autolink: autoLinkConverter,
  link: linkConverter,
  upload: uploadConverter,
  // Relationship blocks have no public design; they are skipped explicitly.
  relationship: () => {
    reportSkippedNode("relationship", "relationship blocks are not supported");
    return null;
  },
  unknown: ({ node }) => {
    reportSkippedNode(
      typeof node.type === "string" ? node.type : "unknown",
      "node type is not supported",
    );
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
