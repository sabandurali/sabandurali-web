# Son yedek ve güvenlik durumu — 21 Ekim 2026

> Yayımlanan kopya: bu depo herkese açık olduğu için yerel ve harici disk yolları, parola saklama ayrıntıları ve eksik Secret adlarının dökümü çıkarılmıştır. Tam metin özel yedekte durur.

Bu belge önceki raporlardaki erişim ve eksik listelerinin güncel durumunu verir. Mevcut çalışmalar, eski yedekler ve geçmiş korundu. Canlı dağıtım, main birleştirmesi, force push, ücretli işlem ve sır değişikliği yapılmadı.

## Tamamlanan ve doğrulanan işler

- Vercel eski bağlantısı/CLI kimliği 403 vermişti. Kullanıcının onayladığı ayrı Mac CLI oturumu doğru proje ve ortam API'sinde HTTP 200 verdi; Chrome yönetim oturumu da erişiyor. Eski kimlik değiştirilmedi. GitHub bağlayıcısının PR oluşturma çağrısı ayrıca 403 verdi; mevcut yetkili Mac GitHub CLI ile taslak PR oluşturuldu.
- Tutarlı PostgreSQL 18 uygulama dökümü, yerel ve doğrudan şifreli SSD kopyasından iki ayrı boş test veritabanına geri yüklendi: **115 tablo, 34.526 satır; tüm içerik hashleri eşleşti**. Üretim Blob envanteri **15 dosya**; başlangıç/bitiş listeleri ve iki indirmedeki boyut/hashler eşleşti. Ayrıntılar önceki canlı yedek raporunda.
- Preview Blob deposu yetkili Vercel yönetim ekranında, boş arama ve kök dizinde yeniden doğrulandı: **0 dosya, 0 bayt**. Önceki bağımsız listeleme belirsizliği bu gözlemle giderildi.
- Ana AES-256 yedek ve SSD kopyasının hashleri yeniden eşleşti; önceki içerikleri değişmedi. Ana görüntüdeki 126 dosya ve SSD üzerinden PostgreSQL geri yüklemesi daha önce doğrulanmıştı.
- Yeni AES-256 ek pakette son inceleme kayıtları, Formspree'nin yalnızca görünür kısmi alanları, test kanıtları ve güvenlik dalının Git bundle'ı var. SSD kopyası salt okunur açıldı: **24/24 dosya boyutu ve SHA-256 eşleşti**, Git bundle doğrulandı. Görüntü kontrol sonunda kapatıldı.

## Şifreli dosyaların konumu

Yerel klasör: proje kökündeki Git dışı `.private-backups/` dizini.

Ayrı fiziksel SSD: sahibinin harici şifreli diski (yol özel yedekte kayıtlı).

Her iki konumda birlikte korunması gereken dosyalar:

| Dosya | Boyut | SHA-256 |
| --- | ---: | --- |
| `sabandurali-private-2026-10-21.dmg` | 347303936 bayt | `0b636668f5e52a1efe102a5ee56f19d1919f17cd4ef2bab35174d7a83bd783e6` |
| `sabandurali-private-supplement-2026-10-21.dmg` | 18327040 bayt | `fe763e93125b00a076fa367f02cb1ff930f0246f0d7cf3e4736f24ab1da0662b` |

Ek paket ana yedeğin yerine geçmez. Ana yedekte üretim dump'ı, Blob dosyaları ve erişilebilir ortam değerleri bulunur. Ham özel dosyalar yerel `.private-backups/` ve kullanıcıya özel `/private/tmp` hazırlık/test klasörlerinde korundu; bu ham dosyalar dosya düzeyinde şifreli değildir. Şifreli paketler SSD'ye yazıldı. Hiçbir özel içerik GitHub'a yüklenmedi.

Parola macOS penceresinde kullanıcı tarafından girildi, okunmadı veya kayda yazılmadı. Parolanın kendisi istenmemelidir.

## Secret kayıtları ve eksikler

Servis, Secret türündeki ortam kayıtlarının değerlerini geri vermiyor; bu kayıtların çoğu eski preview dallarına aittir. Mevcut proje ve kayıtlı worktree'lerin yetkili yerel ortam dosyaları incelendi; **özgün canlı değer olduğu doğrulanan yeni sır bulunamadı**. Hiçbir aday değer çalışan sisteme uygulanmadı.

Dışa aktarılamayan kayıtların ad listesi ve her birinin etkisi özel yedekte tutulur. Kullanıcı parola hashleri veritabanı dökümündedir. Üretim Blob erişim değeri ve production veritabanı bağlantısı ana özel yedekte vardır; preview Blob deposu boştur.

Gereken adım: eksik özgün değerleri sahibinin mevcut güvenli kaynağından özel yedeğe eklemek. Değerler sohbete/GitHub'a yazılmamalı, çalışan sırlar değiştirilmemeli. Kaynak mevcut değilse birebir kimlik doğrulama sürekliliği tamamlandı sayılamaz.

## Formspree sınırı

