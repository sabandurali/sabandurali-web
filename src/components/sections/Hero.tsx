import Image from "next/image";
import type { HeroContent, HomeAnchors } from "@/content/homeContent";

type HeroProps = {
  anchors: HomeAnchors;
  content: HeroContent;
};

export default function Hero({ anchors, content }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[#0a0f18]">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_50%,rgba(209,178,111,0.12),transparent_34%)]" />
      <div className="mx-auto grid max-w-[1440px] items-stretch lg:min-h-[35rem] lg:grid-cols-[47fr_53fr]">
        <div className="relative z-10 flex min-w-0 items-center px-5 py-11 sm:px-10 sm:py-16 lg:pb-8 lg:pl-[clamp(3rem,6vw,6.5rem)] lg:pr-[clamp(2rem,3.5vw,4rem)] lg:pt-8">
          <div className="w-full max-w-[42rem] border-l border-accent-soft pl-5 sm:pl-7">
          {content.eyebrow && (
            <p className="mb-4 text-[11px] font-medium uppercase leading-5 tracking-[0.16em] text-accent-soft sm:mb-5 sm:text-sm sm:leading-6 sm:tracking-[0.2em]">
              {content.eyebrow}
            </p>
          )}

          <h1 className="max-w-4xl font-serif text-[2.3rem] font-medium leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl lg:text-[clamp(3.25rem,3.8vw,4.35rem)]">
            {content.titleLines.map((line, index) => (
              <span key={`${line.text}-${index}`} className={`block ${line.accent ? "text-accent-soft" : ""}`}>
                {line.text}
                {index < content.titleLines.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-6 text-muted sm:text-lg sm:leading-8 lg:line-clamp-3">
            {content.description}
          </p>

          <div className="mt-7 flex flex-col gap-3 min-[360px]:flex-row min-[360px]:flex-wrap sm:mt-8">
            <a href={content.primaryActionHref ?? `#${anchors.work}`} className="bg-accent-soft px-5 py-3 text-center text-sm font-semibold text-background transition-colors hover:bg-ivory motion-reduce:transition-none sm:px-7 sm:py-3.5">
              {content.primaryAction} <span aria-hidden="true">→</span>
            </a>
            <a href={content.secondaryActionHref ?? `#${anchors.about}`} className="border border-ivory/40 px-5 py-3 text-center text-sm font-medium text-ivory transition-colors hover:border-accent-soft hover:bg-white/5 motion-reduce:transition-none sm:px-7 sm:py-3.5">
              {content.secondaryAction} <span aria-hidden="true">→</span>
            </a>
          </div>
          </div>
        </div>

        <aside className="relative min-h-[15rem] overflow-hidden bg-black sm:min-h-[21rem] lg:min-h-0 lg:[clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)]">
          <Image
            src="/brand/hero-istanbul-bogaz.jpg"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="z-0 object-cover object-center"
          />
          <div aria-hidden="true" className="absolute inset-0 z-10 bg-[linear-gradient(120deg,rgba(7,14,25,0.6),rgba(7,14,25,0.12)_48%,rgba(7,14,25,0.16)),radial-gradient(circle_at_76%_35%,rgba(209,178,111,0.12),transparent_30%)]" />
          <div aria-hidden="true" className="absolute left-[12%] top-0 z-30 hidden h-[112%] w-px origin-top -rotate-[9deg] bg-accent-soft/80 lg:block" />
        </aside>
      </div>
    </section>
  );
}
