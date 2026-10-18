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

## Claude entegrasyonu — Aşama 17

Sunucu modülü `server-only` ile istemci importuna kapalıdır. Sabit Anthropic endpoint'lerine doğrudan HTTPS kullanılır; SDK/abonelik eklenmedi. Gerçek çağrı yapılmadı. Ücretsiz demo (varsayılan) ve onaylı **yerel** Claude pilotu birbirinden ayrıdır. Vercel'de ücretli çalışma kod düzeyinde kapalı kalır.

Ayrıntılı onay, limit, fiyat ve paylaşım planı: [CLAUDE-PILOT.md](CLAUDE-PILOT.md).

Claude'a yalnız soru ve en fazla altı kaynaklı kamu alıntısı; alıntı kimliği, ilçe, başlık, tarih ve kaynak kimlikleri gönderilir. Modele CMS, medya, özel veri veya araç erişimi verilmez. Model yalnız alıntı kimlikleri seçer; uygulama orijinal metinleri ve önceden doğrulanmış kaynak bağlantılarını gösterir. Yeni iddia veya serbest model metni gösterilmez. Karşılaştırmada iki ilçe de temsil edilmezse sonuç reddedilir. Bilgi yoksa açık kapsam dışı mesajı döner.

## Sınırlar

- 1–2 farklı ilçe, 4–600 karakter soru, 4096 bayt istek; süreç başına 20 istek/dakika.
- Claude pilotu: 5 deneme/dakika, eşzamanlı 1 çağrı; açık onayla en fazla 100 deneme ve en fazla 24 saat. Bütçe ayarı 0.0015–1 USD, her denemede 0.0015 USD tahmini rezerv; başarısız denemede iade yok.
- 24 KB model bağlamı; ücretsiz token ön sayımı 6000 giriş token'ını aşarsa ücretli çağrı yok. Sayım sağlayıcıya göre tahmindir.
- Çıkış en fazla 800 token (düşünme dahil), düşük düşünme eforu; sayım + üretim + yanıt okuma için toplam 20 saniye, yanıt en fazla 32 KB. Otomatik tekrar yok. İstemci 25 saniyede bırakır; sunucuya ulaşan iptal sinyali upstream'e aktarılır. İptal, sağlayıcı ücretinin sıfırlanacağı anlamına gelmez.
- Same-origin ve yerel loopback Host; Preview yalnız doğru asistan dalı/host'u. Production ve diğer dallar reddedilir. API cevapları `no-store`, hatalar gizli sağlayıcı metni içermez.
- Süreç başlatılınca sayaçlar sıfırlanır. Çoklu süreç/yeniden başlatma/sağlayıcı fiyatı/sayım farkı nedeniyle **kesin hesap harcama limiti değildir**. Gerçek pilot, Console bütçe ayarlarının kontrolü ve insan gözetimi gerektirir.
- Preview yalnız demo rotalarını sunar; `/admin` ve CMS API'leri kapalıdır. `noindex` erişim kontrolü değildir; Vercel Authentication korunur. Kaynaklara giderken paylaşım token'ı referrer ile aktarılmaması için `no-referrer` ve dış bağlantılarda `noreferrer` kullanılır.

## Sonraki adım

Yerel geliştirme tamamlandıktan sonra ayrı onayla gerçek model pilotu ve/veya güncel ücretsiz Preview paylaşımı yapılabilir. Başvuru gönderilmez; programın açık olması ve şirket bilgilerinin doğruluğu ayrıca kontrol edilir. Production/CMS/migration gerekmez.
