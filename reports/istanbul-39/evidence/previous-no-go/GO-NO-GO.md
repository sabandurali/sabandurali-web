# İstanbul 39 İlçe — GO / NO-GO

**Karar: NO-GO.** Teknik altyapı ve route testleri geçti; ana sözleşmenin 39 ilçelik tamamlanmış, kaynakları doğrulanmış yayın içeriği şartı karşılanmadı. **39/39 route başarısı, 39/39 içerik kabulü değildir.** İşin tamamının bittiği iddia edilmiyor.

## Aşamalar

| Aşama | Sonuç |
|---|---|
| 0 — Keşif | Tamamlandı: mevcut mimari, başlangıç Git ağacı, SQLite durumu, provider/migration yapısı ve kaynak envanteri doğrulandı. |
| 1 — Veri sözleşmesi | Mevcut DistrictGuides genişletildi. Kaynak, bölüm onayı, tarih/eskime kapısı, public dışı araştırma ve provenance alanları eklendi. |
| 2 — 39 ilçe dönüşümü | 39/39 PDF, 535 sayfa, 1.500 kaynak kaydı ortak ara veriye dönüştürüldü. **Yayın metni düzenlemesi ve kaynak/mahalle tamlık kabulü tamamlanmadı.** |
| 3 — Import | İzole SQLite kopyasında 39 draft; idempotency, dry-run ve manuel içerik koruması doğrulandı. Production import yapılmadı. |
| 4 — Public UI | Mevcut route üzerinde 14 bölüm, arama/yaka/alfabe, aynı Articles/Photos bağlantıları ve kaynak görünümü hazır. Gerçek içerik yayını 0/39. |
| 5 — SEO | 39 unique canonical/title/description, OG, yalnız TR hreflang, dört adımlı breadcrumb, WebPage schema, sitemap ve alternatif rehber redirect'i test edildi. |
| 6 — Test | Aşağıdaki teknik testler geçti; bütünsel içerik kabulü başarısız. |
| 7 — Teslim | Bu rapor ve kanıtlar hazır. Production onayına hazır sonuç teslim edilmedi. |

## Kabul sonuçları

| Kontrol | Sonuç / kapsam |
|---|---|
| PDF havuzu | 39/39, 535 sayfa; PDF'ler Downloads altında kaldı |
| Registry / slug / CMS kayıt | 39/39 unique, 39 draft, duplicate 0 |
| İlk import | 39 create / 0 update / 0 skip |
| Aynı veriyle tekrar | 0 create / 0 update / 39 skip / 0 write |
| Dry-run | 0 write; hedef DB dosyası SHA-256 değişmedi |
| Manuel düzenleme | Yerel API testi: düzenlenen kayıt import tarafından korunuyor |
| Detay route | 39/39 HTTP 200 |
| Haber route | 39/39 HTTP 200 |
| Ana rehber | HTTP 200; arama, Avrupa 25/Anadolu 14 filtresi, alfabetik seçim geçti |
| Geçersiz detay/haber slug | HTTP 404 |
| Alternatif rehber | /gayrimenkul-ve-istanbul/ilce-rehberi → /istanbul/ilceler, HTTP 308 |
| Mobil / desktop | 39 detayda 1440/820/390 taşma yok; örnek uzun adlı haber başlıkları 390'da kontrol edildi |
| Fotoğraf boş durumu | 39/39 kırılmadan render |
| SEO | 39/39 canonical, OG, noindex yok, EN hreflang yok, breadcrumb, sitemap |
| 5xx / tarayıcı exception | 0 / 0 |
| Ana sayfa, makaleler, kitaplar, fotoğraflar, admin, admin/help | HTTP 200; authenticated Admin form etkileşimi doğrulanmadı |
| CMS yayın kapıları | İncelenmemiş yayın, future publishedAt, raw veri sızıntısı ve EN fallback testleri geçti |
| Non-empty render | Sentetik yerel onaylı kayıt ile 1440/820/390 test edildi; fixture kaldırılıp 39 draft durumuna dönüldü |
| git diff --check | Geçti |
| npm run lint | Geçti; 0 hata / 0 uyarı |
| TypeScript --noEmit | Geçti |
| Production build | Yerel static public-source ortamında geçti; production deploy kanıtı değildir |
| Politika/import testleri | 8/8 |
| PostgreSQL | 7 migration izole PGlite içinde geçti; önceki kayıt korundu, yeni kaynak insert'i çalıştı |
| SQLite koruma | Asıl DB değişmedi; test kopyasında mevcut 1 kullanıcı, 2 makale, 3 medya ve 0 fotoğrafın eski kolon değerleri asıl DB ile aynı |
| Tam yayın içeriği kabulü | **0/39 — NO-GO** |

