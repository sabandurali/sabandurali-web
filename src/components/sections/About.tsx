import Image from "next/image";
import type { AboutContent } from "@/content/homeContent";

type AboutProps = {
  id: string;
  content: AboutContent;
};

export default function About({ id, content }: AboutProps) {
  return (
    <section
      id={id}
      className="scroll-mt-24 bg-ivory text-ink"
    >
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
        <div className="grid items-start gap-10 lg:grid-cols-[0.65fr_1fr_320px] lg:gap-12">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
              {content.label}
            </p>
            <h2 className="mt-6 text-5xl font-semibold leading-none text-ink sm:text-6xl">
              {content.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <Image
            src={content.imageSrc ?? "/brand/saban-durali-profile.jpg"}
            alt={content.imageAlt}
            width={320}
            height={360}
            className="order-2 h-auto w-full max-w-[360px] justify-self-center rounded-xl border border-border object-cover object-top lg:order-3 lg:-mt-4 lg:h-[360px] lg:w-[320px] lg:max-w-none lg:justify-self-end lg:self-start"
          />

          <div className="order-3 max-w-3xl space-y-6 text-lg leading-8 text-muted-dark lg:order-2">
            {content.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {content.linkLabel && content.linkHref && (
              <a
                href={content.linkHref}
                className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-ink motion-reduce:transition-none"
              >
                {content.linkLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
