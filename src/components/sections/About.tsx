export default function About() {
  return (
    <section id="hakkimda" className="bg-accent-strong text-surface">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
        <p className="mb-10 text-sm font-medium uppercase tracking-[0.24em] text-accent-warm-soft">
          Hakkımda
        </p>

        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <h2 className="text-5xl font-semibold leading-none sm:text-6xl">
            Şaban Durali
          </h2>

          <div className="max-w-3xl space-y-6 text-lg leading-8 text-[#d8e7e5]">
            <p>
              Gayrimenkul, teknoloji, marka, programlama ve yaşam boyu öğrenme
              alanlarında çalışıyorum. Bu platformu yalnızca içerik yayımlamak
              için değil; araştırma yapmak, öğrendiklerimi uygulamak ve
              sürdürülebilir bilgi üretmek için kuruyorum.
            </p>

            <p>
              Uzun vadeli hedefim, yapay zekâ ve dijital sistemleri kullanarak
              eğitim, araştırma, danışmanlık ve bağımsız yayıncılık alanlarında
              değer üreten bir yapı oluşturmaktır.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
