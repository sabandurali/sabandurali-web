import { education, experience, softwareExperience, biographyNotice } from "@/content/biography";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import BackToTop from "@/components/layout/BackToTop";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { AreaIcon } from "@/components/sections/FocusAreas";
import ContactCallToAction from "@/components/sections/ContactCallToAction";
import { contactPaths, getAbsoluteUrl } from "@/config/site";
import { homeContent } from "@/content/homeContent";
import { workspaces } from "@/content/workspaces";

export const metadata: Metadata = {
  title: "Hakkımda | Şaban Durali",
  description:
    "Şaban Durali'nin çalışma alanları, platform yaklaşımı ve profesyonel profili.",
  alternates: { canonical: getAbsoluteUrl("/hakkimda") },
};

export default function AboutPage() {
  const home = homeContent.tr;

  return (
    <div id="top" lang="tr">
      <Header
        locale="tr"
        anchors={home.anchors}
        content={home.header}
        homeHref="/"
        anchorPrefix="/"
        languageHrefs={{ tr: "/hakkimda", en: "/en" }}
      />

      <main>
        <section
          id="hakkimda"
          data-about-section="profile"
          className="scroll-mt-24 border-y border-accent/60 bg-[#F5EFE4] text-ink"
        >
          <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:px-8 sm:py-14 md:grid-cols-[15rem_1fr] md:items-center md:gap-12 lg:grid-cols-[18rem_1fr] lg:px-10 lg:py-20">
            <div className="w-44 border border-[var(--accent-border-soft)] bg-ivory-soft p-2 sm:w-52 md:w-full">
              <Image
                src="/brand/saban-durali-profile.jpg"
                alt={home.about.imageAlt}
                width={480}
                height={600}
                sizes="(min-width: 1024px) 288px, (min-width: 768px) 240px, 208px"
                priority
                className="aspect-[4/5] h-auto w-full object-cover object-top"
              />
            </div>

            <div className="max-w-3xl md:border-l md:border-ink/20 md:pl-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
                Hakkımda / Profil
              </p>
              <h1 className="mt-4 font-serif text-[2.75rem] font-semibold leading-[0.96] text-ink sm:text-6xl lg:text-7xl">
                Şaban Durali
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-dark sm:text-lg sm:leading-8">
                {home.about.paragraphs[0]}
              </p>
            </div>
          </div>
        </section>

        <section
          id="biyografi"
          data-about-section="biography"
          className="scroll-mt-24 border-b border-[var(--accent-border-soft)] bg-background text-ivory"
        >
          <div className="mx-auto grid max-w-[1440px] gap-7 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[0.42fr_1fr] md:gap-12 lg:px-10 lg:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">
                01 / Biyografi
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                Araştırma, uygulama ve uzun vadeli değer.
              </h2>
            </div>
            <div className="border-l border-accent/60 pl-5 sm:pl-8 md:self-center">
              <p className="max-w-3xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
                {home.about.paragraphs[1]}
              </p>
            </div>
          </div>
        </section>

        <section id="deneyim" className="scroll-mt-24 border-b border-border bg-surface text-ivory">
          <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 lg:px-10">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-strong">02 / Mesleki deneyim</p>
            <h2 className="mt-4 font-serif text-4xl">1996’dan bugüne</h2>
            <ol className="mt-8 divide-y divide-border">
              {experience.map(([period, role, company]) => <li key={`${period}-${company}`} className="grid gap-2 py-5 sm:grid-cols-[140px_1fr]"><p className="text-accent-soft">{period}</p><div><h3 className="text-lg">{role}</h3><p className="mt-1 text-muted">{company}</p></div></li>)}
            </ol>
            <h3 className="mt-8 text-xl">Yazılım deneyimi</h3>
            <p className="mt-3 text-muted">{softwareExperience}</p>
            <p className="mt-6 text-sm leading-7 text-muted">{biographyNotice}</p>
          </div>
        </section>

        <section
          data-about-section="work-areas"
          className="border-b border-[var(--accent-border-soft)] bg-ivory-soft text-ink"
        >
          <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-deep">
                03 / Çalışma ve İlgi Alanları
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                Birbirini besleyen altı çalışma alanı.
              </h2>
            </div>

            <div className="mt-10 grid gap-px border border-[var(--accent-border-soft)] bg-[var(--accent-border-soft)] sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((workspace) => (
                <article
                  key={workspace.key}
                  className="flex min-w-0 flex-col bg-[#F5EFE4] p-5 sm:p-6"
                >
                  <div className="flex size-10 items-center justify-center border border-[var(--accent-border-soft)] text-accent-deep">
                    <AreaIcon icon={workspace.icon} className="size-5" />
                  </div>
                  <h3 className="mt-5 font-serif text-2xl font-semibold leading-tight">
                    {workspace.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-dark sm:text-base sm:leading-7">
                    {workspace.description}
                  </p>
                  <Link
                    href={`/${workspace.key}`}
                    className="mt-auto inline-flex min-h-11 items-end self-start pt-6 text-sm font-semibold text-accent-deep underline decoration-[var(--accent-border-soft)] underline-offset-4 hover:text-ink"
                  >
                    Alanı keşfet →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="egitim-sertifikalar"
          data-about-section="education"
          className="scroll-mt-24 border-b border-[var(--accent-border-soft)] bg-surface text-ivory"
        >
          <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">
                04 / Eğitim
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                Eğitim
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
                {biographyNotice}
              </p>
            </div>

            <div className="mt-10 grid border-y border-border md:grid-cols-2 md:divide-x md:divide-border">
              {education.map((section) => (
                <article
                  key={section.title}
                  className="border-b border-border py-6 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0"
                >
                  <h3 className="font-serif text-2xl font-semibold text-ivory">
                    {section.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {section.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          data-about-section="platform-purpose"
          className="border-b border-[var(--accent-border-soft)] bg-[#F5EFE4] text-ink"
        >
          <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[1fr_0.8fr] md:items-center lg:px-10 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-deep">
                05 / Platformun Amacı
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
                Bilgiyi araştırmak, uygulamak ve paylaşmak.
              </h2>
              <p className="mt-6 text-base leading-7 text-muted-dark sm:text-lg sm:leading-8">
                {home.hero.description}
              </p>
              <p className="mt-4 text-base leading-7 text-muted-dark sm:text-lg sm:leading-8">
                {home.footer.description}
              </p>
            </div>

            <blockquote
              data-about-section="manifesto"
              className="border-l-2 border-accent bg-[#E9E0CF] px-6 py-7 font-serif text-2xl leading-snug text-ink sm:px-8 sm:py-9 sm:text-3xl"
            >
              Bilgi, paylaşıldığında büyür.
              <br />
              Analiz, doğru sorularla başlar.
              <br />
              Değer, tutarlılıkla oluşur.
            </blockquote>
          </div>
        </section>

        <ContactCallToAction
          content={home.contactCallToAction}
          href={contactPaths.tr}
        />
      </main>

      <Footer id={home.anchors.contact} content={home.footer} />
      <BackToTop label={home.backToTopLabel} />
    </div>
  );
}
