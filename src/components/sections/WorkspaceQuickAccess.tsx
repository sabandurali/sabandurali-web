import { AreaIcon } from "./FocusAreas";
import type { FocusAreasContent } from "@/content/homeContent";

export default function WorkspaceQuickAccess({
  content,
}: {
  content: FocusAreasContent;
}) {
  return (
    <section aria-label={content.label} className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-7xl divide-y divide-border px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-3 xl:grid-cols-6 lg:px-10">
        {content.cards.map((area, index) => (
          <a
            key={area.title}
            href={area.linkHref}
            className="group min-h-40 px-4 py-5 transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--focus-ring)] sm:min-h-44 lg:min-w-0 lg:px-4"
          >
            <div className="flex items-center justify-between gap-3 text-accent-soft">
              <span className="text-xs font-semibold tracking-[0.18em]">{String(index + 1).padStart(2, "0")}</span>
              <AreaIcon icon={area.icon} className="size-5" />
            </div>
            <h2 className="mt-7 font-serif text-lg leading-tight text-ivory group-hover:text-accent-soft">{area.title}</h2>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{area.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
