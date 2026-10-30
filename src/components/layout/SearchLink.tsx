import Link from "next/link";
import { searchPaths } from "@/content/navigation/static-navigation";
import type { HeaderLocale } from "./header-content";

const labels: Record<HeaderLocale, string> = { tr: "Ara", en: "Search" };

/** The search page link of the header row, at every width. */
export function getSearchLink(locale: HeaderLocale) {
  return { href: searchPaths[locale], label: labels[locale] };
}

/**
 * "Ara" / "Search" with a magnifier: a plain link to the search page (the
 * page owns the form). The word is the accessible name and the icon is
 * decorative. Below 640 px only the magnifier shows (the word stays for
 * assistive technology), so the wordmark keeps its single line on a phone.
 * Same type, height and hover as the language links.
 */
export default function SearchLink({ locale }: { locale: HeaderLocale }) {
  const { href, label } = getSearchLink(locale);

  return (
    <Link
      href={href}
      // On every page: the search page loads when asked for, not upfront.
      prefetch={false}
      className="flex min-h-tap min-w-tap items-center justify-center gap-1.5 px-2 type-small font-medium text-ink no-underline hover:underline hover:decoration-2 hover:underline-offset-[0.3em]"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="shrink-0"
      >
        <circle cx="6.5" cy="6.5" r="4.75" />
        <path d="m10 10 4.5 4.5" strokeLinecap="square" />
      </svg>
      <span className="max-sm:sr-only">{label}</span>
    </Link>
  );
}
