import type { ReactNode } from "react";
import Container from "@/components/ui/Container";

type StatusMessageProps = {
  /** Short mono code above the title ("404", "HATA"). */
  code: string;
  title: ReactNode;
  children: ReactNode;
  /** Buttons and links under the text. */
  actions?: ReactNode;
  /** Further content (another language, a list of destinations). */
  aside?: ReactNode;
  lang?: string;
};

/**
 * Body of the 404 and error screens: `<main id="main">` with a plate-like
 * code, one h1, a plain explanation and the ways out. The ground stays the
 * paper of the atlas; the code is a signal fill with ink text (4.77:1).
 */
export default function StatusMessage({
  code,
  title,
  children,
  actions,
  aside,
  lang,
}: StatusMessageProps) {
  return (
    <main id="main" lang={lang} className="bg-paper text-ink">
      <Container className="py-section">
        <div className="max-w-measure">
          <p className="m-0 inline-flex items-center gap-3">
            <span className="inline-flex min-h-9 items-center rounded-tile bg-signal px-2.5 type-data-md font-bold text-ink">
              {code}
            </span>
            <span aria-hidden="true" className="h-0.5 w-16 bg-ink sm:w-24" />
          </p>
          <h1 className="mt-6 mb-0 type-display">{title}</h1>
          <div className="mt-5 type-lead text-ink-muted">{children}</div>
          {actions ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {actions}
            </div>
          ) : null}
        </div>
        {aside ? <div className="mt-12 max-w-measure">{aside}</div> : null}
      </Container>
    </main>
  );
}
