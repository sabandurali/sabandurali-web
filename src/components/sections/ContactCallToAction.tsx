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
      <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8 md:min-h-32 lg:px-10">
        <div className="flex min-h-[5rem] flex-col justify-center gap-4 border border-border bg-surface/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:px-7">
          <div className="max-w-4xl sm:flex sm:items-baseline sm:gap-5">
            <h2 className="shrink-0 font-serif text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
              {content.title}
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted sm:mt-0 sm:text-sm sm:leading-6">
              {content.description}
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex min-h-11 items-center justify-center bg-accent-soft px-6 py-2.5 text-xs font-semibold text-background transition-colors hover:bg-ivory motion-reduce:transition-none sm:shrink-0"
          >
            {content.buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
