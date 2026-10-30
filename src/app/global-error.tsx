"use client";

import ErrorScreen, { getErrorTexts } from "@/components/layout/ErrorScreen";
import { Button } from "@/components/ui/Button";
import SkipLink from "@/components/ui/SkipLink";
import TextLink from "@/components/ui/TextLink";
import { fontVariables } from "./fonts";
import "./globals.css";

type GlobalErrorProps = {
  error: unknown;
  /** Re-fetches and re-renders the root layout and the page. */
  retry: () => void;
};

const english = getErrorTexts("en");

/*
 * Errors of a root layout itself (node_modules/next/dist/docs/01-app/
 * 03-api-reference/03-file-conventions/error.md, "Global Error"). It
 * replaces the root layout, so like global-not-found it renders its own
 * <html>, loads the fonts and atlas styles and starts with a skip link. It
 * cannot know the visitor's language: the screen is Turkish (the default
 * site) with an English block marked lang="en". It reads no CMS data and
 * shows only the server digest, never an error message. Client components
 * cannot export metadata, so the title is a React <title>.
 */
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  return (
    <html lang="tr" data-scroll-behavior="smooth" className={fontVariables}>
      <body>
        <title>
          Sayfa gösterilemiyor · Page cannot be shown | Şaban Durali
        </title>
        <meta name="robots" content="noindex" />
        <SkipLink>
          İçeriğe geç · <span lang="en">Skip to content</span>
        </SkipLink>
        <ErrorScreen
          locale="tr"
          error={error}
          retry={retry}
          aside={
            <section
              lang="en"
              aria-labelledby="global-error-en"
              className="border-t border-hairline pt-8"
            >
              <h2 id="global-error-en" className="m-0 type-h3">
                {english.title}
              </h2>
              <p className="mt-3 mb-0 type-body text-ink-muted">
                {english.body}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button variant="secondary" onClick={() => retry()}>
                  {english.retry}
                </Button>
                <TextLink href="/en" variant="standalone" locale="en">
                  Go to the English home page
                </TextLink>
              </div>
            </section>
          }
        />
      </body>
    </html>
  );
}
