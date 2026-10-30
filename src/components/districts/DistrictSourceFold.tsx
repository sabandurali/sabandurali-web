"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";

/** From this width the guide has room for the full source list. */
export const sourceFoldOpenQuery = "(min-width: 64rem)";

/**
 * Id of the in-page target of a link's href ("#kaynak-7" → "kaynak-7"),
 * or null for any other link.
 */
export function inPageTargetId(href: string | null): string | null {
  if (!href?.startsWith("#") || href.length < 2) return null;
  try {
    return decodeURIComponent(href.slice(1));
  } catch {
    return null;
  }
}

/**
 * The sources after the first few, folded into a native <details> on
 * narrow screens, where the full list is several screens long. It opens by
 * itself where folding would hide something the reader asked for: on wide
 * screens, when a source reference ([7]) or the URL's #kaynak-7 points into
 * it, and before printing. Without JavaScript it is a plain disclosure
 * whose rows keep their ids.
 */
export default function DistrictSourceFold({
  count,
  children,
}: {
  count: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (details === null) return;

    /** Opens the fold when `id` is inside it; returns the target then. */
    function openFor(id: string | null): HTMLElement | null {
      if (id === null || details === null) return null;
      const target = document.getElementById(id);
      if (target === null || !details.contains(target)) return null;
      details.open = true;
      return target;
    }

    if (window.matchMedia(sourceFoldOpenQuery).matches) details.open = true;
    openFor(inPageTargetId(window.location.hash))?.scrollIntoView();

    // Capture phase: the fold opens before the browser scrolls to the row.
    function handleClick(event: MouseEvent) {
      const link =
        event.target instanceof Element
          ? event.target.closest("a[href^='#']")
          : null;
      if (link !== null) openFor(inPageTargetId(link.getAttribute("href")));
    }
    function handleHashChange() {
      openFor(inPageTargetId(window.location.hash))?.scrollIntoView();
    }
    function handleBeforePrint() {
      if (details !== null) details.open = true;
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, []);

  return (
    <details ref={ref} className="group">
      <summary className="flex min-h-tap cursor-pointer list-none items-center gap-3 border-b border-hairline py-3 type-h4 underline-offset-[0.2em] hover:underline [&::-webkit-details-marker]:hidden">
        <span>Diğer {count} kaynak</span>
        <ChevronDownIcon
          size={20}
          className="shrink-0 transition-transform duration-150 ease-atlas group-open:rotate-180"
        />
      </summary>
      {children}
    </details>
  );
}
