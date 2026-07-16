const focusAreas = [
  {
    icon: "book",
    title: "Kitap İncelemeleri",
    description:
      "Okuduğum kitaplardan çıkardığım fikirler, eleştiriler ve uygulanabilir notlar.",
  },
  {
    icon: "city",
    title: "İstanbul Analizleri",
    description:
      "İlçe, mahalle, ulaşım, dönüşüm ve gayrimenkul piyasası üzerine araştırmalar.",
  },
  {
    icon: "network",
    title: "Yapay Zekâ",
    description:
      "Yapay zekâ araçları, iş modelleri ve günlük hayatta uygulanabilir kullanım rehberleri.",
  },
  {
    icon: "handshake",
    title: "Satış ve Müzakere",
    description:
      "Güven oluşturma, ikna, müşteri yönetimi ve profesyonel müzakere sistemleri.",
  },
];

function AreaIcon({ icon }: { icon: string }) {
  const commonProps = {
    "aria-hidden": true,
    className: "size-6",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.5,
    viewBox: "0 0 24 24",
  };

  if (icon === "book") {
    return (
      <svg {...commonProps}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a1 1 0 0 1 1 1v16a2 2 0 0 0-2-2H4V5.5Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13a1 1 0 0 0-1 1v16a2 2 0 0 1 2-2h6V5.5Z" />
      </svg>
    );
  }

  if (icon === "city") {
    return (
      <svg {...commonProps}>
        <path d="M3 21h18M6 21V10h5v11M14 21V4h4v17M8 13h1M8 16h1M16 7h.01M16 10h.01M16 13h.01M16 16h.01" />
      </svg>
    );
  }

  if (icon === "network") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="17" r="2" />
        <circle cx="19" cy="17" r="2" />
        <circle cx="12" cy="13" r="2" />
        <path d="m12 7v4M10.3 14 6.7 16M13.7 14l3.6 2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="m8.5 12.5 3 3a2 2 0 0 0 2.8 0l4.2-4.2M3 8.5l4-3 4 3-5 5-3-2.5v-2.5ZM21 8.5l-4-3-3.5 2.6M7.5 14.5l2 2M5.5 16.5l2 2M16.5 14.5l-2 2" />
    </svg>
  );
}

export default function FocusAreas() {
  return (
    <section id="alanlar" className="bg-ivory-soft text-ink">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="mb-14 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.22em] text-muted-dark">
            Ana çalışma alanları
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
            Birbirini besleyen bilgi ve uzmanlık alanları.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {focusAreas.map((area) => (
            <article
              key={area.title}
              className="rounded-xl border border-[rgba(184,132,82,0.24)] bg-ivory p-6 shadow-[0_8px_24px_rgba(18,22,25,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(184,132,82,0.55)] md:min-h-72"
            >
              <div className="flex size-12 items-center justify-center rounded-full border border-accent bg-ink text-accent-soft">
                <AreaIcon icon={area.icon} />
              </div>

              <h3 className="mt-6 text-2xl font-semibold tracking-tight">
                {area.title}
              </h3>

              <p className="mt-5 max-w-lg leading-7 text-muted-dark">
                {area.description}
              </p>

              <p className="mt-10 text-sm font-medium">Yakında →</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
