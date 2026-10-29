import { ButtonLink } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import PageIntro from "@/components/workspaces/PageIntro";
import PageShell from "@/components/workspaces/PageShell";
import { contactPaths, privacyPaths } from "@/config/site";
import type { Locale } from "@/content/homeContent";
import type { PrivacyContent } from "@/content/privacyContent";

const pageTexts = {
  tr: {
    home: "Ana sayfa",
    current: "KVKK Aydınlatma Metni",
    contents: "Bu metinde",
    contact: "İletişim formuna dön",
  },
  en: {
    home: "Home",
    current: "Privacy Notice",
    contents: "In this notice",
    contact: "Back to the contact form",
  },
} as const satisfies Record<Locale, Record<string, string>>;

/** Stable fragment id of a notice section ("bolum-3" / "section-3"). */
export function privacySectionId(locale: Locale, index: number): string {
  return `${locale === "tr" ? "bolum" : "section"}-${index + 1}`;
}

export default function PrivacyNoticePage({
  content,
}: {
  content: PrivacyContent;
}) {
  const locale = content.locale;
  const texts = pageTexts[locale];

  return (
    <PageShell locale={locale} languageHrefs={privacyPaths}>
      <main id="main" className="scheme-light bg-paper py-section text-ink">
        <Container>
          <PageIntro
            locale={locale}
            size="h2-lg"
            breadcrumb={[
              { label: texts.home, href: locale === "tr" ? "/" : "/en" },
              { label: texts.current },
            ]}
            eyebrow={content.eyebrow}
            title={content.heading}
            lead={content.introduction}
          />

          <div className="mt-12 grid gap-10 border-t border-hairline pt-10 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-16">
            <nav aria-labelledby="privacy-contents" className="lg:self-start">
              <h2
                id="privacy-contents"
                className="m-0 type-label text-ink-muted"
              >
                {texts.contents}
              </h2>
              <ol className="mt-3 list-none border-l-2 border-hairline p-0">
                {content.sections.map((section, index) => (
                  <li key={section.heading}>
                    <a
                      href={`#${privacySectionId(locale, index)}`}
                      className="-ml-0.5 flex min-h-tap items-center border-l-2 border-transparent py-1.5 pl-4 type-small text-ink underline decoration-1 underline-offset-[0.2em] hover:border-ink hover:decoration-2"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <article className="max-w-measure">
              {content.sections.map((section, index) => (
                <section
                  key={section.heading}
                  id={privacySectionId(locale, index)}
                  aria-labelledby={`${privacySectionId(locale, index)}-title`}
                  className="scroll-mt-6 border-b border-hairline py-8 first:pt-0 last:border-b-0"
                >
                  <h2
                    id={`${privacySectionId(locale, index)}-title`}
                    className="m-0 type-h3"
                  >
                    {section.heading}
                  </h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 mb-0 type-body">
                      {paragraph}
                    </p>
                  ))}
                  {section.items ? (
                    <ul className="mt-4 mb-0 flex list-none flex-col gap-3 p-0 type-body">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-[0.7em] size-1.5 shrink-0 bg-ink"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}

              <ButtonLink
                href={contactPaths[locale]}
                variant="secondary"
                className="mt-6"
              >
                {texts.contact}
              </ButtonLink>
            </article>
          </div>
        </Container>
      </main>
    </PageShell>
  );
}
