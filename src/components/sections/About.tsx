import Image from "next/image";

export default function About() {
  return (
    <section id="hakkimda" className="bg-surface-soft text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
        <div className="grid items-start gap-10 lg:grid-cols-[0.65fr_1fr_320px] lg:gap-12">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
              Hakkımda
            </p>
            <h2 className="mt-6 text-5xl font-semibold leading-none text-ivory sm:text-6xl">
              Şaban Durali
            </h2>
          </div>

          <Image
            src="/brand/saban-durali-profile.jpg"
            alt="Şaban Durali portresi"
            width={320}
            height={360}
            className="order-2 h-auto w-full max-w-[360px] justify-self-center rounded-xl border border-border object-cover object-top lg:order-3 lg:-mt-4 lg:h-[360px] lg:w-[320px] lg:max-w-none lg:justify-self-end lg:self-start"
          />

          <div className="order-3 max-w-3xl space-y-6 text-lg leading-8 text-muted lg:order-2">
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
