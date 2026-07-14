export default function Hero() {
  return (
    <section className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:px-10">
      <div>
        <p className="mb-6 text-sm font-medium uppercase tracking-[0.22em] text-black/50">
          Gayrimenkul · Kitaplar · Yapay Zekâ · Araştırma
        </p>

        <h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl lg:text-[86px]">
          Bilgiyi araştıran,
          <br />
          analiz eden ve
          <br />
          paylaşan bir platform.
        </h1>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-black/60">
          İstanbul gayrimenkul piyasası, kitaplar, yapay zekâ, satış ve
          müzakere üzerine uzun vadeli ve güvenilir bir bilgi merkezi
          oluşturuyorum.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#alanlar"
            className="rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white transition hover:bg-black/80"
          >
            Çalışmaları keşfet
          </a>

          <a
            href="#hakkimda"
            className="rounded-full border border-black/20 px-7 py-3.5 text-sm font-medium transition hover:bg-black/5"
          >
            Hakkımda
          </a>
        </div>
      </div>

      <aside className="rounded-[2rem] border border-black/10 bg-white/65 p-8 shadow-sm">
        <p className="text-sm text-black/45">Platform hedefi</p>

        <div className="mt-7">
          <p className="text-4xl font-semibold tracking-tight">500+</p>
          <p className="mt-1 text-sm text-black/50">kitap incelemesi</p>
        </div>

        <div className="my-7 h-px bg-black/10" />

        <div>
          <p className="text-4xl font-semibold tracking-tight">1.000+</p>
          <p className="mt-1 text-sm text-black/50">makale ve analiz</p>
        </div>

        <div className="my-7 h-px bg-black/10" />

        <div>
          <p className="text-4xl font-semibold tracking-tight">2 dil</p>
          <p className="mt-1 text-sm text-black/50">
            Türkçe ve İngilizce
          </p>
        </div>
      </aside>
    </section>
  );
}