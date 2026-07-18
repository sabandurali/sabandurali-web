import ContactForm from "@/components/forms/ContactForm";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { contactPaths } from "@/config/site";
import type { ContactContent } from "@/content/contactContent";
import { homeContent } from "@/content/homeContent";

type ContactPageProps = {
  content: ContactContent;
};

export default function ContactPage({ content }: ContactPageProps) {
  const home = homeContent[content.locale];
  const homePath = content.locale === "tr" ? "/" : "/en";

  return (
    <div id="top" lang={content.locale}>
      <Header
        locale={content.locale}
        anchors={home.anchors}
        content={home.header}
        homeHref={homePath}
        anchorPrefix={homePath}
        languageHrefs={contactPaths}
      />
      <main className="px-4 py-14 sm:px-6 sm:py-18 lg:py-22">
        <div className="mx-auto max-w-3xl">
          <header className="mb-10 border-b border-border pb-8 sm:mb-12 sm:pb-10">
            <p className="text-xs font-semibold tracking-[0.22em] text-accent-soft">
              {content.eyebrow}
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl leading-tight text-ivory sm:text-5xl">
              {content.heading}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              {content.description}
            </p>
          </header>
          <ContactForm content={content} />
        </div>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
