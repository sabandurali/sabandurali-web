import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

export type UiLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "target"
> & {
  href: string;
  /** Opens a new tab with rel="noopener noreferrer". Say so in the text. */
  newTab?: boolean;
  /** next/link prefetching; set false for long link lists such as maps. */
  prefetch?: boolean;
  children: ReactNode;
};

/**
 * Same-site paths ("/x") navigate with next/link. Hash, mailto and external
 * URLs stay plain anchors. "//host" and "/\host" are protocol-relative to
 * browsers, so they are treated as external, never as internal paths.
 */
export function isInternalPath(href: string): boolean {
  return (
    href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/\\")
  );
}

export default function UiLink({
  href,
  newTab = false,
  prefetch,
  rel,
  children,
  ...rest
}: UiLinkProps) {
  if (isInternalPath(href) && !newTab) {
    return (
      <Link href={href} prefetch={prefetch} rel={rel} {...rest}>
        {children}
      </Link>
    );
  }

  const relValue = newTab
    ? [rel, "noopener", "noreferrer"].filter(Boolean).join(" ")
    : rel;

  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={relValue}
      {...rest}
    >
      {children}
    </a>
  );
}
