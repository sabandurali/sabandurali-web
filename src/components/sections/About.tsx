import Image from "next/image";
import { Figure, type CreditInfo } from "@/components/ui/Figure";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import type { AboutContent } from "@/content/homeContent";
import type { SiteLocale } from "@/lib/metadata";

export const defaultPortraitSrc = "/brand/saban-durali-profile.jpg";

type AboutProps = {
  id: string;
  locale: SiteLocale;
  content: AboutContent;
  manifestoLines: ReadonlyArray<string>;
  /** Visible caption under the portrait (the person's name). */
  portraitCaption: string;
  /**
   * Credit of the portrait. The CMS media "Kaynak / telif" line when the
   * editor chose a portrait; null for the site's own portrait, whose
   * source the repository does not record (never invent one).
   */
  portraitCredit: CreditInfo | null;
};

/** "Hakkımda" on the sea ground: portrait, short biography, manifesto. */
export default function About({
  id,
  locale,
  content,
  manifestoLines,
  portraitCaption,
  portraitCredit,
}: AboutProps) {
  const headingId = `${id}-baslik`;
  const paragraphs = content.paragraphs.slice(0, 2);

  return (
    <Section id={id} tone="sea" labelledBy={headingId}>
      <div className="grid gap-10 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-12 xl:grid-cols-[16rem_minmax(0,1.4fr)_minmax(0,1fr)] xl:gap-16">
        <Figure
          tone="on-sea"
          locale={locale}
          caption={portraitCaption}
          credit={portraitCredit}
          className="w-44 sm:w-52 md:w-full"
        >
          <Image
            src={content.imageSrc ?? defaultPortraitSrc}
            alt={content.imageAlt}
            width={480}
            height={600}
            sizes="(min-width: 768px) 256px, 208px"
            className="block aspect-[4/5] h-auto w-full rounded-card border border-sea-line object-cover object-top"
          />
        </Figure>

        <div className="min-w-0">
          <p className="m-0 mb-3 type-region text-on-sea-muted">
            {content.label}
          </p>
          <h2 id={headingId} className="m-0 type-h2-lg text-on-sea">
            {content.titleLines.join(" ")}
          </h2>
          <div className="mt-5 grid max-w-measure gap-4 type-body text-on-sea-soft">
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
          {content.linkLabel && content.linkHref ? (
            <TextLink
              href={content.linkHref}
              variant="standalone"
              tone="on-sea"
              locale={locale}
              className="mt-4"
            >
              {content.linkLabel.replace(/\s*→\s*$/u, "")}
            </TextLink>
          ) : null}
        </div>

        {manifestoLines.length > 0 ? (
          <ul className="m-0 grid list-none content-start gap-4 border-t border-sea-line p-0 pt-6 md:col-span-2 xl:col-span-1 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-10">
            {manifestoLines.map((line) => (
              <li key={line} className="type-h3 text-on-sea">
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Section>
  );
}
