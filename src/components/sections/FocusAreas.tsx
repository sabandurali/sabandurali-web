import type {
  FocusAreaIcon,
  FocusAreasContent,
} from "@/content/homeContent";
import type { ReactNode } from "react";

export function AreaIcon({
  icon,
  className = "size-6",
}: {
  icon: FocusAreaIcon;
  className?: string;
}) {
  const commonProps = {
    "aria-hidden": true,
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

type FocusAreasProps = {
  id: string;
  content: FocusAreasContent;
};

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
  renderVisual?: (index: number, featured: boolean) => ReactNode;
};

const cardStyle =
  "relative flex min-w-0 flex-col border border-[var(--accent-border-soft)] bg-white p-6 transition-colors hover:border-[var(--accent-border-hover)] motion-reduce:transition-none";

function FocusAreaCard({
  card,
  visual,
}: {
  card: FocusAreaCardItem;
  visual?: ReactNode;
}) {
  return (
    <article
      className={cardStyle}
    >
      {visual ?? (
        <div
          className="flex size-11 items-center justify-center border border-[var(--accent-border-soft)] bg-ink text-accent-soft"
        >
          <AreaIcon
            icon={card.icon}
            className="size-5"
          />
        </div>
      )}

      <h3
        className="mt-6 text-2xl font-semibold leading-snug tracking-tight"
      >
        {card.title}
      </h3>

      <p
        className="mt-4 line-clamp-3 text-[0.95rem] leading-6 text-muted-dark"
      >
        {card.description}
      </p>

      {card.linkLabel !== null &&
        (card.linkHref !== null ? (
          <a
            href={card.linkHref}
            className="mt-auto inline-flex min-h-11 items-center self-start pt-6 text-sm font-medium text-accent-deep underline decoration-[var(--accent-border-soft)] underline-offset-4 after:absolute after:inset-0 after:content-[''] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--focus-ring)]"
          >
            <span>
              {card.linkLabel}
              <span aria-hidden="true">&nbsp;→</span>
            </span>
          </a>
        ) : (
          <p
            className="mt-auto pt-6 text-sm font-medium"
          >
            {card.linkLabel}
          </p>
        ))}
    </article>
  );
}

export function FocusAreaCards({
  cards,
  renderVisual,
}: FocusAreaCardsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => (
        <FocusAreaCard
          key={card.id}
          card={card}
          visual={renderVisual?.(index, false)}
        />
      ))}
    </div>
  );
}

export default function FocusAreas({ id, content }: FocusAreasProps) {
  const cards = content.cards.map((area, index) => ({
    id: `${area.title}-${index}`,
    icon: area.icon,
    title: area.title,
    description: area.description,
    linkLabel: area.linkLabel,
    linkHref: area.linkHref ?? null,
  }));

  return (
    <section id={id} className="scroll-mt-24 bg-ivory-soft text-ink">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="mb-12 max-w-3xl border-l border-accent pl-5">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-accent-deep">
            {content.label}
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
            {content.title}
          </h2>

          {content.description && (
            <p className="mt-6 max-w-2xl leading-7 text-muted-dark">
              {content.description}
            </p>
          )}
        </div>

        <FocusAreaCards cards={cards} />
      </div>
    </section>
  );
}
