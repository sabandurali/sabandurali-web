"use client";

import Link from "next/link";
import { cx } from "@/components/ui/cx";
import { getLanguageOptions, type HeaderLocale } from "./header-content";

type LanguageSwitcherProps = {
  locale: HeaderLocale;
  /** Accessible name of the group ("Dil seçimi"). */
  label: string;
  /** Path of this page in each language; the home pages otherwise. */
  hrefs?: Partial<Record<HeaderLocale, string>>;
  /** Called after a language link is followed (closes the mobile drawer). */
  onNavigate?: () => void;
  className?: string;
};

/**
 * TR · EN. Each link is "TR Türkçe" / "EN English" for assistive
 * technology (the visible code stays part of the name, WCAG 2.5.3) with a
 * matching `lang` (WCAG 3.1.2); the current language is marked with
 * aria-current, bold text and the signal bar, never colour alone.
 */
export default function LanguageSwitcher({
  locale,
  label,
  hrefs,
  onNavigate,
  className,
}: LanguageSwitcherProps) {
  return (
    <ul
      aria-label={label}
      className={cx("m-0 flex list-none items-stretch p-0", className)}
    >
      {getLanguageOptions(locale, hrefs).map((option) => (
        <li key={option.locale} className="flex">
          <Link
            href={option.href}
            hrefLang={option.hrefLang}
            lang={option.locale}
            aria-current={option.current ? "page" : undefined}
            onClick={onNavigate}
            className={cx(
              "relative flex min-h-tap min-w-tap items-center justify-center px-2 type-small text-ink no-underline hover:underline hover:decoration-2 hover:underline-offset-[0.3em]",
              option.current
                ? "font-bold after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:bg-signal"
                : "font-medium",
            )}
          >
            {option.code}
            <span className="sr-only"> {option.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
