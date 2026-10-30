import Image from "next/image";
import { defaultPortraitSrc } from "@/components/sections/About";
import { getPortraitCredit } from "@/components/sections/home-portrait";
import { homeBreadcrumbItem } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import Eyebrow from "@/components/ui/Eyebrow";
import { Figure } from "@/components/ui/Figure";
import PageIntro from "@/components/ui/PageIntro";
import Section from "@/components/ui/Section";
import Timeline from "@/components/ui/Timeline";
import { contactPaths } from "@/config/site";
import {
  biographyNotice,
  education,
  experience,
  softwareExperience,
} from "@/content/biography";
import type { HomeContent } from "@/content/homeContent";
import { homeEditorialContent } from "@/content/homeEditorialContent";
import type { PublicPage } from "@/content/pages/public-types";
import { workspaces } from "@/content/workspaces";

export type AboutPageProps = {
  /** The served Turkish home content (`getHomeContent("tr")`). */
  content: HomeContent;
  /** The CMS home page behind `content`; null for the static content. */
  page: PublicPage | null;
};

/**
 * Body of /hakkimda, inside `<main>`. The portrait with its alt text and
 * credit, the introduction paragraphs and the platform description are the
 * home page's "Hakkımda" and hero content, so a CMS edit reaches both
 * pages. The first paragraph is the lead, the others form the biography
 * section. AboutPage adds the site shell, so this part is testable alone.
 */
export default function AboutPageContent({ content, page }: AboutPageProps) {
  const about = content.about;
  const [lead, ...biography] = about.paragraphs;
  const software = softwareExperience
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");

  return (
    <>
      <Section id="hakkimda" className="scroll-mt-24">
        <div className="grid gap-10 md:grid-cols-[15rem_minmax(0,1fr)] md:items-end lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-16">
          <Figure
            credit={getPortraitCredit(page, about)}
            className="w-48 sm:w-56 md:w-full"
          >
            <div className="overflow-hidden rounded-card border border-ink bg-land">
              <Image
                src={about.imageSrc ?? defaultPortraitSrc}
                alt={about.imageAlt}
                width={900}
                height={1100}
                sizes="(min-width: 1024px) 304px, (min-width: 768px) 240px, 224px"
                // Above the fold on every width: fetched first, never lazy
                // (Next 16 recommends this over `preload`).
                loading="eager"
                fetchPriority="high"
                className="block aspect-[9/11] h-auto w-full object-cover object-top"
              />
            </div>
          </Figure>
          <PageIntro
            breadcrumb={[homeBreadcrumbItem("tr"), { label: "Hakkımda" }]}
            eyebrow="Hakkımda / Profil"
            title="Şaban Durali"
            lead={lead}
          />
        </div>
      </Section>

      <Section
        id="biyografi"
        tone="sea"
        labelledBy="biyografi-title"
        className="scroll-mt-24"
      >
        <div className="grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
          <div className="flex flex-col gap-4">
            <Eyebrow number={1} tone="on-sea">
              Biyografi
            </Eyebrow>
            <h2 id="biyografi-title" className="m-0 type-h2-lg">
              Araştırma, uygulama ve uzun vadeli değer.
            </h2>
          </div>
          {biography.length > 0 ? (
            <div className="grid max-w-measure gap-4 self-center type-lead text-on-sea-soft">
              {biography.map((paragraph) => (
                <p key={paragraph} className="m-0">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </Section>

      <Section id="deneyim" labelledBy="deneyim-title" className="scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="flex flex-col gap-4 lg:self-start">
            <Eyebrow number={2}>Mesleki deneyim</Eyebrow>
            <h2 id="deneyim-title" className="m-0 type-h2-lg">
              1996’dan bugüne
            </h2>
            <h3 className="mt-6 mb-0 type-h4">Yazılım deneyimi</h3>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {software.map((item) => (
                <li key={item}>
                  <Chip>{item}</Chip>
                </li>
              ))}
            </ul>
            <p className="mt-4 mb-0 max-w-measure type-small text-ink-muted">
              {biographyNotice}
            </p>
          </div>
          <Timeline
            label="Mesleki deneyim, yeniden eskiye"
            entries={experience.map(([period, role, company], index) => ({
              id: `${period}-${company}`,
              when: period,
              highlight: index === 0,
              children: (
                <>
                  <h3 className="m-0 type-h4">{role}</h3>
                  <p className="m-0 mt-1 type-small text-ink-muted">
                    {company}
                  </p>
                </>
              ),
            }))}
          />
        </div>
      </Section>

      <Section
        tone="band"
        labelledBy="calisma-alanlari-title"
        divider
        className="scroll-mt-24"
      >
        <div className="flex max-w-measure flex-col gap-4">
          <Eyebrow number={3}>Çalışma ve ilgi alanları</Eyebrow>
          <h2 id="calisma-alanlari-title" className="m-0 type-h2-lg">
            Birbirini besleyen altı çalışma alanı.
          </h2>
        </div>
        <ul className="m-0 mt-10 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <li key={workspace.key} className="flex min-w-0">
              <Card
                title={workspace.title}
                href={`/${workspace.key}`}
                eyebrow={<span>{workspace.eyebrow}</span>}
                cta="Alanı keşfet"
                className="w-full"
              >
                <p className="m-0 type-small text-ink-muted">
                  {workspace.description}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="egitim-sertifikalar"
        labelledBy="egitim-title"
        className="scroll-mt-24"
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="flex flex-col gap-4">
            <Eyebrow number={4}>Eğitim</Eyebrow>
            <h2 id="egitim-title" className="m-0 type-h2-lg">
              Eğitim
            </h2>
            <p className="m-0 max-w-measure type-small text-ink-muted">
              {biographyNotice}
            </p>
          </div>
          <ul className="m-0 list-none border-t border-ink p-0">
            {education.map((item) => (
              <li key={item.title} className="border-b border-hairline py-6">
                <h3 className="m-0 type-h3">{item.title}</h3>
                <p className="m-0 mt-2 type-body text-ink-muted">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="land" labelledBy="amac-title" divider>
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-center md:gap-16">
          <div className="flex max-w-measure flex-col gap-4">
            <Eyebrow number={5}>Platformun amacı</Eyebrow>
            <h2 id="amac-title" className="m-0 type-h2-lg">
              Bilgiyi araştırmak, uygulamak ve paylaşmak.
            </h2>
            <p className="m-0 type-body">{content.hero.description}</p>
            <p className="m-0 type-body">{content.footer.description}</p>
          </div>
          <blockquote className="m-0 border-l-4 border-signal bg-paper px-6 py-7 sm:px-8 sm:py-9">
            {homeEditorialContent.tr.manifestoLines.map((line) => (
              <p key={line} className="m-0 type-h3">
                {line}
              </p>
            ))}
          </blockquote>
        </div>
      </Section>

      <Section tone="sea" labelledBy="iletisim-title">
        <div className="flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="flex max-w-measure flex-col gap-4">
            <h2 id="iletisim-title" className="m-0 type-h2-lg">
              {content.contactCallToAction.title}
            </h2>
            <p className="m-0 type-lead text-on-sea-soft">
              {content.contactCallToAction.description}
            </p>
          </div>
          <ButtonLink
            href={contactPaths.tr}
            variant="on-sea"
            className="shrink-0"
          >
            {content.contactCallToAction.buttonLabel}
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
