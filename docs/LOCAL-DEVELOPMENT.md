# Yerel geliştirme

## Gerekli yerel ortam

- Node.js 24, en az 24.22.1 (Payload 3.92 bu güvenlik sürümünü şart koşar). Alt sınır `package.json` içindeki `engines` alanındadır; `.nvmrc` aynı sürümü tam olarak (`24.22.1`) yazar ve CI bu sürümle çalışır. nvm kullanıyorsanız `nvm install` çalıştırın: `.nvmrc` dosyasını okur, bu sürümü gerekirse kurar ve etkinleştirir. Daha yeni bir 24.x de desteklenir. `scripts/package-scripts.test.ts` iki değerin ayrışmasını yakalar. `node --version` 24.22.1'in altındaysa önce Node'u güncelleyin; `npm` bunu henüz kendiliğinden durdurmaz (bkz. `docs/NEXT-STEPS.md`, sahip kararları).
- npm 11 (Node.js 24 ile gelir) ve Git gereklidir.

## İlk kurulum

1. Depoyu Git ile klonlayın ve proje dizinine geçin.
2. `node --version` ve `npm --version` ile sürümleri kontrol edin.
3. Kilit dosyasındaki bağımlılıkları kurun:

   ```sh
   npm ci
   ```

4. İlk kurulumda `.env.example` dosyasını `.env.local` olarak kopyalayın. Mevcut `.env.local` dosyasının üzerine yazmayın. Örnek dosya çalışan yerel varsayılanları içerir: SQLite, yerel medya ve `static` içerik kaynakları. Sondaki production onay değişkenleri yalnızca isim olarak listelenir; bunları yerelde asla tanımlamayın.
5. Yalnızca yerelde kullanılacak bir `PAYLOAD_SECRET` üretin:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Üretilen değeri `.env.local` içindeki `PAYLOAD_SECRET` alanına yazın. Gizli değeri Git'e eklemeyin veya paylaşmayın.

6. `.env.local` içinde yerel sağlayıcıları koruyun:

   ```dotenv
   PAYLOAD_DATABASE=sqlite
   PAYLOAD_STORAGE=local
   DATABASE_URL=file:./.data/payload.db
   ```

   Terminal ortamında bu değerleri geçersiz kılan production değişkenleri bulunmamalıdır. `BLOB_READ_WRITE_TOKEN` yerelde boş kalabilir. Ön yüz içerik kaynakları başlangıçta `static` kalabilir; `/admin` için değiştirmek gerekmez.

7. Yerel dizinleri hazırlayın ve geliştirme sunucusunu başlatın:

   ```sh
   mkdir -p .data public/media
   npm run dev -- --hostname 127.0.0.1
   ```

8. Ana siteyi [http://127.0.0.1:3000](http://127.0.0.1:3000), CMS'yi [http://127.0.0.1:3000/admin](http://127.0.0.1:3000/admin) adresinden açın. İlk CMS başlatmasında SQLite veritabanı ve geliştirme şeması oluşturulur. Yeni veritabanında ilk yerel yönetici hesabını oluşturun; mevcut veritabanında mevcut hesabınızla giriş yapın. Bu akış için migration komutu çalıştırmayın.

## Yerel veriler ve production ayrımı

SQLite veritabanı `.data/payload.db`, yüklenen medya `public/media` altında tutulur. Bu yerel dosyalar ve `.env.local` bilinçli olarak Git tarafından takip edilmez; dizinlerdeki `.gitkeep` dosyaları takip edilebilir. Mevcut veritabanını veya medya dosyalarını silmeyin.

Yerel kurulum production Neon/PostgreSQL, Vercel ve Vercel Blob ayarlarından ayrıdır. Production bağlantı bilgilerini yerel ortama kopyalamayın. Bu kurulum production servisine bağlanmaz ve yerel verileri production'a aktarmaz.

## Kontroller

Pull request açmadan önce tüm kontrollerin geçtiğini doğrulayın:

```sh
npm run check
```

Bu komut sırasıyla `typecheck`, `lint`, `format:check`, `test` ve `build` çalıştırır. `npm test` birim testlerini, ilçe içerik kabul kontrolünü ve tüm migration'ların bellekteki PGlite veritabanında yeniden oynatılmasını kapsar; canlı bir servise bağlanmaz. Aynı adımlar GitHub Actions'ta (`.github/workflows/ci.yml`) her pull request için çalışır. Biçim hatalarını `npm run format` düzeltir.

### Detay şablonlarını CI fixture'larıyla denetleme

Statik build hiçbir makale, kitap, fotoğraf veya CMS sayfası yayımlamaz. Detay şablonlarını CI'daki gibi denetlemek için açıkça "CI test kaydı" diye işaretli kurgusal kayıtlar ayrı bir SQLite dosyasına yazılır. Betik yalnız `.data/` veya sistemin geçici dizinindeki boş bir SQLite dosyasına yazar, Vercel'de çalışmaz ve üretilmiş test görselini `public/media` altına (Git dışı) koyar:

```sh
export PAYLOAD_DATABASE=sqlite PAYLOAD_STORAGE=local \
  DATABASE_URL=file:./.data/ci-fixtures.db PAYLOAD_SECRET=yerel-test \
  ARTICLE_PUBLIC_SOURCE=payload BOOK_PUBLIC_SOURCE=payload \
  PAGE_PUBLIC_SOURCE=payload PHOTO_PUBLIC_SOURCE=payload
npm run ci:seed-fixtures
npm run dev -- --hostname 127.0.0.1 --port 3102
# ikinci terminalde:
A11Y_FIXTURES=1 A11Y_TEST_URL=http://127.0.0.1:3102 npm run e2e:a11y
```

`A11Y_FIXTURES=1`, her detay türüne listesinden ulaşılmasını şart koşar; ulaşılamayan tür kontrolü başarısız kılar. Statik build'de aynı şartı `A11Y_REQUIRE_DETAILS=1` açar. Yeniden çalıştırmak için önce `.data/ci-fixtures.db` dosyasını silin; betik dolu bir veritabanına yazmayı reddeder.
