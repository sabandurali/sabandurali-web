import Link from "next/link";
import type { ReactNode } from "react";
import type { HomeListingSectionContent } from "@/content/homeContent";

type HomeListingSectionProps = {
  children: ReactNode;
  content: HomeListingSectionContent;
  description?: string;
  eyebrow: string;
  href: string;
  id?: string;
};

export default function HomeListingSection({
  children,
  content,
  description,
  eyebrow,
  href,
  id,
}: HomeListingSectionProps) {
  const verticalRhythm =
    id === "fotograf"
      ? "gap-4 py-5 md:min-h-[17rem] md:gap-5 md:py-6"
      : id === "son-arastirmalar"
        ? "gap-4 py-5 md:min-h-[11.5rem] md:gap-5 md:py-6"
        : "md:py-2.5";

  return (
    <section id={id} className="scroll-mt-14 border-b border-[var(--accent-border-soft)] bg-background text-ivory">
      <div className={`mx-auto grid max-w-[1440px] gap-5 px-5 sm:px-8 md:grid-cols-[0.72fr_2.28fr] md:gap-5 lg:grid-cols-[0.68fr_2.62fr] lg:gap-7 lg:px-10 ${verticalRhythm}`}>
        <div className="flex flex-col justify-between border-l border-accent-soft pl-3">
          <div>
            <p className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-accent-soft after:h-px after:w-8 after:bg-accent/70 after:content-[''] sm:text-[10px]">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-[1.85rem] font-semibold leading-[0.98] md:text-[1.65rem] lg:text-[2rem]">
              {content.title}
            </h2>
            {description && (
              <p className="mt-4 max-w-sm text-xs leading-5 text-muted md:text-[11px] lg:text-sm lg:leading-6">
                {description}
              </p>
            )}
          </div>
          <Link
            href={href}
            className="mt-4 inline-flex min-h-8 items-center self-start text-[10px] font-semibold text-accent-soft transition-colors hover:text-ivory motion-reduce:transition-none"
          >
            {content.linkLabel} →
          </Link>
        </div>
        <div className="min-w-0 md:border-l md:border-border md:pl-5">{children}</div>
      </div>
    </section>
  );
}
