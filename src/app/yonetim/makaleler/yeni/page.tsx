import type { Metadata } from "next";
import ArticleFormPrototype from "@/components/admin/articles/ArticleFormPrototype";

export const metadata: Metadata = {
  title: "Yeni Makale | Yönetim Prototipi",
  description:
    "Article modelini, slug üretimini ve mevcut doğrulama sistemini sınayan veri kaydetmeyen form.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewAdminArticlePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-border pb-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent-soft">
          ARTICLE MODEL PROTOTİPİ
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-ivory sm:text-5xl">
          Yeni Makale
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
          Form verisini geçici bir Article nesnesine dönüştürür, mevcut
          doğrulama çekirdeğini çalıştırır ve güvenli bir ön izleme gösterir.
        </p>
      </header>

      <ArticleFormPrototype />
    </div>
  );
}
