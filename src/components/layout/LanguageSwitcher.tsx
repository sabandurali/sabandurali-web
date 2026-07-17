"use client";

import Link from "next/link";
import type { Locale } from "@/content/homeContent";

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
  hrefs?: Record<Locale, string>;
};

const languages = [
  { locale: "tr", label: "TR", href: "/" },
  { locale: "en", label: "EN", href: "/en" },
] as const;

export default function LanguageSwitcher({
  locale,
  label,
  variant,
  onNavigate,
  hrefs,
}: LanguageSwitcherProps) {
  const isMobile = variant === "mobile";

  return (
    <div
      role="group"
      aria-label={label}
      className={
        isMobile
          ? "flex min-h-11 items-center px-2 text-sm font-medium"
          : "hidden shrink-0 items-center rounded-full border border-border px-3 py-2 text-xs font-medium text-ivory transition-colors hover:border-accent hover:bg-surface motion-reduce:transition-none sm:px-4 md:flex"
      }
    >
      {languages.map((language, index) => {
        const isActive = locale === language.locale;

        return (
          <span key={language.locale} className="contents">
            {index > 0 && (
              <span aria-hidden="true" className="text-muted">
                ·
              </span>
            )}
            <Link
              href={hrefs?.[language.locale] ?? language.href}
              aria-current={isActive ? "page" : undefined}
              className={`${
                isMobile
                  ? "flex size-11 items-center justify-center rounded-sm transition-colors hover:bg-surface motion-reduce:transition-none"
                  : "transition-colors hover:text-accent-soft motion-reduce:transition-none"
              } ${
                isActive
                  ? "font-semibold text-accent-strong"
                  : "text-muted hover:text-ivory"
              }`}
              onClick={onNavigate}
            >
              {language.label}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
