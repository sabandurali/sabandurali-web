# Paket 01 — yerel uygulama incelemesi

Tarih: 17 Ekim 2026.

## Git ve kapsam

- Temiz `codex/corporate-contact-email` dalı ve tam HEAD `519c6e8ca8e9dd404f81330fcb4613f648b0e857` doğrulandı.
- Bu uçtan `codex/package-01` yerel dalı oluşturuldu. HEAD değişmedi; önceki üç commit korundu. Commit, push, merge ve deploy yapılmadı.
- Merkezi `saban@sabandurali.com` adresi korundu. Statik TR/EN footer, mailto ve gizlilik adresleri doğrulandı.
- Boş Son Araştırmalar bölümü bütünüyle gizleniyor. Makale olduğunda en yeni dört yayımlanmış içerik gösteriliyor; mevcut yayın filtreleri korunuyor.
- İngilizce araştırma menü bağlantıları `/en/articles` hedefine gidiyor. Mevcut bölüm ID'leri korunuyor.
- Yalnız Kira Çarpanı, ROI, İlçe Karşılaştır ve İngilizce karşılıklarının araç satırı kaldırıldı. Diğer analiz kartları ve bağlantıları korundu.
- Bağımsız Yayın / Independent Publishing sayacı kaldırıldı. 39/25/14 değerleri korunarak mobilde üç sütun, masaüstü yan panelinde üç satır gösteriliyor.
- Başlıklar Gayrimenkul Analizleri / Real Estate Analysis olarak güncellendi.
- Mevcut SD monogramıyla 1200×630 JPEG oluşturuldu; tarihî görsel kullanılmadı. TR/EN statik ana sayfalarda OG/Twitter tanımlı. Ortak Payload sayfa metadata yardımcısı özel görseli koruyor; yoksa ortak görseli kullanıyor.

## Değişen dosyalar

- `src/components/HomePage.tsx`
- `src/components/layout/navigation.ts`
- `src/components/sections/Hero.tsx`
- `src/components/sections/HomeEditorialSections.tsx`
- `src/content/homeEditorialContent.ts`
- `src/config/site.ts`
- `src/content/pages/page-seo.ts`
- `src/app/(tr)/page.tsx`
- `src/app/(en)/en/page.tsx`
- `public/brand/site-og.jpg` (yeni)
- `scripts/package-01.test.ts` (yeni)
- `docs/PACKAGE-01-REVIEW.md` (bu rapor)

## Doğrulama

- `npm run lint -- --ignore-pattern 'ml-env/**'`: geçti. Mevcut yerel üçüncü taraf Python ortamı dışarıda bırakıldı; lint yapılandırması değiştirilmedi.
- `node_modules/.bin/tsc --noEmit --incremental false`: geçti.
- `git diff --check`: geçti.
- `DISTRICT_CONTENT_WRITE_REPORT=0 node --import tsx scripts/districts/check-content.ts`: 39/39 PASS; rapor dosyalarına yazılmadı.
- `node --import tsx --test scripts/package-01.test.ts scripts/districts/policy.test.ts scripts/districts/public-master.test.ts scripts/districts/production-import.test.ts scripts/districts/production-editorial-batch2.test.ts scripts/districts/production-esenler-final.test.ts scripts/photos/historical-district-batch1.test.ts scripts/photos/historical-district-batch2.test.ts`: 84/84 geçti. Bunlar fixture/bellek tabanlı testlerdir; production import veya gerçek DB yazımı değildir.
- Ek geçici render kontrolünde gerçek HomePage bileşeni, veri/altyapı bağımlılıkları taklit edilerek TR/EN için 0, 1, 6 yayımlanmış makaleyle doğrulandı. Boş bölüm yok; 1 kart ve en fazla 4 kart doğru; sıralama korundu.
- İzole kopyada doğrudan `next build --webpack`: geçti, 71/71 statik sayfa. Derleyici uyarıyla tamamlandı. İlk sandbox denemesi Google Fonts DNS erişiminde başarısızdı; ağ erişimli izole tekrar başarılı oldu. Font veya bağımlılık değişikliği yapılmadı.
- Üretilen TR/EN iletişim ve gizlilik HTML'lerinde yeni adres/mailto, eski adresin yokluğu ve iletişim form alanları doğrulandı.
- Tarayıcıda TR/EN ana sayfalarda `og:image` ve `twitter:image`, sayaçlar, gizli boş bölüm ve menü hedefleri doğrulandı. 390 px ve 1440 px kontrolünde yatay taşma yok; kontrol edilen sayfalarda kırık görsel yok.

## Güvenli build ve önizleme

Build ve yerel sunucu geçici proje kopyasında çalıştırıldı. Ortam dosyaları, `.git`, `.vercel`, mevcut veritabanları ve build çıktıları kopyalanmadı. Çalışma ortamından yalnız PATH/HOME/TMPDIR alındı; tüm public kaynaklar açıkça `static`, sağlayıcılar SQLite/local ve DB yolu geçici kopyaya sabitlendi. Yalnız yerel önizleme için kullanılan sabit bir secret değeri atandı; gerçek sır okunmadı veya gösterilmedi.

`vercel:build`, migration/import CLI'ları ve CMS entegrasyon betikleri çalıştırılmadı. DB/CMS, Payload şeması, ilçe içerikleri, tarihî görseller ve Formspree kodunda değişiklik yok.

Yerel önizleme: `http://127.0.0.1:3101/` ve `/en`. Bu önizleme statik kaynaklarla çalışır; canlı Payload içeriğini veya üretimdeki kaynak modlarını temsil etmez.

## Üretim bağımlılıkları ve durma noktası

Formspree alıcısı form ID'si üzerinden servis tarafında yönetilir; merkezi iletişim e-postasından bağımsızdır. Alıcı ayarı değiştirilmedi ve gerçek gönderim yapılmadı.

Production SHA ve beş public kaynak ayarı bu kodlama turunda doğrulanmadı. Canlı Payload navigasyon/sayfalarındaki adresler, posta kutusu teslimi ve Formspree servis ayarları ayrıca doğrulanmalıdır. Mevcut migration kapıları korunuyor; bu paket migration gerektirmiyor.

Geri alma için esas referans `519c6e8` ve korunmuş `codex/corporate-contact-email` dalıdır. Henüz commit yoktur; yalnız Paket 01 diff'i incelenip seçilerek geri alınabilir. Toplu reset/clean uygulanmamalı; sonradan eklenen kullanıcı değişiklikleri korunmalıdır. Üretim geri alması veya DB geri yüklemesi yapılmadı.

Çalışma kod ve güvenli testler tamamlandıktan sonra durduruldu; bir sonraki adım yeni kullanıcı onayına bağlıdır.
