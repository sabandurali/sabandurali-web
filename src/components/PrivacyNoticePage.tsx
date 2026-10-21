import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { privacyPaths } from "@/config/site";
import { homeContent } from "@/content/homeContent";
import type { PrivacyContent } from "@/content/privacyContent";

export default function PrivacyNoticePage({
  content,
}: {
  content: PrivacyContent;
}) {
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
        languageHrefs={privacyPaths}
      />
      <main className="px-4 py-14 sm:px-6 sm:py-18 lg:py-22">
        <article className="mx-auto max-w-3xl">
          <header className="mb-10 border-b border-border pb-8 sm:mb-12 sm:pb-10">
            <p className="text-xs font-semibold tracking-[0.22em] text-accent-soft">
              {content.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl leading-tight text-ivory sm:text-5xl">
              {content.heading}
            </h1>
            <p className="mt-5 text-base leading-7 text-muted sm:text-lg sm:leading-8">
              {content.introduction}
            </p>
          </header>

          <div className="space-y-10">
            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl leading-tight text-ivory sm:text-3xl">
                  {section.heading}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-base leading-7 text-muted"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.items && (
                  <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-muted marker:text-accent">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