## Kaynak incelemesi ve kalan iş

PDF metinleri final editoryal metne dönüştürülmedi. İlgili bölüm taslaklarında dipnot numaraları ve tablo dökümleri bulunur. Kısa özet/ayrı ulaşım metni, resmî tam mahalle listeleri ve kaynak-iddia eşleştirmelerinin 39 ilçe için hazırlanması gerekir. Ham içeriği sadece onay kutuları işaretleyerek yayımlamak kabul edilmez.

PDF'lerdeki 77 resmî bağlantı için erişim kontrolü yapıldı: sistem curl tekrarları sonrasında 76 adres HTTP yanıtı verdi, bir adreste TLS hostname uyuşmazlığı sürdü. Bu yalnız erişim kontrolüdür; 76 kaynağın iddiaları doğruladığı iddia edilmiyor. İBB toplu MapServer denemesi token istedi; bağlı demografik harita web erişiminde timeout verdi. Bu sorunların bütün editoryal işi imkânsız kıldığı iddia edilmiyor. Ayrıntılar [source-review.md](source-review.md) ve [source-availability.json](source-availability.json) dosyalarındadır.

Örnek atıf riski: Beşiktaş PDF'sinde Ataşehir Kaymakamlığı bağlantısı. Üçüncü taraf nüfus URL'leri TÜİK olarak etiketlenmedi. Nüfus/alan/mahalle/ulaşım verileri doğrulanmadan yapılandırılmış public alanlara alınmadı. Fiyat, kira, amortisman, ilerleme oranı, açılış hedefi ve imar statüleri draft/public dışı kaldı. İlçe bazlı iddia örnekleri ve kabul tablosu [content-acceptance.json](content-acceptance.json) içindedir.

## Git ve migration teslimi

- Branch: `codex/istanbul-39-ilce-production`
- Başlangıç HEAD: `7f8411b195563960071a0be7a972b3e87649e678`
- Bitiş HEAD: `7f8411b195563960071a0be7a972b3e87649e678` — değişiklikler commit edilmedi; inceleme için çalışma ağacında.
- Değişen/yeni dosyalar: [changed-files.txt](changed-files.txt).
- Mevcut `importMap.js` değişikliği byte düzeyinde korundu. `payload-types.ts` içinde yalnız DistrictGuide ve DistrictGuidesSelect güncellendi; başlangıçtaki diğer kullanıcı değişiklikleri korundu.
- Kullanıcı kılavuzu, başlangıçtaki docs/, ZIP'ler ve referans PNG değiştirilmedi; stage/commit edilmedi.
- Migration: `20260909_181042_istanbul_district_sources`; additive, veri silen down kapalı. **Production migration çalıştırılmadı.**
- Commit / push / main merge / deploy: **yapılmadı**. PDF commit: **yok**. `.env*` / canlı secret / Vercel / Neon / Blob değişikliği: **yok**.

## Kanıtların sınırı

[evidence](evidence/) içinde static-build ve Payload/SQLite-draft route raporları ayrı saklandı. Her ikisinde içerik onayı olmayan sayfaların boş durumları test edilir. Sentetik fixture ekranları sadece render/gizleme testidir; gerçek Esenler yayın içeriği değildir. Gerçek production veritabanına bağlanılmadı. Salt okunur public API kontrolünde yayımlanmış ilçe kaydı 0 göründü; erişilemeyen draft kayıtlar hakkında çıkarım yapılmadı.

Tamamlanmış 39 içerik kabulü ve gerçek PostgreSQL/Payload yayın provası sağlanmadan production için GO verilmemelidir.
