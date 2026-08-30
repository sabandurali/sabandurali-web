import Image from "next/image";
import type { HeroContent, HomeAnchors } from "@/content/homeContent";

type HeroProps = {
  anchors: HomeAnchors;
  content: HeroContent;
};

export default function Hero({ anchors, content }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-[#0a0f18]">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_50%,rgba(209,178,111,0.12),transparent_34%)]" />
      <div className="mx-auto grid max-w-[1440px] items-stretch lg:min-h-[33.5rem] lg:grid-cols-[48fr_52fr]">
        <div className="relative z-10 flex min-w-0 items-center px-5 py-14 sm:px-10 sm:py-20 lg:pb-5 lg:pl-[clamp(3rem,6vw,6.5rem)] lg:pr-[clamp(2rem,3.5vw,4rem)] lg:pt-5">
          <div className="w-full max-w-[42rem] border-l border-accent-soft pl-5 sm:pl-7">
          {content.eyebrow && (
            <p className="mb-6 text-xs font-medium uppercase leading-6 tracking-[0.18em] text-accent-soft sm:text-sm sm:tracking-[0.2em]">
              {content.eyebrow}
            </p>
          )}

          <h1 className="max-w-4xl font-serif text-[2.65rem] font-medium leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-[clamp(3.5rem,4vw,4.75rem)]">
            {content.titleLines.map((line, index) => (
              <span key={`${line.text}-${index}`} className={`block ${line.accent ? "text-accent-soft" : ""}`}>
                {line.text}
                {index < content.titleLines.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="mt-8 max-w-xl text-base leading-8 text-muted sm:text-lg lg:line-clamp-3">
            {content.description}
          </p>

          <div className="mt-10 flex flex-col gap-4 min-[360px]:flex-row min-[360px]:flex-wrap">
            <a href={content.primaryActionHref ?? `#${anchors.work}`} className="bg-accent-soft px-7 py-3.5 text-center text-sm font-semibold text-background transition-colors hover:bg-ivory motion-reduce:transition-none">
              {content.primaryAction} <span aria-hidden="true">→</span>
            </a>
            <a href={content.secondaryActionHref ?? `#${anchors.about}`} className="border border-ivory/40 px-7 py-3.5 text-center text-sm font-medium text-ivory transition-colors hover:border-accent-soft hover:bg-white/5 motion-reduce:transition-none">
              {content.secondaryAction} <span aria-hidden="true">→</span>
            </a>
          </div>
          </div>
        </div>

        <aside className="relative min-h-[18rem] overflow-hidden bg-black sm:min-h-[23rem] lg:min-h-0 lg:[clip-path:polygon(23%_0,100%_0,100%_100%,0_100%)]">
          <Image
            src="/brand/hero-istanbul-bogaz.jpg"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover object-center"
          />
          <div aria-hidden="true" className="absolute left-[23%] top-0 z-10 h-[112%] w-px origin-top -rotate-[20deg] bg-accent-soft/80" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(120deg,rgba(7,14,25,0.6),rgba(7,14,25,0.12)_48%,rgba(7,14,25,0.16)),radial-gradient(circle_at_76%_35%,rgba(209,178,111,0.12),transparent_30%)]" />
          <div className="absolute inset-x-[22%] bottom-0 h-[78%] overflow-hidden rounded-t-[7rem] sm:inset-x-[25%] sm:h-[82%] lg:left-[58%] lg:right-[7%] lg:bottom-0 lg:h-[68%]">
            <Image
              src="/brand/saban-durali-profile.jpg"
              alt="Şaban Durali portresi"
              fill
              priority
              sizes="(min-width: 1024px) 34vw, 82vw"
              className="object-contain object-bottom"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
