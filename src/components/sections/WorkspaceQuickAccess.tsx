import { AreaIcon } from "./FocusAreas";
import type { FocusAreasContent } from "@/content/homeContent";

export default function WorkspaceQuickAccess({
  content,
}: {
  content: FocusAreasContent;
}) {
  const expertise = [
    { title: "Araştırmacı", description: "Veriye dayalı analiz ve yorum", icon: "research" as const },
    { title: "Gayrimenkul Uzmanı", description: "İstanbul odağında rehberler ve analizler", icon: "city" as const },
    { title: "Öğrenen & Öğreten", description: "Sürekli öğrenme ve bilgiyi paylaşma", icon: "book" as const },
    { title: "Fotoğrafçı", description: "İstanbul'u belgeleyen görsel arşiv", icon: "network" as const },
    { title: "Teknoloji Meraklısı", description: "Yapay zekâ ve dijital çözümler", icon: "technology" as const },
  ];

  return (
    <section aria-label={content.label} className="relative z-20 -mt-3 bg-transparent px-4 py-5 sm:-mt-8 sm:px-6 sm:py-7 lg:py-0">
      <div className="mx-auto grid max-w-[1400px] overflow-hidden rounded-2xl border border-[var(--accent-border-soft)] bg-[#fbfaf7] sm:grid-cols-2 lg:grid-cols-5">
        {expertise.map((item, index) => (
          <div key={item.title} className="flex min-w-0 items-center gap-2.5 border-b border-[var(--accent-border-soft)] px-4 py-3.5 last:border-b-0 sm:odd:border-r sm:px-5 sm:py-4 lg:border-b-0 lg:border-r lg:last:border-r-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft/20 text-accent-deep">
              <AreaIcon icon={item.icon} className="size-3.5" />
            </div>
            <div>
              <h2 className="font-serif text-[15px] font-semibold leading-tight text-ink">{item.title}</h2>
              <p className="mt-0.5 text-[11px] leading-4 text-muted-dark">{item.description}</p>
            </div>
            <span aria-hidden="true" className="ml-auto text-xs font-semibold text-accent">0{index + 1}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
