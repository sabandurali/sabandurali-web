import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { assertDevelopmentEnvironment } from "@/lib/development-only";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yönetim Prototipi | Şaban Durali",
  description:
    "Makale modelini geliştirme ortamında sınamak için veri kaydetmeyen yönetim prototipi.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPrototypeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  assertDevelopmentEnvironment();

  return (
    <html lang="tr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="min-h-screen">
          <header className="border-b border-border bg-background/95 px-4 py-5 sm:px-6 lg:px-10">
            <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-serif text-xl font-semibold text-ivory">
                  Şaban Durali
                </p>
                <p className="mt-1 text-xs font-semibold tracking-[0.18em] text-accent-soft">
                  YÖNETİM PROTOTİPİ
                </p>
              </div>

              <nav
                aria-label="Yönetim navigasyonu"
                className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm"
              >
                <Link
                  href="/yonetim/makaleler"
                  className="text-ivory underline-offset-4 transition-colors hover:text-accent-soft hover:underline motion-reduce:transition-none"
                >
                  Makaleler
                </Link>
                <Link
                  href="/yonetim/makaleler/yeni"
                  className="text-ivory underline-offset-4 transition-colors hover:text-accent-soft hover:underline motion-reduce:transition-none"
                >
                  Yeni Makale
                </Link>
                <Link
                  href="/yonetim/kitaplar"
                  className="text-ivory underline-offset-4 transition-colors hover:text-accent-soft hover:underline motion-reduce:transition-none"
                >
                  Kitaplar
                </Link>
                <Link
                  href="/yonetim/kitaplar/yeni"
                  className="text-ivory underline-offset-4 transition-colors hover:text-accent-soft hover:underline motion-reduce:transition-none"
                >
                  Yeni Kitap İncelemesi
                </Link>
              </nav>
            </div>
          </header>

          <div className="border-b border-border bg-surface px-4 py-3 sm:px-6 lg:px-10">
            <p className="mx-auto max-w-7xl text-sm leading-6 text-accent-soft">
              Geliştirme prototipi — bu ekranda yapılan işlemler kalıcı
              olarak kaydedilmez.
            </p>
          </div>

          <main id="admin-content" className="px-4 py-10 sm:px-6 lg:px-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
