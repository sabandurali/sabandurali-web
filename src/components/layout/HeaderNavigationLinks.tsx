"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type {
  HeaderContent,
  HomeAnchors,
  Locale,
} from "@/content/homeContent";
import {
  getHeaderNavigationItems,
  isHeaderNavigationItemActive,
  type HeaderNavigationVariant,
} from "./navigation";

type HeaderNavigationLinksProps = {
  locale: Locale;
  anchors: HomeAnchors;
  content: HeaderContent;
  anchorPrefix: string;
  variant: HeaderNavigationVariant;
  onNavigate?: () => void;
};

export default function HeaderNavigationLinks({
  locale,
  anchors,
  content,
  anchorPrefix,
  variant,
  onNavigate,
}: HeaderNavigationLinksProps) {
  const pathname = usePathname();
  const items = getHeaderNavigationItems({
    locale,
    anchors,
    content,
    anchorPrefix,
    variant,
  });

  return items.map((item) => {
    const isActive = isHeaderNavigationItemActive(item, pathname);
    const className = variant === "desktop"
      ? `transition hover:opacity-55 ${
        isActive
          ? "font-semibold text-accent underline decoration-2 underline-offset-8"
          : ""
      }`
      : `flex min-h-11 items-center rounded-sm px-4 transition-colors hover:bg-surface hover:text-accent-soft motion-reduce:transition-none ${
        isActive
          ? "font-semibold text-accent underline decoration-2 underline-offset-4"
          : ""
      }`;

    return (
      <Link
        key={item.id}
        href={item.href}
        className={className}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
      >
        {item.label}
      </Link>
    );
  });
}
