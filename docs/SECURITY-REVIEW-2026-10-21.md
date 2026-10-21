# Güvenlik takibi — 21 Ekim 2026

Dal: `codex/security-followup-2026-10-21`. Başlangıç:
`d47df10d773fc6a7b2f491e5df24cbe889d9d60d`. İlk yedek dalı ve
`backup-2026-10-21` etiketi değiştirilmedi. Canlı dağıtım, main'e birleştirme,
geçmiş silme veya `npm audit fix --force` yapılmadı. Bu dal için otomatik
Vercel dağıtımı kapatıldı.

## Uygulanan değişiklikler

- Monaco'nun npm bağımlılığı olan DOMPurify, kapsamı yalnızca `monaco-editor`
  olan override ile 3.4.8 → 3.4.17 güncellendi. Ana framework/Payload/React
  sürümleri değişmedi. Kilitteki diğer altı ek kayıt npm'in opsiyonel Tailwind
  WASI paketinin gömülü bağımlılık metadatasıdır; mevcut sürümler yükseltilmedi.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
  `Referrer-Policy: strict-origin-when-cross-origin` ve kamera/mikrofon/konum
  erişimini kapatan Permissions-Policy eklendi. X-Powered-By kaldırıldı.
- CSP: `object-src 'none'; base-uri 'self'; frame-ancestors 'self';
  form-action 'self' https://formspree.io`.
  Bu politika çerçeveleme, eklenti nesneleri, base etiketi ve form hedeflerini
  sınırlar. **Script/XSS veya fetch/connect kısıtlaması sağlamaz.** Next.js
  statik hydration ve Payload/Monaco davranışını değiştiren katı nonce/script
  politikası ayrı çalışma gerektirir. Aynı origin iframe'leri korunur.
- Next.js görsel optimizasyon endpoint'i kendi daha kısıtlayıcı
  `script-src 'none'; frame-src 'none'; sandbox;` politikasını korur.

## Bağımlılık bulguları ve üretim etkisi

| Denetim | Önce | Sonra |
| --- | --- | --- |
| Tüm kilit | 13 yüksek, 8 orta; kritik 0 | 13 yüksek, 6 orta; kritik 0 |
| `--omit=dev` | 10 yüksek, 8 orta; kritik 0 | 10 yüksek, 6 orta; kritik 0 |

Bu sayılar transitif bağımlılık zincirindeki etkilenen paket sayılarıdır;
benzersiz açık sayısı veya kanıtlanmış üretim saldırısı sayısı değildir.

**DOMPurify — orta, yalnızca kısmen giderildi.** npm ağacındaki 3.4.17 artık
bildirilen açıkları taşımıyor. Ancak Monaco 0.56.0 kendi ESM klasöründe ayrı
DOMPurify 3.4.8 kodu da içeriyor; npm override bu gömülü kodu değiştirmez.
Payload UI'nin paketlenmiş Monaco yükleyicisi varsayılan olarak jsDelivr'dan
Monaco 0.55.1 yükler. Depoda bu loader ayarını değiştiren kod bulunmadı.
Dolayısıyla audit düşüşü tarayıcıdaki sanitizer'ın tamamen düzeldiğinin kanıtı
değildir. Kullanım alanı oturum gerektiren admin JSON/kod editörüdür; ilçe
aktarımı alanı salt okunurdur ve public erişimi rol kontrolüyle sınırlandırılır.
Saldırı için uygun zararlı editör/markdown girdisinin ilgili sanitizer yoluna
ulaşması gerekir; bunun istismar edilebilirliği doğrulanmadı. Gömülü/CDN
kopyalarını da güncelleyen upstream Payload/Monaco çözümü ayrı uyumluluk
çalışması olarak kalır; kör paket yükseltmesiyle kapatılmış sayılmadı.

