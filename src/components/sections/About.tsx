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
        <div className="mx-auto grid max-w-[1440px] grid-cols-[5rem_1fr] gap-4 px-5 py-4 sm:grid-cols-[6rem_1fr] sm:px-8 md:min-h-[8.5rem] md:grid-cols-[6.5rem_1.2fr_1fr] md:items-center md:gap-5 md:py-4 lg:gap-6 lg:px-10">
          <div className="w-20 border border-[var(--accent-border-soft)] bg-ivory-soft p-1 sm:w-24 md:w-[6.5rem]">
            <Image
              src={content.imageSrc ?? "/brand/saban-durali-profile.jpg"}
              alt={content.imageAlt}
              width={480}
              height={600}
              sizes="104px"
              className="aspect-square h-auto w-full object-cover object-top"
            />
          </div>

          <div className="md:border-l md:border-ink/20 md:pl-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-accent">
              {content.label}
            </p>
            <h2 className="mt-1.5 font-serif text-2xl font-semibold leading-none text-ink">
              {content.titleLines.join(" ")}
            </h2>
            <p className="mt-1.5 line-clamp-2 max-w-2xl text-[10px] leading-4 text-muted-dark lg:line-clamp-1">
              {content.paragraphs[0]}
            </p>
            {content.linkLabel && content.linkHref && (
              <a
                href={content.linkHref}
                className="mt-1 inline-flex min-h-7 items-center text-[10px] font-semibold text-accent hover:text-ink"
              >
                {content.linkLabel} →
              </a>
            )}
          </div>

          <p className="col-span-2 border-l-2 border-accent pl-4 font-serif text-base leading-snug text-ink md:col-span-1 md:border-l md:border-ink/20 lg:text-lg">
            Bilgi, paylaşıldığında büyür. Analiz, doğru sorularla başlar. Değer,
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
