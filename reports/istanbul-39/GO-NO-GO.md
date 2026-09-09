# İstanbul 39 İlçe — nihai GO / NO-GO

**Karar: GO — feature branch, yerel kabul ve içerik güvenlik sınırı için.** 39/39 ilçe, kaynak incelemesine bağlı sınırlı yayın içeriğiyle kabul testini geçti. Production deploy, `main` merge, push ve production migration yapılmadı. Bu rapor production'ın canlıya alınmış olduğunu söylemez.

GO kararı, 14 başlığın her birinde dolu metin bulunduğu anlamına gelmez. Kullanıcının “güvenilir veri eksikse alanı boş/gizli bırak” kuralı uygulandı: özet, dar kapsamlı tarihçe, coğrafya ve mahalle listeleri yayıma uygun; doğrulanmayan değişken ve yorumlayıcı alanlar public dışıdır.

## Aşama 0–7 sonucu

| Aşama | Sonuç |
|---|---|
| 0 — Keşif | Mevcut 39 ilçe registry'si, canonical route'lar, DistrictGuides/Articles/Photos modeli, Git durumu, SQLite/Payload/PostgreSQL migration sınırları ve kullanıcıya ait kirli çalışma ağacı doğrulandı. |
| 1 — Veri sözleşmesi | Mevcut `DistrictGuides` genişletildi; kaynak, bölüm onayı, tarih/eskime, private araştırma ve provenance kapıları eklendi. Yeni collection veya ikinci public mimari kurulmadı. |
| 2 — Dönüşüm | Önceden çıkarılmış 39 PDF / 535 sayfa / 1.500 kaynak kaydı yeniden işlenmeden kullanıldı. 39 yeni web metni PDF'den kopyalanmadan yazıldı; mahalleler resmî dizinlerle düzeltildi. PDF binary dosyaları repoya alınmadı. |
| 3 — Import | Aynı import akışına `--editorial` girişi eklendi. İzole SQLite'ta güncelleme, fingerprint, manuel/yayımlanmış kayıt koruması, dry-run ve 0 yazmalı tekrar doğrulandı. |
| 4 — Public UI | Mevcut route üzerinde 14 bölüm, kaynak/metodoloji, güncelleme, dürüst boş durumlar ve yatırım tavsiyesi değildir uyarısı korunuyor. Haber/fotoğraf/araştırma yalnız mevcut ilişkilerden geliyor. |
| 5 — SEO | 39 canonical/title/description/OG, yalnız TR hreflang, dört adımlı breadcrumb, WebPage JSON-LD ve sitemap kabulü geçti. |
| 6 — Test | İçerik, policy, CMS, migration, import, build, route, responsive, 404, SEO ve regresyon koşuları geçti. |
| 7 — Teslim | Feature branch commitleri, makine tarafından okunabilir kabul kayıtları ve bu rapor hazırlandı. |

## Doğrulanan içerik

| Kontrol | Sonuç |
|---|---|
| İlçe kapsamı | 39/39 unique registry ve editoryal kayıt |
| Temel editoryal içerik | 39/39 özet, seçilmiş tarihçe ve coğrafya; ham PDF metniyle eşit değil |
| Mahalle listesi | 39/39, toplam 963 kayıt; resmî İBB/ilçe/e-Devlet dizinleriyle kontrol |
| Kaynak/metodoloji | 39/39 kontrol tarihi, gerçek yayıncı, URL, tür, birincil niteliği ve desteklediği bölüm |
| PDF provenance | 39/39 PDF SHA-256 eşleşmesi |
| İçerik kabulü | **39/39 PASS** |

Başlıca düzeltmeler: Esenler 17'den 19 mahalleye güncellendi; Beykoz'da eksik Ortaçeşme eklendi ve Çiftlik çift kaydı kaldırıldı; Sultangazi'de İBB'nin atladığı Zübeyde Hanım belediyenin e-Devlet kaydıyla doğrulandı; Esenyurt'un kesilmiş/eski PDF listesi 43 kayıtlı resmî listeyle değiştirildi. Şile, Başakşehir, Kartal, Kağıthane ve diğer ilçelerde imla/semti öneki farkları ilçe bazında kaydedildi. Ayrıntı: `source-review.md` ve `editorial-review.json`.

## Public dışı bırakılan içerik

39 ilçenin tamamında aşağıdakiler doğrulanmış yayın içeriğine alınmadı:

- nüfus, yüzölçümü, yoğunluk ve sıralamalar;
- m² satış fiyatı, kira, amortisman, getiri ve değer artışı tahminleri;
- proje ilerleme yüzdesi, açılış/teslim tarihi, güncel imar veya dönüşüm durumu;
- hat, istasyon, seyahat süresi ve ulaşım açılış bilgileri;
- bina güvenliği/kalitesi, gelir grubu ve yatırım üstünlüğü genellemeleri;
- güncel tesis erişimi, ziyaret rotası ve saha önerileri.

