# Yerel geliştirme

## Gerekli yerel ortam

- Node.js 24, en az 24.22.1. Sürüm `package.json` içindeki `engines` alanında ve `.nvmrc` dosyasında tanımlıdır; nvm kullanıyorsanız `nvm use` yeterlidir. Payload 3.92 bu güvenlik sürümünü şart koşar.
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
