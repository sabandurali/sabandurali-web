# 21 Ekim 2026 yedeği ve geri yükleme

## Kapsam ve sınırlar

Kaynak proje: `sabandurali/sabandurali-web`; başlangıç commit'i
`d47df10d773fc6a7b2f491e5df24cbe889d9d60d` (`main`). Depo işlem başında
herkese açıktı; görünürlüğü değiştirilmedi. Yedek dalı
`codex/backup-2026-10-21`, etiket `backup-2026-10-21`.

GitHub yedeği kaynak kodunu, statik içerikleri, mevcut görsel/tasarım
varlıklarını, migration dosyalarını, package-lock.json ve yapılandırmaları
içerir. Geçmiş raporlar, yerel Python ortamı, veritabanları, gerçek ortam
dosyaları ve özel yedekler GitHub kapsamı dışındadır. Tarihsel raporlar kişisel
veri içerebildiğinden özel arşivde korunur. Bir testteki kişisel e-posta
literali yalnızca yayımlanan kopyada genel bir Gmail kontrolüne dönüştürülür.
Eski kişisel verileri Git geçmişi üzerinden taşımamak için GitHub yedeği
bağımsız bir kök commit'tir. Orijinal Git geçmişi özel arşivde korunur.

Özel yerel yedek: proje altındaki `.private-backups/2026-10-21/`.
Üst dizin yalnızca kullanıcı erişimine açıktır (0700). Arşivler uygulama
düzeyinde şifrelenmemiştir; aynı diskteki kopya disk kaybına karşı koruma
sağlamaz. Ayrı şifreli diske/özel depolamaya kopyalanmalıdır; GitHub'a
yüklenmemelidir.

- `original-workspace-private.tar.gz`: değişiklik öncesi çalışma klasörü,
  `.git`, `.env.local`, `.data`, geçmiş raporlar ve `ml-env` dahil.
  Yeniden üretilebilir `node_modules` ve `.next` hariçtir.
- `payload.sqlite`: SQLite backup API ile tutarlı alınan yerel veritabanı.
  `PRAGMA integrity_check` sonucu `ok`.
- `public-cms-export/`: canlı sitenin yalnızca herkese açık API verileri;
  39 ilçe, 2 sayfa, 15 fotoğraf kaydı, 5 koleksiyon, 4 kategori,
  15 medya kaydı ve bunların 15 fiziksel dosyası. Dosya SHA-256 değerleri
  `manifest.json` içinde. Bu dışa aktarım bir PostgreSQL dump'ı değildir.
- Kontrol kayıtları ve SHA-256 listesi aynı özel klasörde tutulur.

Tam canlı PostgreSQL dökümü, kullanıcı hesapları/parola hash'leri, oturumlar,
taslaklar/sürümler, Blob deposunda API'de görünmeyen dosyalar, gerçek canlı
ortam sırları ve Formspree başvuruları yedeklenemedi. Vercel proje ortam
değişkenleri hem bağlı araçta hem mevcut yerel oturumda HTTP 403 verdi.
Formspree için yetkili bağlantı bulunmuyor. Önceki raporda anılan Neon yedeğinin
güncel erişilebilirliği doğrulanmadı; bugünkü tam yedek sayılmaz.

## GitHub kaynağını temiz klasörde kurma

Node.js 24.21.0 ve npm 11.19.0 kullanın:

```sh
git clone --branch backup-2026-10-21 --single-branch \
  https://github.com/sabandurali/sabandurali-web.git site-restore
cd site-restore
npm ci --no-audit --no-fund
cp .env.example .env.local
mkdir -p .data public/media
```

Bu komutlar yeni, boş hedef içindir. Mevcut dosyaların üzerine kopyalamayın.
`.env.example` içindeki tüm değerler bilinçli olarak boştur. Yerel doğrulama
için `.env.local` içine `PAYLOAD_DATABASE=sqlite`, `PAYLOAD_STORAGE=local`,
`DATABASE_URL=file:./.data/payload.db` yazın. ARTICLE/BOOK/PAGE/NAVIGATION/PHOTO
`_PUBLIC_SOURCE` değişkenlerini `static` yapın. Yeni bir yerel `PAYLOAD_SECRET`
üretin; örneğin `openssl rand -hex 32`. Canlı bağlantı bilgilerini veya
PRODUCTION_* onaylarını bu denemede kullanmayın.

Özel yedekteki `payload.sqlite` dosyasını yeni hedefin `.data/payload.db`
yoluna kopyalayın. SQLite kopyasını yeniden `PRAGMA integrity_check` ile
kontrol edin. Yerel kullanıcı verilerinin aynen geri dönüşü için özel arşivdeki
asıl `.env.local` dosyası da güvenli biçimde geri alınabilir; içeriğini paylaşmayın.

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
```

Bu, yerel/static kaynaklarla doğrulamadır; canlı PostgreSQL/Blob birleşiminin
geri yükleme testi değildir. `npm run vercel:build`, production import ve
migration komutlarını doğrulama amacıyla çalıştırmayın. Yedek dalının otomatik
Vercel dağıtımı `vercel.json` ile kapalıdır.

## Özel arşiv ve canlı sistem

Önce `shasum -a 256 -c SHA256SUMS` ile dosyaları doğrulayın. Özel arşivi yalnızca
yeni boş, 0700 izinli bir klasöre açın; orijinal proje üzerine açmayın. Bu
arşiv yerel Git geçmişini ve Git'e eklenmemiş çalışmaları da geri getirir.
Çalışan SQLite dosyasının ham kopyası yerine tutarlı `payload.sqlite` kullanın.

Canlı geri yüklemenin tamamlanması için yetkili Vercel/Neon erişimiyle ayrı
`pg_dump -Fc` yedeği alınmalı; ayrı boş PostgreSQL veritabanında
`pg_restore --no-owner --no-acl` ve tablo/kayıt kontrolleri yapılmalıdır.
Blob deposunun tüm nesneleri listelenip indirilerek sayım ve hash karşılaştırması
yapılmalıdır. Yeni Blob adresleri oluşursa CMS referansları eşlenmelidir.
Formspree başvuruları ayrıca özel konuma dışa aktarılmalıdır. Bunlar bu işlemde
tamamlanmadı. Herhangi bir canlı geri yükleme veya dağıtım yapılmadı.

## Doğrulama sonuçları

- Temiz klasörde `npm ci --no-audit --no-fund`: başarılı, 743 paket.
- `npm run build`: başarılı; TypeScript kontrolü ve 71 statik sayfa üretimi geçti.
- `npm run lint`: başarılı.
- Migration guard testleri: 14/14 başarılı.
- Kişisel adres içermeyen snapshot üzerindeki package-01 testleri: başarılı.
- SQLite integrity_check, özel arşiv okunabilirliği, Git bundle verify ve
  15 medya dosyasının SHA-256 kontrolleri: başarılı.
- Gitleaks 8.30.1: mevcut geçmiş ve yayınlanacak son kaynak kopyasında 0 bulgu.
- İlk sandbox derlemesi ilerlemediği için durduruldu; Google Fonts ağ erişimli
  ikinci deneme başarılı oldu. İlk tsx CLI denemesi IPC iznine takıldı;
  `node --import tsx --test` ile testler başarıyla tamamlandı.
- Canlı PostgreSQL/Blob tam geri yüklemesi ve Formspree geri yüklemesi: doğrulanamadı.
