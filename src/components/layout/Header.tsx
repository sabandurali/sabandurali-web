export default function Header() {
  return (
    <header className="border-b border-black/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <a href="#" className="text-lg font-semibold tracking-tight">
          Şaban Durali
        </a>

        <nav className="hidden items-center gap-7 text-sm md:flex">
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

        <button className="rounded-full border border-black/15 px-4 py-2 text-xs font-medium">
          TR · EN
        </button>
      </div>
    </header>
  );
}