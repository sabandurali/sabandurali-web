# İstanbul Araştırma Asistanı — yerel ve Preview prototipi

Başlangıç: `main` / `dc798d5e338334c01123e10d14fe5a31973d73be`.
Dal: `codex/istanbul-research-assistant`.

## Çalıştırma

Bu worktree'de bağımlılıklar mevcut. Yeni kurulumda kilit dosyasını koruyarak `npm ci` kullanın. Proje köküne Production/Preview `.env` dosyası kopyalamayın.

```sh
node scripts/assistant/local.mjs test
node scripts/assistant/local.mjs types
node scripts/assistant/local.mjs lint
node scripts/assistant/local.mjs build
node scripts/assistant/local.mjs start
```

Demo: http://127.0.0.1:3215/istanbul-asistani
English product introduction: http://127.0.0.1:3215/en/istanbul-research-assistant

Launcher sadece PATH/HOME/TMPDIR sistem değerlerini geçirir; sırları, Vercel ayarlarını ve Claude anahtarını devralmaz. Beş içerik kaynağı statik, depolama local, SQLite URL'si bellek içidir. Araştırma API'si Payload veya veritabanı modülü çağırmaz. `.env` dosyası varsa launcher durur. Next build kullanılır; migration içerebilen `vercel:build` çalıştırılmaz. Dev/start yalnız 127.0.0.1'e bağlanır. Build için mevcut Next Google fontlarının indirilmesi gerekebilir.

## Veri ve kaynak sınırı

- Kamuya açık yayımlanmış API'den 39 rehber; 391 kaynak **kaydı**, benzersiz kaynak sayısı değildir.
- `public-guides.json` yalnız slug, yayımlanma/güncelleme tarihleri, kamu URL'si, editoryal olarak incelenmiş metin bölümleri ve kaynak metaverilerini içerir.
- Veritabanı yedeği değildir. CMS kullanıcıları, taslaklar, kimlik bilgileri, medya dosyaları, facts ve marketData alınmaz.
- Kamu API'sindeki güncelleme aralığı: 27 Eylül 2026. Alım anı JSON'daki `retrievedAt` UTC değeridir.
- Kaynak URL protokolü/yapısı, 39 ilçe kapsamı, yayın durumu ve kaynak kimlikleri doğrulanır. Kaynakların tümü yeniden ziyaret edilmedi; editoryal `checkedAt` bağımsız yeni bir teyit değildir.
- Kaynak eşleştirmesi bölüm düzeyindedir. Bu, her cümlenin her bağlantıyla kanıtlandığı anlamına gelmez. Bu sınır arayüzde görünür.
- `node scripts/assistant/snapshot.mjs` yalnız manuel, bilinçli yenilemedir. Sabit kamu endpoint'ine anonim GET yapar, 39 yayın ve güvenli kaynak URL'leri bekler, sadece demo JSON'unu yazar. Otomatik Production bağlantısı yoktur.

## Yanıt akışı

TR soru → geçerlilik/kota/origin kontrolü → seçili 1–2 ilçe ve konu eşleştirmesi → kaynaklı alıntılar → orijinal rehber + ilgili kaynaklar.

Yerel mod anahtar sözcük temelli seçicidir, dil modeli değildir. Ulaşım, tarih, yaşam, konum, konut dokusu, gezi, araştırma başlıkları ve genel özet desteklenir. Karşılaştırma alıntıları yan yana sunar; sıralama/puan/çıkarım üretmez. Sorular kaydedilmez, analitik servisi eklenmemiştir.

Canlı/nicel/yüksek riskli sorularda yanıt vermekten kaçınır. Bazı geçerli sorular kelime eşleştirmesi nedeniyle yanıtsız kalabilir. Bu prototip sınırıdır; serbest sohbet veya profesyonel yatırım danışmanı değildir.

## Claude entegrasyonu — hazır, gerçek çağrı yapılmadı

Resmî Messages API: https://platform.claude.com/docs/en/api/messages/create

Sunucu tarafındaki `claude.ts`, sabit `https://api.anthropic.com/v1/messages` endpoint'ini kullanır. API key yalnız header'da, model yalnız sunucu ayarında; istemciye gönderilmez. SDK veya yeni servis eklenmedi.

Sonraki onaylı pilotta gereken **sunucu** değişkenleri:

| Ad                      | Gereken değer                                             | Varsayılan davranış    |
| ----------------------- | --------------------------------------------------------- | ---------------------- |
| ASSISTANT_ENABLE_CLAUDE | Açık maliyet onayından sonra `true`                       | Kapalı                 |
| ANTHROPIC_API_KEY       | Kullanıcının Console'da güvenli oluşturduğu gizli anahtar | Yok                    |
| ANTHROPIC_MODEL         | Console'da erişimi doğrulanmış tam model kimliği          | Yok; model varsayılmaz |

Yerel launcher bu değişkenleri bilerek geçirmez; anahtar eklemek tek başına gerçek çağrı başlatmaz. Ücretli pilot için ayrıca onaylanmış başlatma işlemi gerekir. Vercel ortamında gerçek Claude çağrısı kod düzeyinde kapalıdır. Yalnız korumalı asistan Preview dalında ücretsiz kaynak seçici açıktır. Gerçek Claude pilotunda bu kilidin kontrollü açılması, kimlik doğrulama ve dağıtık kota/bütçe tasarımının tamamlanması gerekir.

Claude'a yalnız soru ve en fazla 6 kamu metni (id, text, updatedAt) gönderilir. Model yalnız ilgili alıntı kimliklerini seçer. Bilinmeyen/tekrarlı kimlikler, tek taraflı karşılaştırma, kesilmiş/bozuk yanıt reddedilir; serbest üretilen metin gösterilmez. Böylece yeni istatistik/iddia eklenmez. Bu yaklaşım güvenli ilk prototiptir; gerçek Claude ile anlamsal başarı henüz ölçülmedi.

## Sınırlar ve korumalar

- 1–2 farklı ilçe, 4–600 karakter soru, 4096 bayt istek, süreç genelinde 20 istek/dakika.
- Same-origin + yerelde loopback Host; Preview’da yalnız VERCEL_URL/VERCEL_BRANCH_URL ve tam asistan dalı kabul edilir. Production ve başka dalların API erişimi reddedilir.
- Claude 400 çıkış token'ı, 20 saniye timeout, tek istek; otomatik tekrar yok.
- Hatalarda 400/403/413/415/429/502, gizli upstream hata gövdesi gösterilmez. İstemcide 25 saniye timeout.
- Dağıtık kota veya kesin parasal bütçe kontrolü değildir; süreç yeniden başlarsa sayaç sıfırlanır. Genel erişim veya ücretli pilot öncesi Console harcama sınırı ve kimlik doğrulama gerekir.
- Demo sayfaları noindex; bu tek başına erişim koruması sayılmaz. `vercel.json` yeni dalın otomatik deployment'ını kapatır. Preview yayın yöntemi ve dal ayarları PREVIEW.md dosyasındadır.

## Sonraki adım

Korumalı Preview demosunu değerlendirin. Gerçek Claude pilotu için model, harcama üst sınırı, kimlik doğrulama/kota ve güvenli anahtar yönetimine ayrı onay gerekir. Başvuru gönderilmedi. Production/CMS/migration işlemi bu prototip için gerekli değildir.
