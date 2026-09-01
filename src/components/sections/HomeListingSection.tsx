import Link from "next/link";
import type { ReactNode } from "react";
import type { HomeListingSectionContent } from "@/content/homeContent";

type HomeListingSectionProps = {
  children: ReactNode;
  content: HomeListingSectionContent;
  eyebrow: string;
  href: string;
  id?: string;
};

export default function HomeListingSection({
  children,
  content,
  eyebrow,
  href,
  id,
}: HomeListingSectionProps) {
  const verticalRhythm =
    id === "fotograf"
      ? "md:min-h-40 md:py-4"
      : id === "son-arastirmalar"
        ? "md:min-h-[9.5rem] md:py-4"
        : "md:py-2.5";

  return (
    <section id={id} className="scroll-mt-14 border-b border-[var(--accent-border-soft)] bg-background text-ivory">
      <div className={`mx-auto grid max-w-[1440px] gap-4 px-5 py-4 sm:px-8 md:grid-cols-[0.72fr_2.28fr] md:gap-3 lg:grid-cols-[0.68fr_2.62fr] lg:gap-4 lg:px-10 ${verticalRhythm}`}>
        <div className="flex flex-col justify-between border-l border-accent-soft pl-3">
          <div>
            <p className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-accent-soft after:h-px after:w-6 after:bg-accent/70 after:content-['']">
              {eyebrow}
            </p>
            <h2 className="mt-1.5 text-[1.45rem] font-semibold leading-[0.96] md:text-[1.05rem] lg:text-[1.28rem]">
              {content.title}
            </h2>
          </div>
          <Link
            href={href}
            className="mt-1 inline-flex min-h-6 items-center self-start text-[9px] font-semibold text-accent-soft transition-colors hover:text-ivory motion-reduce:transition-none"
          >
            {content.linkLabel} →
          </Link>
        </div>
        <div className="min-w-0 md:border-l md:border-border md:pl-3">{children}</div>
      </div>
    </section>
  );
}
