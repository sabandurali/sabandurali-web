import Image from "next/image";

export default function Footer() {
  return (
    <footer
      id="iletisim"
      className="scroll-mt-24 border-t border-border bg-background"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:px-10">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/sd-monogram-light.png"
            alt=""
            width={44}
            height={44}
            className="size-11 shrink-0"
          />
          <div>
            <h3 className="font-serif text-lg font-semibold tracking-[0.14em] text-ivory">
              ŞABAN DURALİ
            </h3>
            <p className="mt-1 text-[9px] tracking-[0.16em] text-accent-soft">
              ARAŞTIRMA VE BİLGİ PLATFORMU
            </p>
          </div>
        </div>

        <div>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Gayrimenkul, danışmanlık, araştırma ve teknoloji odaklı bağımsız
            bilgi ve yayın platformu.
          </p>
          <p className="mt-4 text-xs text-muted">
            © 2026 Şaban Durali. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
