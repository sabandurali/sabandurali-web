"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { HeaderLocale } from "./header-content";
import { localeHomePaths } from "./header-content";
import Masthead from "./Masthead";
import StatusMessage from "./StatusMessage";

const texts = {
  tr: {
    code: "HATA",
    title: "Sayfa şu anda gösterilemiyor.",
    body: "Geçici bir sorun olabilir. Sayfayı yeniden deneyebilir ya da ana sayfaya dönebilirsiniz.",
    retry: "Yeniden dene",
    home: "Ana sayfa",
    reference: "Hata kodu",
  },
  en: {
    code: "ERROR",
    title: "This page cannot be shown right now.",
    body: "This may be a temporary problem. You can try again or return to the home page.",
    retry: "Try again",
    home: "Home page",
    reference: "Error reference",
  },
} as const satisfies Record<HeaderLocale, Record<string, string>>;

/** The error screen's texts in one language (the global error is bilingual). */
export function getErrorTexts(locale: HeaderLocale) {
  return texts[locale];
}

/** The digest Next.js attaches to server errors, if any (never a message). */
export function getErrorDigest(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return null;
  }
  const digest = error.digest;
  return typeof digest === "string" && /^[\w-]{1,64}$/.test(digest)
    ? digest
    : null;
}

type ErrorScreenProps = {
  locale: HeaderLocale;
  error: unknown;
  retry: () => void;
  /** Further content under the actions (the English block of the global error). */
  aside?: ReactNode;
};

/**
 * Error boundary screen for the public route groups. It shows no error
 * details (production messages are generic anyway), only the server digest
 * as a reference for the logs. Focus moves to the heading so keyboard and
 * screen-reader users learn that the page changed.
 */
export default function ErrorScreen({
  locale,
  error,
  retry,
  aside,
}: ErrorScreenProps) {
  const t = texts[locale];
  const digest = getErrorDigest(error);
  const headingRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <>
      <Masthead locale={locale} />
      <StatusMessage
        code={t.code}
        aside={aside}
        title={
          <span
            ref={headingRef}
            tabIndex={-1}
            className="outline-none focus:[box-shadow:none]"
          >
            {t.title}
          </span>
        }
        actions={
          <>
            <Button onClick={() => retry()}>{t.retry}</Button>
            <ButtonLink href={localeHomePaths[locale]} variant="secondary">
              {t.home}
            </ButtonLink>
          </>
        }
      >
        <p className="m-0">{t.body}</p>
        {digest !== null ? (
          <p className="mt-4 mb-0 type-data text-ink-muted">
            {t.reference}: {digest}
          </p>
        ) : null}
      </StatusMessage>
    </>
  );
}
