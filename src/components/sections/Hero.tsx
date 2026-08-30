import Image from "next/image";
import type { HeroContent, HomeAnchors } from "@/content/homeContent";

type HeroProps = {
  anchors: HomeAnchors;
  content: HeroContent;
};

export default function Hero({ anchors, content }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-background">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,var(--accent-hero-glow),transparent_32%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 sm:py-20 lg:min-h-[calc(100vh-78px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-14 lg:px-10 lg:py-16">
        <div className="min-w-0 border-l border-accent-soft pl-5 sm:pl-7">
          {content.eyebrow && (
            <p className="mb-6 text-xs font-medium uppercase leading-6 tracking-[0.18em] text-accent-soft sm:text-sm sm:tracking-[0.22em]">
              {content.eyebrow}
            </p>
          )}

          <h1 className="max-w-4xl font-serif text-[2.65rem] font-medium leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-[clamp(3.9rem,5.5vw,5.5rem)]">
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
              {content.primaryAction}
            </a>
            <a href={content.secondaryActionHref ?? `#${anchors.about}`} className="border border-ivory/40 px-7 py-3.5 text-center text-sm font-medium text-ivory transition-colors hover:border-accent-soft hover:bg-white/5 motion-reduce:transition-none">
              {content.secondaryAction}
            </a>
          </div>
        </div>

        <aside className="relative mx-auto w-full max-w-[520px] border border-border bg-surface p-3 shadow-2xl shadow-black/25 sm:p-4 lg:justify-self-end">
          <div className="relative aspect-[4/5] overflow-hidden bg-background">
            <Image
              src="/brand/saban-durali-profile.jpg"
              alt="Şaban Durali portresi"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover object-[50%_32%]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/75 to-transparent px-5 pb-5 pt-16 sm:px-7 sm:pb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">{content.goalsLabel}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
                {content.goals.map((goal) => (
                  <div key={goal.label}>
                    <p className="text-xl font-semibold tracking-tight text-ivory sm:text-2xl">{goal.value}</p>
                    <p className="mt-1 text-[11px] leading-4 text-muted">{goal.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
