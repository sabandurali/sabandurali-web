import { ButtonLink } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import DistrictKeyMap from "@/components/ui/DistrictKeyMap";
import { ArrowRightIcon } from "@/components/ui/icons";
import TitleLines from "@/components/ui/TitleLines";
import type { HeroContent, HomeAnchors } from "@/content/homeContent";

type HeroProps = {
  anchors: HomeAnchors;
  content: HeroContent;
  /** Label of the facts panel ("Platform özeti"). */
  factsLabel: string;
  /** District the key map marks: the featured guide, when there is one. */
  featuredSlug?: string;
};

/**
 * Home hero: the only h1 (`type-display`), the lead, two calls to action
 * and a facts panel. The key map is decorative: the atlas section below is
 * the real map.
 */
export default function Hero({
  anchors,
  content,
  factsLabel,
  featuredSlug,
}: HeroProps) {
  const goals = content.goals.filter(
    (goal) => goal.value.trim() !== "" && goal.label.trim() !== "",
  );

  return (
    <section
      aria-labelledby="ana-baslik"
      className="border-b border-hairline bg-paper text-ink"
    >
      <Container className="grid gap-10 py-section-sm lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-end lg:gap-16">
        <div className="min-w-0">
          {content.eyebrow.trim() !== "" ? (
            <p className="m-0 mb-5 type-region text-ink-muted">
              {content.eyebrow}
            </p>
          ) : null}
          <h1 id="ana-baslik" className="m-0 type-display">
            <TitleLines lines={content.titleLines} />
          </h1>
          <p className="m-0 mt-6 max-w-measure type-lead text-ink">
            {content.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink
              href={content.primaryActionHref ?? `#${anchors.work}`}
              icon={<ArrowRightIcon size={18} />}
            >
              {content.primaryAction}
            </ButtonLink>
            <ButtonLink
              href={content.secondaryActionHref ?? `#${anchors.about}`}
              variant="secondary"
            >
              {content.secondaryAction}
            </ButtonLink>
          </div>
        </div>

        {goals.length > 0 ? (
          <aside
            aria-label={factsLabel}
            className="min-w-0 rounded-card border border-ink bg-land"
          >
            <div className="hidden border-b border-hairline p-4 lg:block">
              <DistrictKeyMap featuredSlug={featuredSlug} />
            </div>
            <p className="m-0 border-b border-hairline px-4 py-2.5 type-region text-ink-muted">
              {content.goalsLabel}
            </p>
            <dl className="m-0 grid sm:grid-cols-3 lg:grid-cols-1">
              {goals.map((goal, index) => (
                <div
                  key={`${goal.label}-${index}`}
                  className="flex min-w-0 flex-row-reverse items-baseline justify-between gap-4 border-hairline px-4 py-3 not-last:border-b sm:flex-col-reverse sm:items-start sm:justify-end sm:gap-1 sm:not-last:border-r sm:not-last:border-b-0 lg:flex-row-reverse lg:items-baseline lg:justify-between lg:gap-4 lg:not-last:border-r-0 lg:not-last:border-b"
                >
                  <dt className="type-small break-words text-ink-muted">
                    {goal.label}
                  </dt>
                  <dd className="m-0 type-data-lg break-words text-ink">
                    {goal.value}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        ) : null}
      </Container>
    </section>
  );
}