Tarihçede kaynakla çelişen veya ciddi biçimde desteklenmeyen iddialar da çıkarıldı: Bakırköy Konstantin/384, Çatalca MÖ 450 Roma anlatısı, Beyoğlu Galata Kulesi 13. yüzyıl, Ümraniye Harun Reşid/Frigler ve ilçe geneli sağlam zemin, Maltepe 816/Theophilos ve Bahçelievler Hebdomon eşleştirmesi bunlar arasındadır.

## Kaynak envanteri kabulü

1.500 ham kayıt / 1.407 benzersiz URL tarandı. Bu tarama bütün belgelerin her iddiasını onaylamaz; ham envanterin tamamı public dışıdır. Risk kaydı:

| Bayrak | Kayıt |
|---|---:|
| HEAD 404/410 | 11 |
| Ağ/TLS hatası | 34 |
| Diğer HEAD erişim belirsizliği | 55 |
| Kurumsal başlık / yayıncı kimliği incelemesi | 31 |
| Başka ilçe alan adı | 6 |
| Şüpheli URL karakteri | 11 |
| Şifresiz HTTP | 26 |
| Alan adı değiştiren yönlendirme | 2 |

Bu bayraklar üst üste gelebilir. HTTP 200 güvenilirlik kanıtı, 403/405 kırık içerik kanıtı sayılmadı. Wikimapia, kentbilgisistemi.com, Türkiye Belediyeleri, The Org ve RocketReach gibi üçüncü taraflar resmî yayıncı diye işaretlenmedi. Yalnız ayrı editoryal incelemede belirli bölümü desteklediği onaylanan kaynaklar public projection'a girebilir.

## Son kabul ve regresyon

| Kontrol | Sonuç |
|---|---|
| `npm run test:districts:content` | 39/39 PASS; 963 mahalle; doğrulanmamış alanlar null/boş |
| Policy/import testleri | PASS |
| CMS ham veri ve yayın kapıları | PASS; 39 draft geri yüklendi |
| Editoryal CMS kabulü | PASS; atılabilir DB'de 39 yayın, anonim 39 okuma, ham sızıntı 0, Articles 2 ve Photos 0 değişmedi |
| Import idempotency | 0 create / 0 update / 39 skip / 0 write |
| Dry-run | DB dosya hash'i ve boyutu değişmedi |
| PostgreSQL migration | 7/7 izole PGlite; eski kayıt korundu; 115 tablo; production bağlantısı yok |
| Lint | PASS; 0 hata / 0 uyarı |
| TypeScript | PASS |
| Next.js production build | PASS; yerel static-source ortamı |
| Static route kabulü | 39/39 detay + 39/39 haber; hata 0 |
| Payload editoryal route kabulü | 39/39 gerçek içerik; hata 0 |
| 404 ve redirect | Geçersiz detay/haber 404; eski rehber route'u 308 canonical |
| Responsive | 1440 / 820 / 390; yatay taşma ve kırık görsel 0 |
| SEO | 39/39 canonical, OG, breadcrumb, TR hreflang, sitemap |
| Regresyon | `/`, `/makaleler`, `/kitaplar`, `/fotograflar`, `/admin`, `/admin/help` HTTP 200 |

## Kalan riskler ve sınırlar

- Mahalle dizinlerinin çoğu yayın tarihi vermiyor. Kaydedilen 9 Eylül 2026 tarihi erişim/gözlem tarihidir; ilerideki idari değişiklikler için yeniden kontrol gerekir.
- 1.500 kaynak kaydının erişim ve yayıncı risk taraması tamamlandı; tüm kaynaklardaki her iddianın tek tek semantik doğrulaması yapılmadı. Public içerik bu nedenle dar tutuldu.
- Yerel PGlite migration testi PostgreSQL SQL uyumluluğu sağlar; gerçek Neon/production migration tatbikatı değildir.
- Authenticated Admin form akışı tarayıcıda test edilmedi; Local API doğrulamaları ve anonim public erişim test edildi.
- Haber/fotoğraf ilişkileri sahte fixture üretmeden korundu. İzole test DB'sinde 2 Article, 0 Photo vardı; fotoğraf bölümü dürüst boş durumu gösterdi.
- Bu commit production'a veri yüklemez. Editoryal kayıtlar import için hazırdır; gerçek ortama geçiş ayrı production onayı ve migration/deploy süreci gerektirir.

## Teslim sınırı

- Branch: `codex/istanbul-39-ilce-production`
- Uygulama/veri commit'i: `3354604` (`feat: add verified Istanbul district guides`)
- Push: yapılmadı
- Production deploy: yapılmadı
- `main` merge: yapılmadı
- Production migration/import: yapılmadı
- PDF commit: yok
- Kullanıcıya ait `importMap.js`, Payload type dosyasındaki ilgisiz değişiklikler, kılavuz/docs/ZIP/referans dosyaları: commit dışında

Makine kanıtları `reports/istanbul-39/evidence/` altındadır. Eski NO-GO kanıtları `evidence/previous-no-go/` altında tarihsel bağlam olarak korunur.
