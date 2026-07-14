export default function Footer() {
  return (
    <footer
      id="iletisim"
      className="border-t border-black/10 bg-white"
    >
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 py-10 md:flex-row lg:px-10">

        <div>
          <h3 className="text-2xl font-semibold">
            Şaban Durali
          </h3>

          <p className="mt-2 max-w-md text-black/55">
            Bağımsız araştırma, bilgi üretimi ve kişisel yayın platformu.
          </p>
        </div>

        <div className="text-sm text-black/45">
          © 2026 Şaban Durali.
          Tüm hakları saklıdır.
        </div>

      </div>
    </footer>
  );
}