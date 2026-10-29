"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "@/components/ui/icons";
import { cx } from "@/components/ui/cx";

const VISIBILITY_THRESHOLD = 550;

/**
 * Floating "back to top" link to the page's `#top` wrapper. Hidden (and out
 * of the tab order and the accessibility tree) until the page has been
 * scrolled; a land square with a 2 px ink edge, so it stays visible on
 * paper, on photos and on the sea footer. No shadow: the atlas keeps
 * shadows for open panels.
 */
export default function BackToTop({ label }: { label: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(window.scrollY >= VISIBILITY_THRESHOLD);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <a
      href="#top"
      aria-label={label}
      tabIndex={isVisible ? undefined : -1}
      className={cx(
        "fixed right-4 bottom-4 z-30 flex size-tap items-center justify-center rounded-control border-2 border-ink bg-land text-ink transition-[opacity,translate] duration-150 ease-atlas hover:bg-band sm:right-6 sm:bottom-6",
        isVisible
          ? "visible translate-y-0 opacity-100"
          : "pointer-events-none invisible translate-y-2 opacity-0",
      )}
    >
      <ArrowUpIcon size={20} />
    </a>
  );
}
