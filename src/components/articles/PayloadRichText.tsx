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
import DownloadLink from "@/components/articles/DownloadLink";
import {
  altLanguageAttribute,
  creditFromText,
  PublicationImage,
} from "@/components/pages/publication-media";
import { cx } from "@/components/ui/cx";
import { Figure } from "@/components/ui/Figure";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { getUiStrings, type UiLocale } from "@/components/ui/strings";
import VisuallyHidden from "@/components/ui/VisuallyHidden";
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
  /** Language of the document: built-in texts and alt-text language. */
  locale?: UiLocale;
  className?: string;
};

/**
 * Reading styles for rich text: the Atlas type scale on h2–h4, lists with
 * muted markers, quotes with an ink rule, tables that scroll in their own
 * box (never the page) and spacing between blocks. Links get their style
 * from the converters below.
 */
export const richTextClassName = cx(
  "min-w-0 type-body text-ink",
  "[&>*+*]:mt-5 [&>figure]:my-9",
  "[&_h2]:mt-12 [&_h2]:type-h2 [&_h2]:scroll-mt-24",
  "[&_h3]:mt-10 [&_h3]:type-h3 [&_h3]:scroll-mt-24",
  "[&_h4]:mt-8 [&_h4]:type-h4",
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6",
  "[&_li]:mt-2 [&_li]:pl-1 [&_li::marker]:text-ink-muted",
  "[&_blockquote]:border-l-4 [&_blockquote]:border-ink [&_blockquote]:py-1 [&_blockquote]:pl-5 [&_blockquote]:type-lead [&_blockquote]:font-medium",
  "[&_hr]:my-10 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-hairline",
  "[&_strong]:font-bold",
  "[&_code]:rounded-tile [&_code]:bg-band [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em]",
  "[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:type-small",
  "[&_th]:border-b-2 [&_th]:border-ink [&_th]:p-3 [&_th]:text-left [&_th]:align-bottom",
  "[&_td]:border-b [&_td]:border-hairline [&_td]:p-3 [&_td]:align-top",
);

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
  locale,
  children,
}: {
  href: string;
  newTab: boolean;
  locale: UiLocale;
  children: ComponentProps<"a">["children"];
}) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className="font-semibold text-ink underline decoration-1 underline-offset-[0.2em] hover:decoration-2"
    >
      {children}
      {newTab ? (
        <>
          <ArrowUpRightIcon size={14} className="ml-0.5 inline-block" />
          <VisuallyHidden> {getUiStrings(locale).newTab}</VisuallyHidden>
        </>
      ) : null}
    </a>
  );
}

function createLinkConverter(
  locale: UiLocale,
): JSXConverter<SerializedLinkNode> {
  return function LinkConverter({ node, nodesToJSX }) {
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
      <SafeLink href={href} newTab={newTab} locale={locale}>
        {children}
      </SafeLink>
    );
  };
}

function createAutoLinkConverter(
  locale: UiLocale,
): JSXConverter<SerializedAutoLinkNode> {
  return function AutoLinkConverter({ node, nodesToJSX }) {
    const children = nodesToJSX({ nodes: node.children });
    const { url, newTab } = getLinkTarget(node.fields);
    const href = getSafeArticleHref(url);

    if (href === null) {
      if (url) reportSkippedNode("autolink", "URL is not safe");
      return <>{children}</>;
    }

    return (
      <SafeLink href={href} newTab={newTab} locale={locale}>
        {children}
      </SafeLink>
    );
  };
}

/**
 * Element for one Lexical upload node, or null when it cannot be shown.
 * Exported for tests: it never throws, whatever the stored node looks like.
 * Images become a <Figure> with caption and credit; PDFs a download row.
 */
export function renderRichTextUpload(
  node: unknown,
  locale: UiLocale = "tr",
): ReactElement | null {
  const result = getRichTextUpload(node);

  if (!result.ok) {
    reportSkippedNode("upload", result.reason, result.detail);
    return null;
  }

  const { upload } = result;

  if (upload.kind === "file") {
    return (
      <DownloadLink
        href={upload.src}
        label={upload.label}
        fileType="PDF"
        locale={locale}
      />
    );
  }

  const { lang } = altLanguageAttribute(upload.altLanguage, locale);

  return (
    <Figure
      caption={upload.caption ?? undefined}
      credit={creditFromText(upload.credit)}
      locale={locale}
    >
      <PublicationImage
        src={upload.src}
        alt={upload.alt}
        lang={lang}
        width={upload.width}
        height={upload.height}
        sizes="(min-width: 1024px) 720px, 100vw"
        className="rounded-card"
      />
    </Figure>
  );
}

function createConverters(locale: UiLocale): JSXConvertersFunction {
  const uploadConverter: JSXConverter<SerializedUploadNode> = ({ node }) =>
    renderRichTextUpload(node, locale);

  return ({ defaultConverters }) => ({
    ...defaultConverters,
    autolink: createAutoLinkConverter(locale),
    link: createLinkConverter(locale),
    upload: uploadConverter,
    // Relationship blocks have no public design; they are skipped explicitly.
    relationship: () => {
      reportSkippedNode(
        "relationship",
        "relationship blocks are not supported",
      );
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
}

const convertersByLocale: Record<UiLocale, JSXConvertersFunction> = {
  tr: createConverters("tr"),
  en: createConverters("en"),
};

export default function PayloadRichText({
  data,
  locale = "tr",
  className,
}: PayloadRichTextProps) {
  return (
    <RichText
      data={data}
      converters={convertersByLocale[locale]}
      className={cx(richTextClassName, className)}
    />
  );
}
