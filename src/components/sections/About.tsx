import Image from "next/image";
import type { AboutContent } from "@/content/homeContent";

type AboutProps = {
  id: string;
  content: AboutContent;
  compact?: boolean;
};

export default function About({ id, content, compact = false }: AboutProps) {
  if (compact) {
    return (
      <section
        id={id}
        className="scroll-mt-14 border-y border-ink/20 bg-ivory text-ink"
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-[7rem_1fr] gap-4 px-5 py-7 sm:grid-cols-[9rem_1fr] sm:px-8 md:min-h-[13.5rem] md:grid-cols-[11.25rem_1.2fr_1fr] md:items-center md:gap-8 md:py-6 lg:gap-10 lg:px-10">
          <div className="w-28 border border-[var(--accent-border-soft)] bg-ivory-soft p-1.5 sm:w-36 md:w-[11.25rem] md:p-2">
            <Image
              src={content.imageSrc ?? "/brand/saban-durali-profile.jpg"}
              alt={content.imageAlt}
              width={480}
              height={600}
              sizes="(min-width: 768px) 180px, 144px"
              className="aspect-[4/5] h-auto w-full object-cover object-top"
            />
          </div>

          <div className="md:border-l md:border-ink/20 md:pl-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              {content.label}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-none text-ink lg:text-4xl">
              {content.titleLines.join(" ")}
            </h2>
            <p className="mt-4 line-clamp-4 max-w-2xl text-xs leading-5 text-muted-dark md:line-clamp-3 lg:text-sm lg:leading-6">
              {content.paragraphs[0]}
            </p>
            {content.linkLabel && content.linkHref && (
              <a
                href={content.linkHref}
                className="mt-4 inline-flex min-h-9 items-center text-xs font-semibold text-accent hover:text-ink"
              >
                {content.linkLabel} →
              </a>
            )}
          </div>

          <p className="col-span-2 border-l-2 border-accent pl-5 font-serif text-lg leading-snug text-ink md:col-span-1 md:border-l md:border-ink/20 md:pl-8 lg:text-2xl lg:leading-snug">
            Bilgi, paylaşıldığında büyür.<br />Analiz, doğru sorularla başlar.<br />Değer,
            tutarlılıkla oluşur.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="scroll-mt-24 border-y border-[var(--accent-border-soft)] bg-ivory text-ink">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="grid items-start gap-6 lg:grid-cols-[0.34fr_1fr_0.76fr] lg:gap-8">
          <div className="order-2 lg:order-1">
            <div className="w-[42vw] max-w-[210px] border border-[var(--accent-border-soft)] bg-ivory-soft p-2 lg:w-full">
              <Image src={content.imageSrc ?? "/brand/saban-durali-profile.jpg"} alt={content.imageAlt} width={480} height={600} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 320px, 100vw" className="aspect-[4/5] h-auto w-full object-cover object-top" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">{content.label}</p>
            <h2 className="mt-4 text-[2.4rem] font-semibold leading-[0.96] text-ink sm:mt-5 sm:text-5xl">
              {content.titleLines.map((line) => <span key={line} className="block">{line}</span>)}
            </h2>
          </div>
          <div className="order-3">
            <div className="max-w-3xl space-y-4 text-[15px] leading-6 text-muted-dark sm:text-base sm:leading-7">
              {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {content.linkLabel && content.linkHref && <a href={content.linkHref} className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:text-ink motion-reduce:transition-none">{content.linkLabel}</a>}
            </div>
            <p className="mt-5 border-l-2 border-accent pl-4 font-serif text-xl leading-snug text-ink">Bilgi, paylaşıldığında büyür. Analiz, doğru sorularla başlar. Değer, tutarlılıkla oluşur.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
