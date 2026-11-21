# Canlı yedek doğrulaması — 21 Ekim 2026

> Yayımlanan kopya: bu depo herkese açık olduğu için harici disk yolu, form kimliği ve eksik Secret ayrıntıları çıkarılmıştır. Tam metin özel yedekte durur.

> Son doğrulanmış durum: [Yedek tamamlama ve güvenlik raporu](BACKUP-COMPLETION-2026-10-21.md). Aşağıdaki önceki sonuçlar tarihsel kayıt olarak korunmuştur.

## Tamamlananlar

- Chrome Vercel oturumu doğru projeye erişti. Eski bağlı araç ve Mac CLI kimliği HTTP 403 verdi; ayrı açılan ve kullanıcı tarafından onaylanan yeni CLI oturumu proje denetimi ve ortam API'sinde başarılı oldu (HTTP 200). Eski kimlik dosyası değiştirilmedi.
- PostgreSQL 18.6 uygulama veritabanı, salt okunur REPEATABLE READ işlemiyle dışa verilen ortak snapshot üzerinden `pg_dump` custom formatında eksiksiz alındı. Şema, tablo verileri, sıra değerleri, indeksler ve kısıtlar dökümde bulunuyor. Bu bir uygulama veritabanı yedeğidir; Neon platform hesabının/WAL geçmişinin yedeği değildir.
- Yeni, boş ve TCP erişimi kapalı PostgreSQL 18 test veritabanına geri yükleme başarılı: **115 tablo, 34.526 satır, tüm tablo içeriklerinin SHA-256 değerleri eşleşti; doğrulanmamış kısıt 0**. Aynı test doğrudan SSD'deki şifreli kopyadan ikinci boş veritabanına tekrarlandı ve geçti. Test sunucusu durduruldu.
- Canlı Blob deposunun bütün sayfaları listelendi: **15 dosya**. Dosyalar iki kez indirildi; boyutlar ve SHA-256 değerleri eşleşti. Başlangıç ve bitiş envanterleri aynıydı. SQL snapshot ile nesne deposu arasında dağıtık atomik snapshot garantisi yoktur.
- Mevcut iki yedeğin **52 + 25** checksum kaydı yeniden doğrulandı ve yedekler değişmeden korundu.
- Eski yedekler, yeni veritabanı/Blob yedeği ve erişilebilir ortam verileri **AES-256** disk görüntüsüne alındı. Parola kullanıcı tarafından macOS penceresinde girildi; sohbete veya komutlara aktarılmadı.
- Yerel şifreli görüntü ile ayrı fiziksel USB SSD kopyası aynı SHA-256 değerine sahip. SSD görüntüsü şifre çözülerek salt okunur açıldı; içindeki **126 dosyanın tamamı** kaynak manifestiyle eşleşti. Kontrol sonunda şifresi açılmış görüntü kapatıldı.

## Konumlar

- Yeni özel veriler ve doğrulama kayıtları: `.private-backups/2026-10-21-live-retry/`
- Başarılı canlı dump: `.private-backups/2026-10-21-live-retry/postgres18/production-postgres.dump`
- Yerel şifreli kopya: `.private-backups/sabandurali-private-2026-10-21.dmg`
- SSD: sahibinin harici şifreli diskinde aynı adlı kopya (yol özel yedekte kayıtlı)
- Şifreli görüntünün SHA-256 değeri: `0b636668f5e52a1efe102a5ee56f19d1919f17cd4ef2bab35174d7a83bd783e6`

Özel ham dosyalar 0700 klasör/0600 dosya izinleriyle yerel diskte tutulur. Bunlar ayrıca dosya düzeyinde şifreli değildir; şifreli paket ve SSD kopyası yukarıdadır. Mevcut dosyaları silmeme talebi nedeniyle eski ham yedekler korundu. Test veritabanı ve hazırlık kopyası `/private/tmp` altında yalnızca kullanıcı erişimine açık kaldı; test servisi kapalıdır.

## Eksikler ve gereken adım

