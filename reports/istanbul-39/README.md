# İstanbul 39 İlçe — yerel çalışma

Ana sözleşme: `CODEX_39_ILCE_MASTER_TALIMAT.md`. Keşif: [discovery.md](discovery.md).

## Mimari ve veri sınırı

Tek merkezi registry ve mevcut `district-guides`, `articles`, `photos` koleksiyonları korunur. Yeni collection veya paralel URL ailesi yoktur. `data/districts/research.json` public veri kaynağı değildir; yalnız import aracının okuduğu, 39 PDF'den üretilmiş **doğrulanmamış araştırma ara verisidir**. Next uygulaması bu dosyayı import etmez. PDF binary dosyaları repoya alınmaz.

DistrictGuides içinde summary/geography/placesGuide/distinctiveFeatures/researchTopics, bölüm onayları, kaynaklar ve public dışı araştırma/provenance alanları eklendi. Eski metin, facts, neighborhoods, marketData ve planningDevelopments alanları kullanılmaya devam eder. News ve Photos ilişkilerinde schema değişikliği yoktur.

## Kaynak ve yayın kuralları

- PDF içinde bir kurum adının geçmesi, URL'nin o kuruma ait olduğunu veya iddianın doğrulandığını göstermez. Kaynak yayıncısı gerçek URL hostundan çıkarılır; bütün otomatik kayıtlar `unclassified`, `primary:false`, `needsVerification:true` başlar.
- URL'ler PDF hyperlink annotation kayıtlarından alınır; satır sonunda bölünen adresler tahminle birleştirilmez. Belirsiz eşleşme public kaynak onayına dönüşmez.
- Ham metinlerde atıf numaraları ve tabloların metin dökümü bulunur. Bunlar yayın metni olarak kabul edilmemiştir. Mahalle/imar ham notları public dışı `researchNotes` alanındadır.
- Kaydı yayımlamak için en az summary/history/geography alanlarının düzenlenmesi, ilgili bölümlerin onaylanması ve bunları destekleyen kaynakların kontrol edilmesi gerekir.
- Diğer her bölüm public için kendi bölüm onayını ve kaynağını gerektirir. Onaylanmayan alanlar anonim REST/GraphQL yanıtlarında da gizlenir.
- B sınıfı facts/neighborhoods/transportation için kaynak veri tarihi ve son kontrol tarihi gerekir. Facts/neighborhoods için birincil resmî kaynak aranır.
- Piyasa/imar için ayrıca **her satırın** URL'si, veri tarihi, kontrol tarihi ve `needsVerification:false` değeri kontrol edilir. Dinamik veriler en fazla 90 günlük veri/kontrol penceresinde görünür. Bu koruyucu süre mevcut uygulamanın yeni editoryal politikasıdır; proje kaynağının kendi tarihi yerine geçmez.
- Resmî kaynak etiketi `.gov.tr`, `.bel.tr` ve ilgili İBB/ulaşım kurumlarının alan adlarıyla sınırlandırılır. Üçüncü taraf nüfus platformuna TÜİK etiketi vermek kapıyı geçirmez.
- Slug oluşturulduktan sonra değiştirilemez. TR düzenlenir; EN otomatik üretilmez ve TR fallback kullanılmaz.
- Yayın durumu ve kaynak eskimesi her istekte yeniden değerlendirilir; ilçe route'ları build anındaki veriye sabitlenmez.

## Tekrarlanabilir araçlar

PDF dönüşümü için `pypdf` bulunan Python ortamı gerekir. Bu çalışma Codex'in dış runtime'ını kullandı; repo bağımlılığı eklenmedi.

```sh
python3 scripts/districts/extract-research.py --pdf-dir /path/to/pdfs --output data/districts/research.json
npm run district:import -- --offline-empty
npm run test:districts
```

`--offline-empty` mevcut CMS'yi okumaz; boş hedef varsayan sıfır yazmalı bir plandır. Gerçek dry-run değildir.

Gerçek import/dry-run **yalnız açıkça belirtilen izole yerel SQLite dosyasında** çalışır. Asıl `.data/payload.db` ve ona işaret eden symlink korunur. `.env` dosyaları değiştirilmez. Script canlı bağlantı kullanamaz; config yüklenmeden önce SQLite/local ayarlarını süreç içinde zorlar. Bu sınırlama kasıtlıdır; production import aracı olarak kullanılmamalıdır.

```sh
npm run district:import -- --database /absolute/path/to/isolated.db --dry-run
npm run district:import -- --database /absolute/path/to/isolated.db --apply
npm run district:import -- --database /absolute/path/to/isolated.db --dry-run
```

Dry-run önceden hazırlanmış schema bekler, schema push yapmaz. `--apply`, yalnız izole yerel SQLite hedefinin development schema'sını hazırlar. Gerçek dry-run için schema henüz hazır değilse bağlantı/kolon hatasıyla durur; başarı taklidi yapmaz.

