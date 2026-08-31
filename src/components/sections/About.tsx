import Image from "next/image";
import type { AboutContent } from "@/content/homeContent";

type AboutProps = {
  id: string;
  content: AboutContent;
};

export default function About({ id, content }: AboutProps) {
  return (
    <section id={id} className="scroll-mt-24 border-y border-[var(--accent-border-soft)] bg-ivory text-ink">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="grid items-start gap-6 lg:grid-cols-[0.34fr_1fr_0.76fr] lg:gap-8">
          <div className="order-2 lg:order-1">
            <div className="w-[42vw] max-w-[210px] border border-[var(--accent-border-soft)] bg-ivory-soft p-2 lg:w-full">
              <Image
                src={content.imageSrc ?? "/brand/saban-durali-profile.jpg"}
                alt={content.imageAlt}
                width={480}
                height={600}
                sizes="(min-width: 1024px) 24vw, (min-width: 640px) 320px, 100vw"
                className="aspect-[4/5] h-auto w-full object-cover object-top"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
              {content.label}
            </p>
            <h2 className="mt-4 text-[2.4rem] font-semibold leading-[0.96] text-ink sm:mt-5 sm:text-5xl">
              {content.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <div className="order-3">
            <div className="max-w-3xl space-y-4 text-[15px] leading-6 text-muted-dark sm:text-base sm:leading-7">
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
            <p className="mt-5 border-l-2 border-accent pl-4 font-serif text-xl leading-snug text-ink">Bilgi, paylaşıldığında büyür. Analiz, doğru sorularla başlar. Değer, tutarlılıkla oluşur.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
