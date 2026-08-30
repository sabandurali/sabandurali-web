import Image from "next/image";
import type { AboutContent } from "@/content/homeContent";

type AboutProps = {
  id: string;
  content: AboutContent;
};

export default function About({ id, content }: AboutProps) {
  return (
    <section id={id} className="scroll-mt-24 border-y border-[var(--accent-border-soft)] bg-ivory text-ink">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10 lg:py-28">
        <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
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

          <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start">
            <div className="max-w-3xl space-y-6 text-lg leading-8 text-muted-dark">
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
            <Image
              src={content.imageSrc ?? "/brand/saban-durali-profile.jpg"}
              alt={content.imageAlt}
              width={320}
              height={360}
              sizes="(min-width: 640px) 220px, 100vw"
              className="h-auto w-full max-w-[280px] justify-self-center border border-[var(--accent-border-soft)] object-cover object-top sm:max-w-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
