import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";
import UiLink from "@/components/ui/UiLink";
import type { FocusAreaIcon } from "@/content/homeContent";

export function AreaIcon({
  icon,
  className = "size-6",
}: {
  icon: FocusAreaIcon;
  className?: string;
}) {
  const commonProps = {
    "aria-hidden": true,
    focusable: "false" as const,
    className,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.5,
    viewBox: "0 0 24 24",
  };

  if (icon === "book") {
    return (
      <svg {...commonProps}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a1 1 0 0 1 1 1v16a2 2 0 0 0-2-2H4V5.5Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13a1 1 0 0 0-1 1v16a2 2 0 0 1 2-2h6V5.5Z" />
      </svg>
    );
  }

  if (icon === "city") {
    return (
      <svg {...commonProps}>
        <path d="M3 21h18M6 21V10h5v11M14 21V4h4v17M8 13h1M8 16h1M16 7h.01M16 10h.01M16 13h.01M16 16h.01" />
      </svg>
    );
  }

  if (icon === "research") {
    return (
      <svg {...commonProps}>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="m15 15 4.5 4.5M8 10.5h5M10.5 8v5" />
      </svg>
    );
  }

  if (icon === "technology") {
    return (
      <svg {...commonProps}>
        <rect x="7" y="7" width="10" height="10" rx="1.5" />
        <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M10 10h4v4h-4z" />
      </svg>
    );
  }

  if (icon === "network") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="17" r="2" />
        <circle cx="19" cy="17" r="2" />
        <circle cx="12" cy="13" r="2" />
        <path d="m12 7v4M10.3 14 6.7 16M13.7 14l3.6 2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="m8.5 12.5 3 3a2 2 0 0 0 2.8 0l4.2-4.2M3 8.5l4-3 4 3-5 5-3-2.5v-2.5ZM21 8.5l-4-3-3.5 2.6M7.5 14.5l2 2M5.5 16.5l2 2M16.5 14.5l-2 2" />
    </svg>
  );
}

export type FocusAreaCardItem = {
  id: string;
  icon: FocusAreaIcon;
  title: string;
  description: string;
  linkLabel: string | null;
  linkHref: string | null;
};

type FocusAreaCardsProps = {
  cards: ReadonlyArray<FocusAreaCardItem>;
  /** Optional media at the top of a card (an image in CMS page blocks). */
  renderVisual?: (index: number, featured: boolean) => ReactNode;
  headingLevel?: 3 | 4;
  className?: string;
};

/**
 * Focus-area (workspace) cards for a light ground. A card with a link is
 * one link: the title link's hit area covers the card, the focus ring is
 * drawn around the card and the link label is only a visual cue. A card
 * without a link is plain text.
 */
export function FocusAreaCards({
  cards,
  renderVisual,
  headingLevel = 3,
  className,
}: FocusAreaCardsProps) {
  const Heading = headingLevel === 4 ? "h4" : "h3";

  return (
    <ul
      className={cx(
        "m-0 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {cards.map((card, index) => {
        const visual = renderVisual?.(index, false);
        const href = card.linkHref;

        return (
          <li key={card.id} className="flex min-w-0">
            <article
              className={cx(
                "relative flex w-full min-w-0 flex-col gap-3 rounded-card border border-ink bg-land p-5 text-ink",
                href !== null &&
                  "hover:bg-white has-[[data-card-link]:focus-visible]:focus-ring",
              )}
            >
              {visual ?? (
                <span
                  aria-hidden="true"
                  className="flex size-11 items-center justify-center rounded-tile border border-tile-edge text-ink"
                >
                  <AreaIcon icon={card.icon} className="size-6" />
                </span>
              )}
              <Heading className="m-0 type-h3 break-words">
                {href !== null ? (
                  <UiLink
                    href={href}
                    data-card-link=""
                    className="text-ink no-underline decoration-2 underline-offset-[5px] after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none focus-visible:[box-shadow:none]"
                  >
                    {card.title}
                  </UiLink>
                ) : (
                  card.title
                )}
              </Heading>
              <p className="m-0 type-small text-ink-muted">
                {card.description}
              </p>
              {card.linkLabel !== null && href !== null ? (
                <span
                  aria-hidden="true"
                  className="mt-auto pt-1 text-small font-bold underline decoration-signal decoration-2 underline-offset-[5px]"
                >
                  {card.linkLabel}
                </span>
              ) : null}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
