export default function About() {
  return (
    <section
      id="hakkimda"
      className="border-y border-black/10 bg-[#171717] text-white"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-2 lg:px-10">
        <p className="text-sm uppercase tracking-[0.22em] text-white/40">
          Hakkımda
        </p>

        <div>
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Şaban Durali
          </h2>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/65">
            Gayrimenkul, teknoloji, marka, programlama ve yaşam boyu
            öğrenme alanlarında çalışıyorum. Bu platformu yalnızca içerik
            yayımlamak için değil; araştırma yapmak, öğrendiklerimi
            uygulamak ve sürdürülebilir bilgi üretmek için kuruyorum.
          </p>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">
            Uzun vadeli hedefim, yapay zekâ ve dijital sistemleri kullanarak
            eğitim, araştırma, danışmanlık ve bağımsız yayıncılık alanlarında
            değer üreten bir yapı oluşturmaktır.
          </p>
        </div>
      </div>
    </section>
  );
}