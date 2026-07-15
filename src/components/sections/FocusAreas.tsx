const focusAreas = [
  {
    title: "Kitap İncelemeleri",
    description:
      "Okuduğum kitaplardan çıkardığım fikirler, eleştiriler ve uygulanabilir notlar.",
  },
  {
    title: "İstanbul Analizleri",
    description:
      "İlçe, mahalle, ulaşım, dönüşüm ve gayrimenkul piyasası üzerine araştırmalar.",
  },
  {
    title: "Yapay Zekâ",
    description:
      "Yapay zekâ araçları, iş modelleri ve günlük hayatta uygulanabilir kullanım rehberleri.",
  },
  {
    title: "Satış ve Müzakere",
    description:
      "Güven oluşturma, ikna, müşteri yönetimi ve profesyonel müzakere sistemleri.",
  },
];

export default function FocusAreas() {
  return (
    <section id="alanlar" className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
      <div className="mb-14 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.22em] text-black/45">
          Ana çalışma alanları
        </p>

        <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
          Birbirini besleyen bilgi ve uzmanlık alanları.
        </h2>
      </div>

      <div className="grid gap-px overflow-hidden rounded-3xl border border-black/10 bg-black/10 md:grid-cols-2">
        {focusAreas.map((area) => (
          <article
            key={area.title}
            className="bg-[#f5f3ee] p-6 transition hover:bg-white md:min-h-64 md:p-8"
          >
            <h3 className="text-2xl font-semibold tracking-tight">
              {area.title}
            </h3>

            <p className="mt-5 max-w-lg leading-7 text-black/60">
              {area.description}
            </p>

            <p className="mt-10 text-sm font-medium">Yakında →</p>
          </article>
        ))}
      </div>
    </section>
  );
}
