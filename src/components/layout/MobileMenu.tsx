"use client";

import { useEffect, useRef, useState } from "react";
import type {
  HeaderContent,
  Locale,
} from "@/content/homeContent";
import type { PublicNavigationLink } from "@/content/navigation/public-types";
import HeaderNavigationLinks from "./HeaderNavigationLinks";
import LanguageSwitcher from "./LanguageSwitcher";

type MobileMenuProps = {
  locale: Locale;
  content: HeaderContent;
  items: PublicNavigationLink[];
  languageHrefs?: Record<Locale, string>;
};

export default function MobileMenu({
  locale,
  content,
  items,
  languageHrefs,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-ivory transition-colors hover:border-accent hover:bg-surface motion-reduce:transition-none"
        aria-label={
          isOpen ? content.menu.closeLabel : content.menu.openLabel
        }
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="relative block size-5" aria-hidden="true">
          <span
            className={`absolute left-0 h-px w-5 bg-current transition-transform duration-200 motion-reduce:transition-none ${
              isOpen
                ? "top-1/2 -translate-y-1/2 rotate-45"
                : "top-[6px]"
            }`}
          />
          <span
            className={`absolute left-0 h-px w-5 bg-current transition-transform duration-200 motion-reduce:transition-none ${
              isOpen
                ? "top-1/2 -translate-y-1/2 -rotate-45"
                : "top-[13px]"
            }`}
          />
        </span>
      </button>

      <nav
        id="mobile-navigation"
        aria-label={content.menu.navigationLabel}
        className={`absolute right-4 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-sm border border-border bg-background shadow-2xl shadow-black/30 sm:right-6 sm:w-[calc(100vw-3rem)] ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex flex-col p-2 text-sm text-ivory">
          <HeaderNavigationLinks
            items={items}
            variant="mobile"
            onNavigate={closeMenu}
          />

          <LanguageSwitcher
            locale={locale}
            label={content.languageSwitcherLabel}
            variant="mobile"
            onNavigate={closeMenu}
            hrefs={languageHrefs}
          />
        </div>
      </nav>
    </div>
  );
}
