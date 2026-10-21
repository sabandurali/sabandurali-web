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
  const isLight = id === "son-arastirmalar";
  const backgroundColor = id === "fotograf" ? "bg-[#183735]" : "bg-[#F0E9DE]";
  const textColor = isLight ? "text-ink" : "text-ivory";
  const eyebrowColor = isLight ? "text-accent-deep" : "text-accent-soft";
  const descriptionColor = isLight ? "text-muted-dark" : "text-muted";
  const linkColor = isLight
    ? "text-accent-deep hover:text-ink"
    : "text-accent-soft hover:text-ivory";
  const contentDivider = isLight ? "md:border-ink/20" : "md:border-border";

  return (
    <section id={id} className={`scroll-mt-14 border-b border-[var(--accent-border-soft)] ${textColor} ${backgroundColor}`}>
      <div className={`mx-auto grid max-w-[1440px] gap-5 px-5 sm:px-8 md:grid-cols-[0.72fr_2.28fr] md:gap-5 lg:grid-cols-[0.68fr_2.62fr] lg:gap-7 lg:px-10 ${verticalRhythm}`}>
        <div className="flex flex-col justify-between border-l border-accent-soft pl-3">
          <div>
            <p className={`flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] after:h-px after:w-8 after:bg-accent/70 after:content-[''] sm:text-[10px] ${eyebrowColor}`}>
              {eyebrow}
            </p>
            <h2 className="mt-3 text-[1.85rem] font-semibold leading-[0.98] md:text-[1.65rem] lg:text-[2rem]">
              {content.title}
            </h2>
            {description && (
              <p className={`mt-4 max-w-sm text-xs leading-5 md:text-[11px] lg:text-sm lg:leading-6 ${descriptionColor}`}>
                {description}
              </p>
            )}
          </div>
          <Link
            href={href}
            className={`mt-4 inline-flex min-h-8 items-center self-start text-[10px] font-semibold transition-colors motion-reduce:transition-none ${linkColor}`}
          >
            {content.linkLabel} →
          </Link>
        </div>
        <div className={`min-w-0 md:border-l md:pl-5 ${contentDivider}`}>{children}</div>
      </div>
    </section>
  );
}
