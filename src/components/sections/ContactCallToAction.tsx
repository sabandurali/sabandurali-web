import Link from "next/link";
import type { HomeContactCallToActionContent } from "@/content/homeContent";

type ContactCallToActionProps = {
  content: HomeContactCallToActionContent;
  href: string;
};

export default function ContactCallToAction({
  content,
  href,
}: ContactCallToActionProps) {
  return (
    <section className="border-y border-[var(--accent-border-soft)] bg-background-deep">
      <div className="mx-auto max-w-[1440px] px-5 py-3.5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3 border border-border bg-surface/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-4">
          <div className="max-w-4xl sm:flex sm:items-baseline sm:gap-5">
            <h2 className="shrink-0 font-serif text-xl font-semibold tracking-tight text-ivory sm:text-2xl">
              {content.title}
            </h2>
            <p className="mt-1 text-[10px] leading-4 text-muted sm:mt-0 sm:text-[11px]">
              {content.description}
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex min-h-8 items-center justify-center bg-accent-soft px-4 py-1.5 text-[10px] font-semibold text-background transition-colors hover:bg-ivory motion-reduce:transition-none sm:shrink-0"
          >
            {content.buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
