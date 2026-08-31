import Image from "next/image";
import type { AboutContent } from "@/content/homeContent";

type AboutProps = {
  id: string;
  content: AboutContent;
};

export default function About({ id, content }: AboutProps) {
  return (
    <section id={id} className="scroll-mt-24 border-y border-[var(--accent-border-soft)] bg-ivory text-ink">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14 lg:px-10 lg:py-20">
        <div className="grid items-start gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
              {content.label}
            </p>
            <h2 className="mt-4 text-[2.65rem] font-semibold leading-none text-ink sm:mt-6 sm:text-6xl">
              {content.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_260px] sm:items-start sm:gap-9">
            <div className="max-w-3xl space-y-4 text-[15px] leading-6 text-muted-dark sm:space-y-6 sm:text-lg sm:leading-8">
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
              sizes="(min-width: 640px) 260px, 62vw"
              className="h-auto w-full max-w-[190px] justify-self-center border border-[var(--accent-border-soft)] object-cover object-top sm:max-w-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
