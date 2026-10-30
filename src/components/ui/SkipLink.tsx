"use client";

import type { MouseEvent, ReactNode } from "react";

type SkipLinkProps = {
  /** Id of the main content element; the first <main> is the fallback. */
  targetId?: string;
  children: ReactNode;
};

/**
 * First focusable element of every page. Hidden until focused, then a
 * sea-blue pill in the top-left corner. Activating it moves keyboard focus
 * (not only the scroll position) into the main content, even when the
 * <main> element has no id yet; without JavaScript it is a plain #anchor.
 */
export default function SkipLink({
  targetId = "main",
  children,
}: SkipLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const target =
      document.getElementById(targetId) ?? document.querySelector("main");
    if (!(target instanceof HTMLElement)) return;

    event.preventDefault();
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus();
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:min-h-tap focus:items-center focus:rounded-control focus:bg-sea focus:px-4 focus:font-bold focus:text-on-sea focus:no-underline"
    >
      {children}
    </a>
  );
}
