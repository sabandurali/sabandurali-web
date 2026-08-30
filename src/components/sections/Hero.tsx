import type { HeroContent, HomeAnchors } from "@/content/homeContent";

type HeroProps = {
  anchors: HomeAnchors;
  content: HeroContent;
};

export default function Hero({ anchors, content }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-background">
      <div aria-hidden="true" className="absolute inset-y-0 right-[8%] -z-10 hidden w-[42%] grid-cols-4 gap-px opacity-70 lg:grid">
        <span className="border-x border-border/60 bg-white/[0.02]" />
        <span className="border-r border-border/60 bg-surface/30" />
        <span className="border-r border-border/60 bg-black/15" />
        <span className="border-r border-border/60 bg-surface/20" />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-94px)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:px-10 lg:py-24">
        <div className="min-w-0 border-l-2 border-accent-strong pl-5 sm:pl-7">
          {content.eyebrow && (
            <p className="mb-6 text-xs font-medium uppercase leading-6 tracking-[0.18em] text-accent-soft sm:text-sm sm:tracking-[0.22em]">
              {content.eyebrow}
            </p>
          )}

          <h1 className="max-w-4xl font-serif text-[2.65rem] font-medium leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-[76px]">
            {content.titleLines.map((line, index) => (
              <span
                key={`${line.text}-${index}`}
                className={`block ${line.accent ? "text-accent-soft" : ""}`}
              >
                {line.text}
                {index < content.titleLines.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="mt-8 max-w-xl text-base leading-8 text-muted sm:text-lg">
            {content.description}
          </p>

          <div className="mt-10 flex flex-col gap-4 min-[360px]:flex-row min-[360px]:flex-wrap">
            <a
              href={content.primaryActionHref ?? `#${anchors.work}`}
              className="bg-accent px-7 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#394a86] motion-reduce:transition-none"
            >
              {content.primaryAction}
            </a>

            <a
              href={content.secondaryActionHref ?? `#${anchors.about}`}
              className="border border-ivory/40 px-7 py-3.5 text-center text-sm font-medium text-ivory transition-colors hover:border-accent-soft hover:bg-white/5 motion-reduce:transition-none"
            >
              {content.secondaryAction}
            </a>
          </div>

        </div>

        <aside className="border border-border bg-surface/80 p-7 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">
            {content.goalsLabel}
          </p>

          {content.goals.map((goal, index) => (
            <div key={goal.label}>
              {index > 0 && <div className="my-7 h-px bg-border" />}
              <div className={index === 0 ? "mt-7" : undefined}>
                <p className="text-4xl font-semibold tracking-tight text-white">
                  {goal.value}
                </p>
                <p className="mt-1 text-sm text-muted">{goal.label}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}
