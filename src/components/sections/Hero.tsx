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
      <div className="mx-auto grid max-w-[1440px] items-stretch lg:min-h-[calc(100vh-88px)] lg:grid-cols-[45fr_55fr]">
        <div className="relative z-10 flex min-w-0 items-center px-5 py-14 sm:px-10 sm:py-20 lg:px-[clamp(3rem,7vw,8rem)] lg:py-16">
          <div className="max-w-[38rem] border-l border-accent-soft pl-5 sm:pl-7">
          {content.eyebrow && (
            <p className="mb-6 text-xs font-medium uppercase leading-6 tracking-[0.18em] text-accent-soft sm:text-sm sm:tracking-[0.2em]">
              {content.eyebrow}
            </p>
          )}

          <h1 className="max-w-4xl font-serif text-[2.65rem] font-medium leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-[clamp(3.6rem,4.7vw,5.25rem)]">
            {content.titleLines.map((line, index) => (
              <span key={`${line.text}-${index}`} className={`block ${line.accent ? "text-accent-soft" : ""}`}>
                {line.text}
                {index < content.titleLines.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="mt-8 max-w-xl text-base leading-8 text-muted sm:text-lg">
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

        <aside className="relative min-h-[18rem] overflow-hidden bg-black sm:min-h-[23rem] lg:min-h-0">
          <div aria-hidden="true" className="absolute -left-12 top-[-8%] z-10 h-[120%] w-px rotate-[11deg] bg-accent-soft/80" />
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_68%_58%,rgba(209,178,111,0.13),transparent_26%),linear-gradient(120deg,rgba(11,18,32,0.88),transparent_45%)]" />
          <div className="absolute inset-x-[22%] bottom-0 h-[78%] sm:inset-x-[25%] sm:h-[82%] lg:left-[25%] lg:right-[15%] lg:bottom-[4%] lg:h-[62%]">
            <Image
              src="/brand/saban-durali-profile.jpg"
              alt="Şaban Durali portresi"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 82vw"
              className="object-contain object-bottom"
            />
          </div>
        </aside>
      </div>
    </section>
  );
}
