import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Sayfa bulunamadı | Şaban Durali",
  description: "İstenen sayfa bulunamadı.",
};

export default function GlobalNotFound() {
  return (
    <html lang="tr">
      <body>
        <main className="flex min-h-screen items-center px-4 py-14 sm:px-6">
          <section className="mx-auto max-w-xl rounded-sm border border-border bg-surface/80 p-7 sm:p-10">
            <p className="text-xs font-semibold tracking-[0.22em] text-accent-soft">
              404
            </p>
            <h1 className="mt-4 text-4xl leading-tight text-ivory sm:text-5xl">
              Sayfa bulunamadı.
            </h1>
            <p className="mt-5 text-base leading-7 text-muted">
              İstediğiniz adres bulunamadı veya artık kullanılmıyor olabilir.
            </p>
            <Link
              href="/"
              className="mt-7 inline-flex min-h-11 items-center rounded-sm border border-border px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:border-accent hover:text-accent-soft motion-reduce:transition-none"
            >
              Ana sayfaya dön
            </Link>
          </section>
        </main>
      </body>
    </html>
  );
}
