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
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div className="border border-border bg-background p-5 sm:p-6 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-3xl">
            <h2 className="text-[2rem] font-semibold tracking-tight text-ivory sm:text-4xl">
              {content.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted sm:mt-5 sm:text-lg sm:leading-7">
              {content.description}
            </p>
          </div>
          <Link
            href={href}
            className="mt-6 inline-flex min-h-10 items-center justify-center bg-accent-soft px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-ivory motion-reduce:transition-none sm:mt-8 sm:min-h-11 sm:px-7 sm:py-3.5 lg:mt-0 lg:shrink-0"
          >
            {content.buttonLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