**braces — yüksek, açık.** Registry'deki en yeni sürüm 3.0.3 ve bildirimde
yamalanmış sürüm yok. Sass/chokidar, glob ve storage araç zincirleri etkileniyor.
İncelenen uygulama kodunda kullanıcı girdisini doğrudan glob desenine aktaran
bir yol bulunmadı. Bu risk ortadan kalktı demek değildir; upstream düzeltmesi
izlenmeli. Next.js sunucu NFT dosya listelerinde bu paketler ayrı dosya olarak
görünmedi; paketlenmiş kod ve build zinciri nedeniyle bu tek başına yokluk kanıtı
değildir.

**esbuild — orta, açık.** Eski 0.18.20 sürümü Drizzle'ın eski esbuild-kit
yükleyicisinden geliyor; destek aralığı `~0.18.20`. Açık esbuild geliştirme
sunucusuyla ilgilidir. Uygulama esbuild serve API'sini çağırmıyor; üretim
başlangıcı `next start`. Esbuild-kit bağımlılığını zorla 0.25+ yapmak uyumlu
yama değildir; upstream araç zinciri değişikliği ayrı öneri olarak bırakıldı.

## Doğrulama

Node 24.21.0 / npm 11.19.0 ile temiz `npm ci`, üretim derlemesi (71 statik
sayfa), TypeScript ve lint başarılı. Mevcut package-01 ve migration guard
testleri: **22/22 geçti**.

`node scripts/security-headers-check.mjs http://127.0.0.1:3101` başarılı:
ana sayfa, iletişim, admin login, 404, statik JPEG ve optimize JPEG; tüm temel
başlıklar, uygun CSP ve görsel MIME türleri denetlendi. Anonim `/api/users`
isteği 403 döndü. İlk görsel testinde sayfa CSP'si beklenmişti; Next'in görsel
sandbox politikasının kasıtlı olduğu görülerek test bu güvenlik özelliğini
ayrıca doğrulayacak şekilde düzeltildi.

Boş, ayrı **yerel SQLite** üzerinde yalnızca yapay test hesabıyla:

- Tarayıcıda admin login → dashboard → ilçe düzenleyicisi → Monaco JSON
  alanı açıldı; yakalanan console warning/error yok.
- API üzerinden JPEG yükleme 201, görsel okuma 200; MIME image/jpeg ve nosniff
  doğrulandı. İzin verilmeyen SVG yüklemesi 400 ile reddedildi.
- Yüklenen JPEG tarayıcıda 1200×1500 görüntülendi.
- İletişim formu hydrate oldu; yapay geçerli alanlarla provider ID'si olmayan
  yerel kurulumun beklenen yapılandırma hata mesajı görüntülendi. Canlı
  Formspree'ye başvuru gönderilmedi. Gerçek teslimat/export doğrulanamadı.

Bu testler canlı PostgreSQL restore testi veya tam Blob envanter kontrolü
değildir. Canlı erişim 403, Formspree login ve harici disk eksikliği devam
etmektedir. Önceki 15 public Blob dosyasının hash'leri 15/15 eşleşmiştir.
Yedek ayrıntıları [geri yükleme raporunda](BACKUP-RESTORE-2026-10-21.md).

Ham denetim ve test kayıtları ana çalışma klasörünün Git dışındaki
`.private-backups/2026-10-21-followup/` dizinindedir. Hiçbir canlı sır okunmadı
veya Git'e eklenmedi. Yapay test veritabanı/ortam dosyası commit dışındadır.

## Kaynaklar ve kalan işler

- [DOMPurify IN_PLACE bildirimi](https://github.com/advisories/GHSA-55q2-fjhq-7xh7)
- [braces bildirimi](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [esbuild geliştirme sunucusu bildirimi](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- Next 16.4.2'nin yerel CSP/headers rehberleri ve kurulu Payload/Monaco kaynakları
  uygulama davranışını değerlendirmek için kullanıldı.

Katı script CSP/nonce mimarisi, gömülü/CDN Monaco sanitizer güncellemesi ve
Drizzle/esbuild-kit değişikliği ayrı uyumluluk testleriyle ele alınmalı.
Yedek tamamlanmadan ve canlı ortam uyumluluğu ayrıca doğrulanmadan bu dal
production'a dağıtılmamalıdır.