Doğru canlı formun yetkili oturumunda görünen iki kaydın yalnızca ekranda okunabilen alanları ve görünen günleri özel JSON'a alındı ve şifreli ek pakete eklendi. Tarihlerde saat görünmüyor; bazı e-posta/mesaj alanları kesilmiş. **Bu iki tam başvurunun yedeği değildir.** Ücretli arşiv/dışa aktarma sınırı aşılmadı, gizli/örtülü alanlar çıkarılmadı ve plan satın alınmadı. Tam kayıtlar için Formspree'nin hesap sahibine sunduğu yetkili tam dışa aktarım veya mevcut özgün bildirim kayıtları gerekir.

## Güvenlik dalı ve dağıtım öncesi sonuç

- Depo: https://github.com/sabandurali/sabandurali-web (mevcut public görünürlük değişmedi).
- Kaynak yedek dalı: `codex/backup-2026-10-21`; commit `9d23072e06fcb011f96d53b79ad73a76bfc48d8e`; etiket `backup-2026-10-21`.
- Güvenlik dalı: `codex/security-followup-2026-10-21`; kod değişikliği `26be65cd9f1bb17edeec92809591b9ac0580d2ed`; son belge commit'i `6577a7dff03e560f502a2d758a94bc89bffeecb1`.
- Taslak PR: https://github.com/sabandurali/sabandurali-web/pull/1 — main'e birleştirilmedi. Vercel'de bu dalın deployment listesi boş; dal otomatik dağıtımı kapalı.
- Önceki temiz kurulum, derleme (71 rota), lint ve 22 test başarılıydı. Lokal SQLite testinde admin giriş, Monaco yüklenmesi, JPEG yükleme/okuma ve SVG reddi doğrulandı.
- Bu tur güvenlik build'i geri yüklenmiş PostgreSQL'e salt okunur rolle bağlandı; canlı sırlar kullanılmadı. Ana sayfa, iletişim, admin giriş, 404, statik/optimize görseller ve korumalı API başlık testleri geçti. PostgreSQL içerik API'leri 200; gerçek public Blob görselinin optimizasyonu 200 verdi. Sonrasında 115 tablo hashinin değişmediği doğrulandı; test sunucuları kapatıldı.
- Gerçek production admin oturumu ve Formspree'ye gerçek gönderim yapılmadı. İlk testteki biçimi geçersiz sentetik Blob token'ı yalnızca test düzeneğinde düzeltildi; başarılı ikinci test ayrı kaydedildi.
- **Yüksek:** Monaco'nun paketlenmiş ESM/CDN sanitizer kopyası override ile düzelmiş sayılmaz; ayrıca braces bulgusu sürüyor. **Orta:** esbuild bulgusu eski geliştirme sunucusu kullanımıyla ilişkili; uygulama üretim sunucusu bu yol değil. Son audit tüm bağımlılıklarda 13 yüksek/6 orta; omit-dev 10 yüksek/6 orta, kritik 0. Sayılar bağımlılık grafiği bulgularıdır; tamamının canlı istismar edilebilirliği doğrulanmadı.
- DOMPurify override'ı 3.4.17 ve temel güvenlik başlıkları mevcut dalda. CSP tam XSS koruması iddiası taşımıyor; script/default/connect kısıtı eklenmedi. Büyük sürüm yükseltmesi, zorla audit fix veya davranış değiştiren yeni düzeltme yapılmadı.
- Şema/migration değişikliği yok. Kod değişikliğinin ters patch kontrolü geçti. Gerçek dağıtım sonrası ihtiyaç olursa önceki doğrulanmış deployment'a dönüş veya yeni revert commit kullanılmalı; kod geri dönüşü için canlı DB geri yüklenmemeli. Gerçek canlı rollback yapılmadı.

Bu sonuçlar kontrollü test uyumluluğunu gösterir. Eksik production sırları ve kalan bağımlılık riskleri nedeniyle koşulsuz canlıya hazır/onaylı sonucu verilmez.

## Kısa geri yükleme

1. İki DMG'nin hashlerini yukarıdaki değerlerle karşılaştırın; her görüntüyü macOS güvenli parola penceresiyle açın, içindeki `MANIFEST.json` ile dosyaları doğrulayın.
2. Yeni boş klasöre kaynak yedek etiketini alın; güvenlik sürümü gerekiyorsa ayrı dalın bundle/commit'ini kullanın. Kilit dosyasıyla `npm ci`, ardından lint/test/build çalıştırın.
3. Yeni boş PostgreSQL 18 test veritabanına ana görüntüdeki `2026-10-21-live-retry/postgres18/production-postgres.dump` dosyasını `pg_restore --exit-on-error --single-transaction --no-owner --no-acl` ile yükleyin. Başarısız ilk PostgreSQL 17 denemesinin üst dizindeki boş dump'ını kullanmayın. Üretim rol/ACL eşlemesi ayrıca yapılmalıdır.
4. Ana görüntüdeki Blob manifestine göre 15 dosyayı yeni hedefe alın, hashleri karşılaştırın; alan adı değişirse DB URL referanslarını uyarlayın.
5. Eksik özgün sırları güvenli kanaldan tamamlayın. `.env` dosyaları Git dışında kalmalı. Yönetim paneli, içerik, görsel ve form akışlarını ayrı test ortamında doğrulayın.
6. Formspree kısmi JSON'unu tam başvuru arşivi olarak kullanmayın. Preview Blob bu yedek anında boştu.
