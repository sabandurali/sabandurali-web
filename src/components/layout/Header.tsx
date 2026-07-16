import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:min-h-[94px] md:py-4 lg:px-10">
        <a href="#" className="flex min-w-0 shrink items-center gap-2.5 md:gap-3">
          <Image
            src="/brand/sd-monogram-light.png"
            alt=""
            width={52}
            height={52}
            className="size-10 shrink-0 md:size-[50px]"
            priority
          />
          <span className="min-w-0">
            <span className="block truncate font-serif text-base font-semibold tracking-tight text-ivory md:text-xl md:uppercase md:tracking-[0.16em]">
              <span className="md:hidden">Şaban Durali</span>
              <span className="hidden md:inline">ŞABAN DURALİ</span>
            </span>
            <span className="hidden whitespace-nowrap text-[9px] tracking-[0.18em] text-accent-soft md:block">
              ARAŞTIRMA VE BİLGİ PLATFORMU
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-5 text-sm text-ivory md:flex lg:gap-7">
          <a href="#hakkimda" className="transition hover:opacity-55">
            Hakkımda
          </a>

          <a href="#alanlar" className="transition hover:opacity-55">
            Çalışmalar
          </a>

          <a href="#iletisim" className="transition hover:opacity-55">
            İletişim
          </a>
        </nav>

        <button className="shrink-0 rounded-full border border-border px-3 py-2 text-xs font-medium text-ivory transition hover:border-accent hover:bg-surface sm:px-4">
          TR · EN
        </button>
      </div>
    </header>
  );
}
