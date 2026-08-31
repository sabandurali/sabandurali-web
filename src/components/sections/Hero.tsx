import Image from "next/image";
import type { HeroContent, HomeAnchors } from "@/content/homeContent";

type HeroProps = {
  anchors: HomeAnchors;
  content: HeroContent;
};

export default function Hero({ anchors, content }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background-deep">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_50%,rgba(209,178,111,0.12),transparent_34%)]" />
      <div className="mx-auto grid max-w-[1440px] items-stretch lg:min-h-[30rem] lg:grid-cols-[47fr_53fr]">
        <div className="relative z-10 flex min-w-0 items-center px-5 py-9 sm:px-8 sm:py-12 lg:pb-6 lg:pl-[clamp(2.5rem,5vw,5rem)] lg:pr-[clamp(2rem,3vw,3.5rem)] lg:pt-6">
          <div className="w-full max-w-[38rem] border-l border-accent-soft pl-5 sm:pl-6">
          {content.eyebrow && (
            <p className="mb-3 text-[10px] font-medium uppercase leading-5 tracking-[0.16em] text-accent-soft sm:mb-4 sm:text-xs sm:leading-5 sm:tracking-[0.2em]">
              {content.eyebrow}
            </p>
          )}

          <h1 className="max-w-4xl font-serif text-[2.15rem] font-medium leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-[clamp(2.9rem,3.35vw,3.85rem)]">
            {content.titleLines.map((line, index) => (
              <span key={`${line.text}-${index}`} className={`block ${line.accent ? "text-accent-soft" : ""}`}>
                {line.text}
                {index < content.titleLines.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-6 text-muted sm:text-base sm:leading-7 lg:line-clamp-2">
            {content.description}
          </p>

          <div className="mt-6 flex flex-col gap-2 min-[360px]:flex-row min-[360px]:flex-wrap">
            <a href={content.primaryActionHref ?? `#${anchors.work}`} className="bg-accent-soft px-5 py-2.5 text-center text-xs font-semibold text-background transition-colors hover:bg-ivory motion-reduce:transition-none sm:px-6 sm:py-3 sm:text-sm">
              {content.primaryAction} <span aria-hidden="true">→</span>
            </a>
            <a href={content.secondaryActionHref ?? `#${anchors.about}`} className="border border-ivory/40 px-5 py-2.5 text-center text-xs font-medium text-ivory transition-colors hover:border-accent-soft hover:bg-white/5 motion-reduce:transition-none sm:px-6 sm:py-3 sm:text-sm">
              {content.secondaryAction} <span aria-hidden="true">→</span>
            </a>
          </div>
          </div>
        </div>

        <aside className="relative min-h-[15rem] overflow-hidden bg-black sm:min-h-[19rem] lg:min-h-0 lg:[clip-path:polygon(12%_0,100%_0,100%_100%,0_100%)]">
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
          <div className="absolute bottom-4 left-4 right-4 z-20 border border-white/20 bg-[#081220]/90 p-3 sm:bottom-5 sm:left-6 sm:right-auto sm:w-[18rem] sm:p-4 lg:left-[18%]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-soft">{content.goalsLabel}</p>
            <dl className="mt-3 grid grid-cols-3 divide-x divide-white/15">
              {content.goals.map((goal) => <div key={goal.label} className="min-w-0 px-2 first:pl-0 last:pr-0"><dt className="font-serif text-2xl leading-none text-ivory sm:text-3xl">{goal.value}</dt><dd className="mt-2 text-[10px] leading-4 text-muted">{goal.label}</dd></div>)}
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}
