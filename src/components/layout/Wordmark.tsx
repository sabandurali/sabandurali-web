import Link from "next/link";
import { cx } from "@/components/ui/cx";
import {
  getShellStrings,
  localeHomePaths,
  type HeaderLocale,
} from "./header-content";

type WordmarkProps = {
  locale: HeaderLocale;
  name?: string;
  tagline?: string;
  /** `on-sea` for the footer. */
  tone?: "ink" | "on-sea";
  /** A link to the home page (header) or plain text (footer). */
  asLink?: boolean;
  className?: string;
};

const defaultTagline: Record<HeaderLocale, string> = {
  tr: "ARAŞTIRMA VE BİLGİ PLATFORMU",
  en: "RESEARCH AND KNOWLEDGE PLATFORM",
};

/**
 * ŞABAN DURALİ in the wide wordmark cut, with the platform line under it.
 * Written in capitals in the source (never CSS uppercase), so the dotted
 * İ is right in every language. As a link its accessible name starts with
 * the visible text ("ŞABAN DURALİ, ana sayfa", WCAG 2.5.3).
 */
export default function Wordmark({
  locale,
  name = "ŞABAN DURALİ",
  tagline = defaultTagline[locale],
  tone = "ink",
  asLink = true,
  className,
}: WordmarkProps) {
  const body = (
    <>
      <span lang="tr" className="block type-wordmark">
        {name}
      </span>
      <span
        className={cx(
          "mt-0.5 block type-tagline",
          tone === "ink" ? "text-ink-muted" : "text-on-sea-muted",
        )}
      >
        {tagline}
      </span>
    </>
  );
  const classes = cx(
    "inline-flex min-h-tap flex-col justify-center",
    tone === "ink" ? "text-ink" : "text-on-sea",
    className,
  );

  if (!asLink) {
    return <p className={cx("m-0", classes)}>{body}</p>;
  }

  return (
    <Link
      href={localeHomePaths[locale]}
      className={cx(classes, "no-underline")}
    >
      {body}
      <span className="sr-only">, {getShellStrings(locale).homeLink}</span>
    </Link>
  );
}