1. **Formspree:** Canlı iletişim formuyla eşleşen hesaba erişim başarılı. Gelen kutusunda iki eski kayıt, spam 0, son 30 gün 0. Arşiv ve CSV/JSON dışa aktarma mevcut planda kilitli; dışa aktarma Personal veya üst plan gerektiriyor. Başvurular yedeklenmedi. Gereken adım: Formspree'de arşiv/dışa aktarma erişimini etkinleştirmek veya hizmetin sağladığı yetkili dışa aktarımı almak. Ücretli işlem yapılmadı, sınır aşılmadı.
2. **Vercel Secret değerleri:** Ortam kayıtları ve okunabilir değerler özel dosyaya alındı; Secret türündeki kayıtların değerini servis geri vermiyor. Ortam dosyalarındaki redacted yer tutucular gerçek sır değildir. Gereken adım: eksik değerleri özgün parola yöneticisinden/özel kaynaktan güvenli biçimde geri almak. Ayrıntılı ad listesi özel yedekte `unexportable-secret-names.json` içinde. Süresi dolan OIDC kimlikleri geri yüklemede tekrar kullanılmamalı.
3. **Preview Blob:** Yönetim API'si bağlı Preview deposunda 0 dosya/0 bayt bildiriyor. Bağımsız dosya listeleme, OIDC'nin development ortamında etkin olmaması nedeniyle reddedildi; bu depo için tam liste doğrulaması iddia edilmiyor. Canlı 15 dosyalık depo bundan etkilenmedi. Yetki veya ortam politikası değiştirilmedi.

Bu nedenle canlı veritabanı ve üretim dosyaları doğrulanmış olsa da tüm harici başvuruları ve bütün ortam sırlarını içeren eksiksiz uygulama kurtarma seti henüz tamamlanmış değildir.

## Kısa geri yükleme

1. SSD'deki `SHA256SUMS` ile `.dmg` bütünlüğünü kontrol edin. Disk görüntüsünü macOS'ta açıp parolayı güvenli pencerede girin. İçindeki `MANIFEST.json` dosya yollarını, boyutlarını ve SHA-256 değerlerini içerir.
2. Kaynak kodunu yeni boş klasöre `backup-2026-10-21` etiketinden alın. İlk yedekte temiz `npm ci`, derleme ve testler doğrulanmıştı; bu tur kaynak kodu veya bağımlılıklar değiştirilmedi.
3. PostgreSQL 18'de **yeni boş test veritabanı** oluşturun. Başarılı döküm yolu görüntü içinde `2026-10-21-live-retry/postgres18/production-postgres.dump` dosyasıdır. Aynı üst klasördeki ilk PostgreSQL 17 denemesinin boş/başarısız dosyasını kullanmayın.
4. Testte `pg_restore --exit-on-error --single-transaction --no-owner --no-acl` ile yalnızca yeni veritabanına yükleyin. Bu seçenekler test sahibi için rol/izin eşlemesini atlar; orijinal sahiplik/ACL bilgisi dump'ta korunur. Gerçek kurtarmada yetki eşlemesini ayrıca uygulayın.
5. `blob-manifest.json` içindeki özgün yol ve içerik türleriyle `blob-files/*.blob` dosyalarını yeni hedef depoya alın. Depo alan adı değişirse veritabanındaki URL referanslarını uyarlayın. Dosya sayılarını ve hashleri tekrar kontrol edin.
6. Eksik Secret değerlerini güvenli kaynaktan tamamlayın. Ortam dosyalarını ve veritabanını Git'e eklemeyin. Admin, içerik, görseller ve form akışını izole test ortamında doğrulamadan canlıya geçmeyin.

## Önceki güvenlik çalışması ve Git durumu

Mevcut güvenlik dalı `codex/security-followup-2026-10-21`, commit `26be65cd9f1bb17edeec92809591b9ac0580d2ed` korunmuştur. Uyumlu DOMPurify override'ı ve başlık testleri önceki turda tamamlandı; paketlenmiş Monaco sanitizer riski, braces ve esbuild bulguları tamamen çözülmüş sayılmaz. Önceki son audit: toplam 13 yüksek/6 orta; üretim bağımlılıkları 10 yüksek/6 orta. Bu tur yeni audit veya güvenlik yaması uygulanmadı.

Kaynak yedek dalı `codex/backup-2026-10-21`, commit `9d23072e06fcb011f96d53b79ad73a76bfc48d8e`, etiket `backup-2026-10-21` değişmedi. Canlı dağıtım, main'e birleştirme, geçmiş silme veya force push yapılmadı. Bu rapor ve özel veriler bu tur GitHub'a gönderilmedi.

Yöntem belgeleri: [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [Vercel Blob SDK listeleme](https://vercel.com/docs/vercel-blob/using-blob-sdk).
