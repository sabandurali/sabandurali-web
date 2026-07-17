"use client";

import { useEffect, useRef, useState } from "react";

const menuLinks = [
  { href: "#hakkimda", label: "Hakkımda" },
  { href: "#calismalar", label: "Çalışmalar" },
  { href: "#iletisim", label: "İletişim" },
];

export default function MobileMenu() {
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
        aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
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
        aria-label="Mobil navigasyon"
        className={`absolute right-4 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-sm border border-border bg-background shadow-2xl shadow-black/30 sm:right-6 sm:w-[calc(100vw-3rem)] ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex flex-col p-2 text-sm text-ivory">
          {menuLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center rounded-sm px-4 transition-colors hover:bg-surface hover:text-accent-soft motion-reduce:transition-none"
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}

          <button
            type="button"
            className="flex min-h-11 items-center rounded-sm px-4 text-left font-medium transition-colors hover:bg-surface hover:text-accent-soft motion-reduce:transition-none"
            onClick={closeMenu}
          >
            TR · EN
          </button>
        </div>
      </nav>
    </div>
  );
}
