export default function Hero() {
  return (
    <section className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:px-10">
      <div>
        <p className="mb-6 text-sm font-medium uppercase tracking-[0.22em] text-accent">
          Gayrimenkul · Kitaplar · Yapay Zekâ · Araştırma
        </p>

        <h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl lg:text-[86px]">
          Bilgiyi araştıran,
          <br />
          analiz eden ve
          <br />
          paylaşan bir platform.
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">
          İstanbul gayrimenkul piyasası, kitaplar, yapay zekâ, satış ve
          müzakere üzerine uzun vadeli ve güvenilir bir bilgi merkezi
          oluşturuyorum.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#alanlar"
            className="rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-surface transition hover:bg-accent-strong"
          >
            Çalışmaları keşfet
          </a>

          <a
            href="#hakkimda"
            className="rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            Hakkımda
          </a>
        </div>
      </div>

      <aside className="rounded-[2rem] border border-border bg-surface p-8 shadow-sm">
        <p className="text-sm text-muted">Platform hedefi</p>

        <div className="mt-7">
          <p className="text-4xl font-semibold tracking-tight text-accent">
            500+
          </p>
          <p className="mt-1 text-sm text-muted">kitap incelemesi</p>
        </div>

        <div className="my-7 h-px bg-border" />

        <div>
          <p className="text-4xl font-semibold tracking-tight text-accent">
            1.000+
          </p>
          <p className="mt-1 text-sm text-muted">makale ve analiz</p>
        </div>

        <div className="my-7 h-px bg-border" />

        <div>
          <p className="text-4xl font-semibold tracking-tight text-accent">
            2 dil
          </p>
          <p className="mt-1 text-sm text-muted">Türkçe ve İngilizce</p>
        </div>
      </aside>
    </section>
  );
}