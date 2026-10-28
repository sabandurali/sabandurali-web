import { createElement, type ReactNode } from "react";
import { cx } from "./cx";
import UiLink from "./UiLink";

type CardProps = {
  /** The only link text: the card's accessible name stays short. */
  title: string;
  href: string;
  headingLevel?: 2 | 3 | 4;
  /** Image or key map, shown at 3:2. Its alt text is not part of the link. */
  media?: ReactNode;
  /** Credit line under the media (a <Credit>): it stays clickable. */
  credit?: ReactNode;
  /** Line above the title, e.g. <GridRef> + side. */
  eyebrow?: ReactNode;
  /** Facts or a short description under the title. */
  children?: ReactNode;
  /** Visual "Detaylı rehber" cue; hidden from screen readers (the title
   * link already names the destination). */
  cta?: string;
  prefetch?: boolean;
  className?: string;
};

/**
 * Card with one title link whose hit area covers the whole card. Hovering
 * underlines only the title; other links inside (credits, sources) stay
 * above the hit area. The focus ring is drawn around the whole card.
 */
export default function Card({
  title,
  href,
  headingLevel = 3,
  media,
  credit,
  eyebrow,
  children,
  cta,
  prefetch,
  className,
}: CardProps) {
  const heading = createElement(
    `h${headingLevel}`,
    { className: "m-0 type-card-title" },
    <UiLink
      href={href}
      prefetch={prefetch}
      data-card-link=""
      className="text-ink no-underline decoration-2 underline-offset-[5px] after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none focus-visible:[box-shadow:none]"
    >
      {title}
    </UiLink>,
  );

  return (
    <article
      className={cx(
        "relative flex min-w-0 flex-col overflow-hidden rounded-card border border-ink bg-land text-ink has-[[data-card-link]:focus-visible]:focus-ring",
        className,
      )}
    >
      {media ? (
        <div className="relative aspect-[3/2] overflow-hidden bg-band">
          {media}
        </div>
      ) : null}
      {credit ? (
        <div className="border-b border-hairline px-[18px] py-2">{credit}</div>
      ) : null}
      <div className="flex flex-auto flex-col gap-2.5 px-[18px] pt-[18px] pb-5">
        {eyebrow ? (
          <div className="flex flex-wrap items-center gap-2.5 type-small text-ink-muted">
            {eyebrow}
          </div>
        ) : null}
        {heading}
        {children}
        {cta ? (
          <span
            aria-hidden="true"
            className="mt-auto pt-1.5 text-small font-bold underline decoration-signal decoration-2 underline-offset-[5px]"
          >
            {cta}
          </span>
        ) : null}
      </div>
    </article>
  );
}
