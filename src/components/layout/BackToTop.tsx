"use client";

import { useEffect, useState } from "react";

const VISIBILITY_THRESHOLD = 550;

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
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      className={`fixed right-4 bottom-4 z-40 flex size-11 items-center justify-center rounded-full border border-border bg-background/95 text-accent-soft shadow-lg shadow-black/30 transition-[opacity,transform,background-color,border-color] duration-200 hover:border-accent hover:bg-surface motion-reduce:transition-none sm:right-6 sm:bottom-6 ${
        isVisible
          ? "visible translate-y-0 opacity-100"
          : "invisible pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="m6 10 6-6 6 6M12 4v16" />
      </svg>
    </a>
  );
}
