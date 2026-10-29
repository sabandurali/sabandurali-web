import ContactForm from "@/components/forms/ContactForm";
import Container from "@/components/ui/Container";
import TextLink from "@/components/ui/TextLink";
import PageIntro from "@/components/workspaces/PageIntro";
import PageShell from "@/components/workspaces/PageShell";
import { contactPaths, privacyPaths } from "@/config/site";
import type { ContactContent } from "@/content/contactContent";
import type { Locale } from "@/content/homeContent";
import { homeCrumb } from "@/components/ui/Breadcrumb";

type ContactPageProps = {
  content: ContactContent;
};

const pageTexts = {
  tr: {
    current: "İletişim",
    formTitle: "Mesaj formu",
    formNote:
      "Zorunlu alanlar “(zorunlu)” ile işaretlidir. Mesajınız Formspree form hizmeti aracılığıyla iletilir.",
    privacyLead: "Kişisel verilerin nasıl işlendiğini okuyun:",
  },
  en: {
    current: "Contact",
    formTitle: "Message form",
    formNote:
      "Required fields are marked “(required)”. Your message is delivered through the Formspree form service.",
    privacyLead: "Read how personal data is processed:",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export default function ContactPage({ content }: ContactPageProps) {
  const locale = content.locale;
  const texts = pageTexts[locale];

  return (
    <PageShell locale={locale} languageHrefs={contactPaths}>
      <main id="main" className="scheme-light bg-paper py-section text-ink">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <PageIntro
            locale={locale}
            breadcrumb={[homeCrumb(locale), { label: texts.current }]}
            eyebrow={content.eyebrow}
            title={content.heading}
            lead={content.description}
            className="lg:self-start"
          >
            <p className="m-0 max-w-measure border-t border-hairline pt-5 type-small text-ink-muted">
              {texts.privacyLead}{" "}
              <TextLink href={privacyPaths[locale]} locale={locale}>
                {content.privacyAcknowledgement.linkLabel}
              </TextLink>
            </p>
          </PageIntro>

          <section
            aria-labelledby="contact-form-title"
            className="rounded-card border border-ink bg-land p-5 sm:p-8"
          >
            <h2 id="contact-form-title" className="m-0 type-h3">
              {texts.formTitle}
            </h2>
            <p className="mt-2 mb-6 type-small text-ink-muted">
              {texts.formNote}
            </p>
            <ContactForm content={content} labelledBy="contact-form-title" />
          </section>
        </Container>
      </main>
    </PageShell>
  );
}
