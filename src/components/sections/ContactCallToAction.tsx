import { ButtonLink } from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { HomeContactCallToActionContent } from "@/content/homeContent";

type ContactCallToActionProps = {
  content: HomeContactCallToActionContent;
  href: string;
};

/** Closing call to action: title, one sentence and the contact button. */
export default function ContactCallToAction({
  content,
  href,
}: ContactCallToActionProps) {
  return (
    <Section tone="paper" divider labelledBy="iletisim-cagri-baslik">
      <div className="flex flex-col gap-6 rounded-card border border-ink bg-land p-6 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8">
        <div className="max-w-measure min-w-0">
          <h2 id="iletisim-cagri-baslik" className="m-0 type-h2">
            {content.title}
          </h2>
          <p className="m-0 mt-3 type-body text-ink-muted">
            {content.description}
          </p>
        </div>
        <ButtonLink
          href={href}
          className="self-start md:self-auto md:shrink-0"
          icon={<ArrowRightIcon size={18} />}
        >
          {content.buttonLabel}
        </ButtonLink>
      </div>
    </Section>
  );
}
