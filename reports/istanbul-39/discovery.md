# Aşama 0 — Keşif (9 Eylül 2026)

Başlangıç HEAD: `7f8411b`. Başlangıç branch: `main`; çalışma branch: `codex/istanbul-39-ilce-production`.

## Korunacak başlangıç değişiklikleri
- src/app/(payload)/admin/importMap.js (modified)
- src/payload-types.ts (modified)
- CODEX_39_ILCE_MASTER_TALIMAT.md, YONETIM-PANELI-KULLANIM-KILAVUZU.md, docs/, iki ZIP ve referans PNG (untracked)

## Doğrulanan mimari
- Next.js 16.2.10, Payload 3.86.0; Next yerel Server/Client Components ve generateMetadata rehberleri okundu.
- `district-registry.ts`: 25 Avrupa + 14 Anadolu; select seçenekleri Articles/Photos/DistrictGuides tarafından ortak kullanılıyor.
- Canonical: /istanbul/ilceler, /istanbul/ilceler/[district], /istanbul/ilceler/[district]/haberler.
- DistrictGuides: tekil district enum, localized TR/EN metin, facts, neighborhoods, marketData, planningDevelopments; drafts ve publishedAt guard mevcut.
- Articles: district-research / district-news, districtNeighborhood, newsCategory, externalSource. Photos: district/neighborhood/category/dayPeriod.
- Public PAGE_PUBLIC_SOURCE=payload değilse ilçe içeriği null; static build mevcut boş rehberleri test eder, CMS içerik kabulü sayılmaz.
- Veri kaynağı TR ve fallbackLocale:false kullanıyor; EN ilçe route yok.
- Media guard koleksiyon şemasını özyinelemeli tarıyor; yeni upload alanı gerekmiyor.
- SQLite development push; PostgreSQL push:false ve altı mevcut migration.
- Mevcut SQLite salt okunur kontrol: 0 ilçe, 2 makale, 0 fotoğraf, 3 medya, 1 kullanıcı. Asıl DB değiştirilmeyecek; izole test DB kullanılacak.

## Açıklar ve riskler
- Kaynak/metodoloji ve bölüm bazlı doğrulama alanları eksik.
- Piyasa kaynağı serbest metin; son kontrol ve doğrulama bayrağı yok. İmar statüleri hedefle tam örtüşmüyor.
- Public mapper yayımlanmış kayıttaki sayısal verileri doğrulama olmadan geçiriyor.
- Ana merkezde arama/filtre yok; kısa içerik özeti yok. Detay OG ve breadcrumb eksik.
- PDF kaynak listesi doğrulama kanıtı değildir; PDF içinde nüfus sitelerinin TÜİK etiketiyle sunulması gibi atıf riski var.
- PDF tarihleri ve dinamik iddialar otomatik güncel kabul edilmeyecek.
- Schema eklenmesi PostgreSQL additive migration ve SQLite testini gerektirir. Migration oluşturmak/apply etmek farklı işlemlerdir; production apply yasak.

## Kaynak havuzu
39/39 PDF; 535 sayfa. Binary dosyalar Downloads altında, repo dışında. SHA-256 ve sayfa envanteri ayrı dosyada.
