import type { HeroContent, HomeAnchors } from "@/content/homeContent";

type HeroProps = {
  anchors: HomeAnchors;
  content: HeroContent;
};

export default function Hero({ anchors, content }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_28%_42%,rgba(184,132,82,0.12),transparent_34%),linear-gradient(115deg,transparent_0%,transparent_47%,rgba(184,132,82,0.06)_47%,rgba(184,132,82,0.06)_63%,transparent_63%)]" />
      <div aria-hidden="true" className="absolute inset-y-0 right-[8%] -z-10 hidden w-[42%] grid-cols-4 gap-px opacity-70 lg:grid">
        <span className="border-x border-border/50 bg-black/10" />
        <span className="border-r border-border/40 bg-surface/20" />
        <span className="border-r border-border/50 bg-black/20" />
        <span className="border-r border-border/30 bg-surface/10" />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-94px)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-24">
        <div className="min-w-0">
          <p className="mb-6 text-xs font-medium uppercase leading-6 tracking-[0.18em] text-accent sm:text-sm sm:tracking-[0.22em]">
            {content.eyebrow}
          </p>

          <h1 className="max-w-4xl font-serif text-[2.65rem] font-medium leading-[1.08] tracking-[-0.035em] text-ivory sm:text-6xl lg:text-[72px]">
            {content.titleLines.map((line) => (
              <span
                key={line.text}
                className={`block ${line.accent ? "text-accent-strong" : ""}`}
              >
                {line.text}
              </span>
            ))}
          </h1>

          <p className="mt-8 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            {content.description}
          </p>

          <div className="mt-10 flex flex-col gap-4 min-[360px]:flex-row min-[360px]:flex-wrap">
            <a
              href={`#${anchors.work}`}
              className="rounded-md bg-accent px-7 py-3.5 text-center text-sm font-medium text-ink transition hover:bg-accent-strong"
            >
              {content.primaryAction}
            </a>

            <a
              href={`#${anchors.about}`}
              className="rounded-md border border-ivory/40 px-7 py-3.5 text-center text-sm font-medium text-ivory transition hover:border-accent hover:bg-surface"
            >
              {content.secondaryAction}
            </a>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-black/25 p-7 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-8">
          <p className="text-sm text-muted">{content.goalsLabel}</p>

          {content.goals.map((goal, index) => (
            <div key={goal.label}>
              {index > 0 && <div className="my-7 h-px bg-border" />}
              <div className={index === 0 ? "mt-7" : undefined}>
                <p className="text-4xl font-semibold tracking-tight text-accent">
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
