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
    <section className="relative min-h-[25rem] overflow-hidden border-b border-[var(--accent-border-soft)] bg-background sm:min-h-[31rem] md:min-h-[29rem] lg:min-h-[32.5rem]">
      <Image
        src="/brand/hero-istanbul-bogaz.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[62%_center] sm:object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,12,22,0.98)_0%,rgba(5,12,22,0.88)_38%,rgba(5,12,22,0.24)_72%,rgba(5,12,22,0.34)_100%),linear-gradient(0deg,rgba(5,12,22,0.72),transparent_64%)]" />
      <div className="relative mx-auto grid min-h-[25rem] max-w-[1440px] items-end gap-3 px-5 py-4 sm:min-h-[31rem] sm:gap-5 sm:px-8 sm:py-8 md:min-h-[29rem] md:grid-cols-[1fr_15rem] md:items-center md:gap-8 md:py-8 lg:min-h-[32.5rem] lg:grid-cols-[1fr_20rem] lg:gap-14 lg:px-10 lg:py-9">
        <div className="max-w-[44rem] border-l border-accent pl-4 sm:pl-5">
          {content.eyebrow && (
            <p className="mb-2 text-[9px] font-semibold uppercase leading-4 tracking-[0.2em] text-accent-soft sm:text-[10px]">
              {content.eyebrow}
            </p>
          )}

          <h1 className="font-serif text-[1.8rem] font-medium leading-[0.98] tracking-[-0.04em] text-white sm:text-[2.6rem] md:text-[2.75rem] lg:text-[3.4rem]">
            {content.titleLines.map((line, index) => (
              <span key={`${line.text}-${index}`} className={`block ${line.accent ? "text-accent-soft" : ""}`}>
                {line.text}
                {index < content.titleLines.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="mt-3 max-w-[38rem] text-[11px] leading-5 text-muted sm:mt-5 sm:text-sm sm:leading-6 lg:text-base lg:leading-7">
            {content.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            <a href={content.primaryActionHref ?? `#${anchors.work}`} className="inline-flex min-h-10 items-center bg-accent-soft px-5 py-2.5 text-center text-xs font-semibold text-background transition-colors hover:bg-ivory motion-reduce:transition-none sm:min-h-11 sm:px-6">
              {content.primaryAction} <span aria-hidden="true">→</span>
            </a>
            <a href={content.secondaryActionHref ?? `#${anchors.about}`} className="inline-flex min-h-10 items-center border border-ivory/35 px-5 py-2.5 text-center text-xs font-medium text-ivory transition-colors hover:border-accent-soft hover:bg-white/5 motion-reduce:transition-none sm:min-h-11 sm:px-6">
              {content.secondaryAction} <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <aside className="border border-white/20 bg-[#081220]/90 p-3 backdrop-blur-[2px] sm:p-4 lg:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-soft">İstanbul verileri</p>
          <dl className="mt-3 grid grid-cols-2 border-l border-t border-white/15 lg:mt-4">
            {verifiedIntelligence.map(([value, label]) => (
              <div key={label} className="min-h-12 border-b border-r border-white/15 p-2.5 sm:min-h-16 sm:p-3 lg:min-h-[5.5rem] lg:p-4">
                <dt className="font-serif text-lg leading-none text-ivory sm:text-xl lg:text-2xl">{value}</dt>
                <dd className="mt-1.5 text-[9px] leading-3 text-muted lg:text-[10px]">{label}</dd>
              </div>
            ))}
            </dl>
        </aside>
      </div>
    </section>
  );
}
