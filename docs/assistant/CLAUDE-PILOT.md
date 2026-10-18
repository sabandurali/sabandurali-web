# Kontrollü Claude pilotu ve güvenli demo paylaşımı

18 Ekim 2026. Aşama 17 yerel değişiklikleri; gerçek API çağrısı ve erişim değişikliği yapılmadı.

## Model ve ücret

Model: **claude-haiku-5-5**. Kaynak kimliği seçimi/sınıflandırma için uygun, ekonomik bir aday; Türkçe anlamsal kalitesi canlı modelle henüz ölçülmedi. Model kullanılabilirliği kullanıcı Console hesabında ayrıca doğrulanmalıdır. Yedek modele otomatik geçiş yok.

Resmî Haiku 5.5 belgeleri: https://platform.claude.com/docs/en/models/haiku-5-5/overview
Geçiş/efor: https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide
Fiyat: https://platform.claude.com/docs/en/about-claude/pricing
Token ön sayımı: https://platform.claude.com/docs/en/build-with-claude/token-counting

100 bin token altı standart birinci taraf isteklerde 1 milyon giriş token'ı 0.10 USD, çıkış 0.50 USD. Önbellek, araç ve toplu istek kullanılmaz. Örnek 3000 giriş + 200 çıkış = **0.0004 USD**; 20 böyle çağrı ≈ **0.008 USD**. 6000 giriş + 800 çıkış nominal tavanı çağrı başına 0.001 USD. Sayım tahmin olduğu için kesin fatura tavanı değildir; her deneme için 0.0015 USD süreç içi rezerv uygulanır. 20 deneme için 0.03 USD rezervli oturum önerilir. Vergi/kur/kredi yükleme koşulları dahil değildir; abonelik açılmaz.

Uyarlamalı düşünme varsayılanı nedeniyle `output_config.effort=low`, `max_tokens=800`; sıcaklık/top_p/top_k gönderilmez. Kesilmiş/ret/bozuk yanıt güvenli biçimde reddedilir, otomatik ücretli tekrar yapılmaz. Kullanım sayıları başarılı yanıtta kullanıcıya tahmini bedelle gösterilir. Hata/iptal edilen çağrı da ücretlenebilir.

## Yalnız onaydan sonra yerel pilot

Normal `node scripts/assistant/local.mjs dev|start|build|test` anahtarı devralmaz ve Claude'u kapalı tutar. Ayrı `pilot` komutu vardır; onay olmadan çalıştırmayın. API anahtarını sohbete, komut argümanına, `.env` dosyasına veya Git'e yazmayın. Terminalin gizli giriş mekanizmasıyla yalnız o sürece aktarın; oturum bitince silin. Shell trace kapalı olmalı.

| Sunucu ortamı | Gereken değer |
|---|---|
| ASSISTANT_ENABLE_CLAUDE | `true` (varsayılan false) |
| ASSISTANT_CLAUDE_PILOT | `local` |
| ANTHROPIC_API_KEY | Kullanıcıya ait gizli Console API anahtarı; hiçbir NEXT_PUBLIC değişkeni yok |
| ANTHROPIC_MODEL | `claude-haiku-5-5` |
| ASSISTANT_CLAUDE_APPROVED_UNTIL | Onaylanan oturumun ISO bitiş zamanı; gelecek, en fazla 24 saat |
| ASSISTANT_CLAUDE_BUDGET_USD | Öneri `0.03`; süreç içi tahmini rezerv sınırı |
| ASSISTANT_CLAUDE_MAX_CALLS | Öneri `20`; başarısızlar dahil |

Önce normal izole build; sonra onaylı ortamla `node scripts/assistant/local.mjs pilot`. Yalnız 127.0.0.1:3215 üzerinde çalışır. Başka sunucu bu porttaysa durur. Tek süreç, gözetimli oturum kullanın; sayacı sıfırlamak için otomatik yeniden başlatmayın. Dev hot reload yerine production-mode local start kullanılır. Uygulama onay metnini kendisi doğrulayamaz: ortam ayarlarını yalnız yetkili işletici onaydan sonra oluşturmalıdır.

Console'daki gerçek kuruluş/workspace harcama ayarları ve model erişimi başlamadan kontrol edilir. Uygulama, faturalama hesabı genelinde sert limit vaat etmez. Ücretli Vercel özelliği bu aşamanın kapsamı değildir; dağıtık kimlik/kota olmadan açılmamalıdır.

## Haricî ücretsiz inceleme — erişim henüz açılmadı

1. Kullanıcı onayından sonra Aşama 17 değişikliklerini yalnız asistan dalına commit/push edip mevcut projeye **Preview** yayınla. Stage16 Preview bu sırada korunur; main/Production ayarları değişmez.
2. Dal kapsamındaki `ASSISTANT_DEMO_ONLY=true`, `ASSISTANT_ENABLE_CLAUDE=false`, statik içerik/bellek SQLite/local storage ayarlarını koru. Anahtar ekleme. Build guard yanlış dal/Production veya Claude anahtarında yayını reddeder. API hiçbir CMS/DB modülü çağırmaz.
3. Vercel Authentication açıkken **yalnız belirli Preview deployment için Shareable Link** oluştur. Authentication proje genelinde kapatılmaz. Link sahibine bu deployment için erişim istisnası verir; iletilebilir, kimlik doğrulamalı kişisel davet sayılmaz. Bu yüzden kullanıcı açık onayından önce link oluşturma.
4. Hobby hesabında toplam bir paylaşılabilir link kotası vardır; mevcut link varsa onu izinsiz iptal etme. Ücretli yükseltme yapma. Varsa mevcut korumalı erişimle inceleme veya kayıtlı demo alternatifi kullan.
5. Paylaşmadan anonim/oturumsuz tarayıcıda yalnız bu linkle TR/EN demo, ücretsiz API, kaynak bağlantıları; `/admin` ve CMS yollarının kapalı olduğunu kontrol et. Linki analitik, ekran görüntüsü veya açık dokümana koyma. Uygulamada içerik yazma rotası yoktur; kaynak siteler ayrı sistemlerdir. Vercel yorum aracı görünüyorsa inceleyene yorum yetkisi verilmediğini ayrıca kontrol et.
6. İnceleme bitince ilgili linki iptal et. Bu adım ayrı zamanlanmış otomasyon değildir. Otomatik süre sonu özelliği doğrulanmadan süreli erişim vaat edilmez.

Resmî kaynak: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links

Vercel plan kotası/kuruluşun link oluşturma izni henüz değiştirilmedi ve yeni paylaşım linki oluşturulmadı. Korumalı Preview'a erişim, herkese açık ürün yayını anlamına gelmez.

## Başvuru ve değerlendirme

TR tanıtım/başvuru: STARTUPS-APPLICATION-TR.md. EN: STARTUPS-APPLICATION-EN.md. Soru seti: EVALUATION.md.
Başvuru, şirket/kurucu/çekiş bilgileri doğrulanıp program yeniden başvuru kabul ettiğinde ayrıca onay gerektirir. Bu aşamada hiçbir gerçek kullanıcı, gelir, yatırım veya ortaklık iddiası yoktur.
