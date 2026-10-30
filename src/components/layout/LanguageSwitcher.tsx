"use client";

import { useId } from "react";
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
 *
 * When this page has no translation (route-parity.ts), the other
 * language's link opens that language's home or list page; a visible note
 * in that language ("Only in Turkish") says so and describes the link
 * (aria-describedby), so nobody expects the same page in English.
 */
export default function LanguageSwitcher({
  locale,
  label,
  hrefs,
  onNavigate,
  className,
}: LanguageSwitcherProps) {
  const noteId = useId();
  const options = getLanguageOptions(locale, hrefs);
  const untranslated = options.find(
    (option) => !option.current && !option.translated,
  );

  return (
    // The caller's className sets the display ("hidden xl:flex"); cx does
    // not resolve two display classes, so "flex" is only the default.
    <div className={cx("flex-wrap items-center gap-x-2", className ?? "flex")}>
      <ul aria-label={label} className="m-0 flex list-none items-stretch p-0">
        {options.map((option) => (
          <li key={option.locale} className="flex">
            <Link
              href={option.href}
              hrefLang={option.hrefLang}
              lang={option.locale}
              // "true", not "page": without a translation the link opens the
              // home page, and the page link of the header owns "page".
              aria-current={option.current ? "true" : undefined}
              aria-describedby={option === untranslated ? noteId : undefined}
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
      {untranslated !== undefined ? (
        <p
          id={noteId}
          lang={untranslated.locale}
          className="m-0 type-caption text-ink-muted"
        >
          {untranslated.untranslatedNote}
        </p>
      ) : null}
    </div>
  );
}
