import Image from "next/image";
import type { HeroContent, HomeAnchors } from "@/content/homeContent";

type HeroProps = {
  anchors: HomeAnchors;
  content: HeroContent;
};

export default function Hero({ anchors, content }: HeroProps) {
  const verifiedIntelligence = [
    ["39", "İlçe"],
    ["25", "Avrupa Yakası"],
    ["14", "Anadolu Yakası"],
    ["Bağımsız", "Yayın"],
  ] as const;

  return (
    <section className="relative min-h-[25rem] overflow-hidden border-b border-[var(--accent-border-soft)] bg-background-deep sm:min-h-[31rem] md:min-h-[22rem] lg:min-h-[15.5rem]">
      <Image
        src="/brand/hero-istanbul-bogaz.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,12,22,0.98)_0%,rgba(5,12,22,0.9)_42%,rgba(5,12,22,0.34)_75%,rgba(5,12,22,0.42)_100%),linear-gradient(0deg,rgba(5,12,22,0.62),transparent_58%)]" />
      <div className="relative mx-auto grid min-h-[25rem] max-w-[1440px] items-end gap-3 px-5 py-4 sm:min-h-[31rem] sm:gap-5 sm:px-8 sm:py-8 md:min-h-[22rem] md:grid-cols-[1fr_14rem] md:items-center md:gap-6 md:py-4 lg:min-h-[15.5rem] lg:grid-cols-[1fr_17rem] lg:gap-10 lg:px-10 lg:py-3">
        <div className="max-w-[44rem] border-l border-accent pl-4 sm:pl-5">
          {content.eyebrow && (
            <p className="mb-2 text-[9px] font-semibold uppercase leading-4 tracking-[0.2em] text-accent-soft sm:text-[10px]">
              {content.eyebrow}
            </p>
          )}

          <h1 className="font-serif text-[1.8rem] font-medium leading-[1.01] tracking-[-0.035em] text-white sm:text-[2.45rem] md:text-[2.1rem] lg:text-[2.15rem]">
            {content.titleLines.map((line, index) => (
              <span key={`${line.text}-${index}`} className={`block ${line.accent ? "text-accent-soft" : ""}`}>
                {line.text}
                {index < content.titleLines.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="mt-2 max-w-[34rem] text-[10px] leading-4 text-muted sm:mt-3 sm:text-sm sm:leading-6 lg:line-clamp-2">
            {content.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
            <a href={content.primaryActionHref ?? `#${anchors.work}`} className="inline-flex min-h-9 items-center bg-accent-soft px-4 py-2 text-center text-[11px] font-semibold text-background transition-colors hover:bg-ivory motion-reduce:transition-none">
              {content.primaryAction} <span aria-hidden="true">→</span>
            </a>
            <a href={content.secondaryActionHref ?? `#${anchors.about}`} className="inline-flex min-h-9 items-center border border-ivory/35 px-4 py-2 text-center text-[11px] font-medium text-ivory transition-colors hover:border-accent-soft hover:bg-white/5 motion-reduce:transition-none">
              {content.secondaryAction} <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <aside className="border border-white/20 bg-[#081220]/90 p-2 backdrop-blur-[2px] sm:p-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-accent-soft">İstanbul verileri</p>
          <dl className="mt-2 grid grid-cols-2 border-l border-t border-white/15">
            {verifiedIntelligence.map(([value, label]) => (
              <div key={label} className="min-h-10 border-b border-r border-white/15 p-2 sm:min-h-14 sm:p-2.5">
                <dt className="font-serif text-base leading-none text-ivory sm:text-lg">{value}</dt>
                <dd className="mt-1 text-[9px] leading-3 text-muted">{label}</dd>
              </div>
            ))}
            </dl>
        </aside>
      </div>
    </section>
  );
}
