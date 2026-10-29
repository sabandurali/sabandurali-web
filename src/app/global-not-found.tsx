import type { Metadata } from "next";
import { createRootLayoutMetadata } from "@/components/layout/root-metadata";
import Masthead from "@/components/layout/Masthead";
import StatusMessage from "@/components/layout/StatusMessage";
import { ButtonLink } from "@/components/ui/Button";
import SkipLink from "@/components/ui/SkipLink";
import TextLink from "@/components/ui/TextLink";
import { fontVariables } from "./fonts";
import "./globals.css";

/*
 * Unmatched URLs outside every route (experimental.globalNotFound). This
 * page renders without a layout, so it loads the fonts and atlas styles
 * itself and starts with its own skip link. It cannot know the visitor's
 * language: the page is Turkish (the default site) with an English block
 * marked lang="en". It does not read the CMS, so it never fails. Unmatched
 * /en/* addresses get the English 404 of the (en) layout instead.
 */
export const metadata: Metadata = {
  ...createRootLayoutMetadata("tr"),
  title: "Sayfa bulunamadı · Page not found | Şaban Durali",
  description: "İstenen sayfa bulunamadı. The requested page was not found.",
};

export default function GlobalNotFound() {
  return (
    <html lang="tr" data-scroll-behavior="smooth" className={fontVariables}>
      <body>
        <SkipLink>İçeriğe geç · Skip to content</SkipLink>
        <Masthead locale="tr" />
        <StatusMessage
          code="404"
          title="Sayfa bulunamadı."
          actions={<ButtonLink href="/">Ana sayfaya dön</ButtonLink>}
          aside={
            <section
              lang="en"
              aria-labelledby="global-not-found-en"
              className="border-t border-hairline pt-8"
            >
              <h2 id="global-not-found-en" className="m-0 type-h3">
                Page not found.
              </h2>
              <p className="mt-3 mb-0 type-body text-ink-muted">
                The address may be mistyped, moved or no longer in use.
              </p>
              <p className="mt-3 mb-0">
                <TextLink href="/en" variant="standalone" locale="en">
                  Go to the English home page
                </TextLink>
              </p>
            </section>
          }
        >
          <p className="m-0">
            Adres yanlış yazılmış, taşınmış ya da artık kullanılmıyor olabilir.
          </p>
        </StatusMessage>
      </body>
    </html>
  );
}
