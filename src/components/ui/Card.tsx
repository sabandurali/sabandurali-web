import { createElement, type ReactNode } from "react";
import { cx } from "./cx";
import UiLink from "./UiLink";

type CardProps = {
  /** The only link text: the card's accessible name stays short. */
  title: string;
  /**
   * Target of the title link. Without it the card is not a link: the title
   * is plain text, no focus ring is drawn and `cta` is not shown.
   */
  href?: string;
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
  /** Language of the linked page when it differs from this page's. */
  hrefLang?: string;
  className?: string;
};

/** Frame shared by every link card on a light ground. */
export const cardFrameClassName =
  "relative flex min-w-0 flex-col rounded-card border border-ink bg-land text-ink";

/** Draws the focus ring around the card while its title link has focus. */
export const cardFocusClassName =
  "has-[[data-card-link]:focus-visible]:focus-ring";

/**
 * The card's only link. Its ::after covers the card, so the whole card is
 * the hit area; the focus ring moves to the frame (`cardFocusClassName`).
 */
export function CardTitleLink({
  href,
  prefetch,
  hrefLang,
  children,
}: {
  href: string;
  prefetch?: boolean;
  hrefLang?: string;
  children: ReactNode;
}) {
  return (
    <UiLink
      href={href}
      prefetch={prefetch}
      hrefLang={hrefLang}
      data-card-link=""
      className="text-ink no-underline decoration-2 underline-offset-[5px] after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none focus-visible:[box-shadow:none]"
    >
      {children}
    </UiLink>
  );
}

/** Visual "go" cue at the card foot; hidden from screen readers because
 * the title link already names the destination. */
export function CardCue({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "mt-auto type-small font-bold underline decoration-signal decoration-2 underline-offset-[5px]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Card with one title link whose hit area covers the whole card. Hovering
 * underlines only the title; other links inside (credits, sources) stay
 * above the hit area. The focus ring is drawn around the whole card.
 * Without `href` the same frame, media and body show an unlinked card.
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
  hrefLang,
  className,
}: CardProps) {
  const heading = createElement(
    `h${headingLevel}`,
    { className: "m-0 type-card-title" },
    href === undefined ? (
      title
    ) : (
      <CardTitleLink href={href} prefetch={prefetch} hrefLang={hrefLang}>
        {title}
      </CardTitleLink>
    ),
  );

  return (
    <article
      className={cx(
        cardFrameClassName,
        "overflow-hidden",
        href !== undefined && cardFocusClassName,
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
        {cta && href !== undefined ? (
          <CardCue className="pt-1.5">{cta}</CardCue>
        ) : null}
      </div>
    </article>
  );
}
