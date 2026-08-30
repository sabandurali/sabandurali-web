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
    <section className="border-t border-[var(--accent-border-soft)] bg-ivory-soft">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-16">
        <div className="border border-border bg-background p-8 shadow-xl shadow-black/10 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold tracking-tight text-ivory sm:text-5xl">
              {content.title}
            </h2>
            <p className="mt-5 text-base leading-7 text-muted sm:text-lg">
              {content.description}
            </p>
          </div>
          <Link
            href={href}
            className="mt-8 inline-flex min-h-11 items-center justify-center bg-accent-soft px-7 py-3.5 text-sm font-semibold text-background transition-colors hover:bg-ivory motion-reduce:transition-none lg:mt-0 lg:shrink-0"
          >
            {content.buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