Slug bazlı import: olmayan kaydı draft oluşturur; yönetilmeyen veya elle değiştirilen kaydı atlar; published kaydı korur. Daha önce aktarılan draft'ın sahip olunan alanları değişmediyse kaynak/dönüşüm değişimini günceller. İkinci aynı çalıştırma 0 create/0 update/39 skip verir. Payload'ın kaydettiği normalize alanların fingerprint'i tutulur; PDF hash'i ile ara veri fingerprint'i ayrı izlenir. Editoryal onay ve kaynak düzenlemeleri de korunan alanlara dahildir.

## Migration

Yeni additive PostgreSQL migration: `20260909_181042_istanbul_district_sources`. Altı yeni tablo, altı yeni enum, mevcut iki status enum'una üçer değer, 22 yeni kolon, altı foreign key ve 12 index. Nullable/default alanlar mevcut kayıtları silmez. `down` veri silmeden hata verir. PostgreSQL schema push kapalı kalır. Production migration **çalıştırılmadı**.

İzole PGlite kontrolü dışarıdaki paketi kullanır; canlı Postgres veya Neon'a bağlanmaz:

```sh
PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node scripts/districts/check-postgres.mjs
npm run test:districts:cms -- /tmp/istanbul-39-audit/payload-test.db
```

PGlite SQL uyumluluk testidir; gerçek Neon migration/rollback tatbikatı değildir. SQLite test kopyasının migration geçmişi production'a taşınmaz.

## Tarayıcı kabulü

Playwright bulunan dış runtime ve yerel Chrome gerekir. Aşağıdaki araç yalnız localhost/127.0.0.1 hedeflerine izin verir:

```sh
BROWSER_PACKAGE=/absolute/path/to/playwright/package.json DISTRICT_TEST_URL=http://localhost:3017 DISTRICT_TEST_OUTPUT=/tmp/istanbul-39-acceptance npm run test:districts:routes
```

39 detay + 39 haber, ana merkez, geçersiz slug 404, alternatif rehber 308, canonical/OG/TR hreflang/breadcrumb/sitemap, 1440/820/390 overflow, boş fotoğraf, arama/filtre ve regresyon girişleri test edilir. Authenticated Admin form etkileşimi bu test değildir; CMS Local API testleri ayrıca çalışır. Yerel sentetik yayın fixture'ları test sonunda geri alınır ve teslim içeriği değildir.

## Üretim kapısı

Teknik test başarısı 39 içeriğin editoryal kabulü değildir. Araştırma PDF'lerinin doğrudan import edilmesi yalnız draft oluşturur. Her ilçenin metni düzenlenip destekleyici kaynakları kontrol edilmeden, resmî mahalle listesi doğrulanmadan ve açık kaynak/iddia uyuşmazlıkları giderilmeden içerik kabulü verilemez. Güncel teslim durumu [GO-NO-GO.md](GO-NO-GO.md) dosyasındadır.

## Bu devam çalışmasının onaylı girdisi

```sh
npm run test:districts:content
npm run district:import -- --database /tmp/istanbul-39-audit/editorial-test.db --editorial data/districts/editorial.json --dry-run
npm run district:import -- --database /tmp/istanbul-39-audit/editorial-test.db --editorial data/districts/editorial.json --apply
```

`--editorial` verilmezse eski ham araştırma/draft davranışı korunur. Verilirse 39 ilçe ve PDF hash’leri eşleştirilir, bölüm kaynak kapıları denetlenir ve aynı yönetilen draft kayıtları güncellenir. Elle düzenlenmiş veya yayımlanmış kayıtlar yine korunur. Gözden geçirilmiş metin bile import tarafından otomatik yayımlanmaz.

`check-editorial-cms.ts`, yalnız sabit `/tmp/istanbul-39-audit/editorial-test.db` test kopyasında, güncel editoryal import ve idempotency kontrolünden **sonra** çalıştırılır. 39 kaydı bu atılabilir kopyada yayımlar ve anonim okuma sınırını test eder. Bu dosya production yayın aracı değildir. Tekrar testi için yönetilen draft kopyası yeniden hazırlanmalıdır.

```sh
npx tsx scripts/districts/check-editorial-cms.ts /tmp/istanbul-39-audit/editorial-test.db
DISTRICT_TEST_URL=http://localhost:3018 DISTRICT_SOURCE_MODE=payload-reviewed-content DISTRICT_EXPECT_EDITORIAL=1 BROWSER_PACKAGE=/absolute/path/to/playwright/package.json npm run test:districts:routes
```

Gerçek CMS içerik testi geliştirme sunucusunda PAGE/ARTICLE/PHOTO_PUBLIC_SOURCE=payload ile; optimize build testi ayrı static-source sunucuda yapıldı. İkisi de izole SQLite kopyasını kullanır. Production altyapı korumasını aşmak için bir kod değişikliği yapılmadı.

Kaynak kapsamı ve bilinçli boş alanlar: [source-review.md](source-review.md). Makine tarafından yeniden çalıştırılan içerik kontrolü semantik araştırmanın yerine geçmez; onaylı veri ile kaynak inceleme kaydının ve public projection’ın uyuştuğunu doğrular. `source-inventory-audit.json` ise ham envanterin risk kaydıdır; 200 yanıtı güvenilirlik puanı değildir.
