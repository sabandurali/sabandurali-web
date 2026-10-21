# Güvenlik incelemesi — 21 Ekim 2026

Bu inceleme bir sızma testi veya güvenlik garantisi değildir. Kod, kilit dosyası,
yerel Git geçmişi, herkese açık CMS API'si ve ana sayfanın HTTP başlıkları
incelendi. Yetkili canlı ortam yapılandırmasına erişim HTTP 403 ile engellendi.

| Önem | Bulgu | Sonuç / öneri |
| --- | --- | --- |
| Yüksek | npm audit: toplam 13 yüksek, 8 orta etkilenen paket; kritik 0. `--omit=dev`: 10 yüksek, 8 orta. | Dolaylı bağımlılık zincirleri sayımı çoğaltır; 21 ayrı açık değildir. Runtime istismar edilebilirliği kanıtlanmadı. |
| Yüksek | Tam canlı veri yedeği eksik. | PostgreSQL, özel Blob nesneleri, canlı sırlar ve Formspree başvuruları olmadan tam felaket kurtarma yapılamaz. |
| Yüksek | `braces <=3.0.3` iç içe desenlerle stack-exhaustion DoS; Payload/Blob/Sass ve geliştirme araçlarına transitif ulaşıyor. | Denetim tarihinde yamalı sürüm belirtilmiyor. Güvenilmeyen glob desenlerinin bu zincire ulaşması incelenmeli. |
| Orta | DOMPurify ve eski esbuild güvenlik bildirimleri. | DOMPurify uyumlu güncellemesi ayrı dalda denenmeli; eski esbuild Drizzle araç zincirinden geliyor. Üretimde geliştirme sunucusu açılmamalı. |
| Orta | Ana sayfa HEAD yanıtında CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy ve Permissions-Policy yok. | Özellikle Payload yönetim paneli, Blob görselleri ve Formspree ile uyumlu başlık politikası ayrı değişiklikte test edilmeli. Bu kontrol yalnızca ana sayfa yanıtını kapsar. |
| Orta | Var olan public depoda bir test dosyası kişisel posta adresi içeriyor; tarihsel raporlar özel veri riski taşıyor. | Yeni yedek kök commit'inde raporlar hariç tutuldu ve posta adresi genel bir teste dönüştürüldü. Eski main/geçmiş değiştirilmedi. Geçmiş temizliği ayrıca değerlendirilmeli. |
| Düşük | `x-powered-by: Next.js, Payload` teknoloji bilgisini açıklıyor. | Kapatılması ayrı yapılandırma önerisi. |
| Düşük | Özel yedek aynı yerel diskte ve uygulama düzeyinde şifresiz. | Şifreli ayrı ortama ikinci kopya oluşturulmalı. |

Gitleaks 8.30.1, varsayılan kurallar ve redacted raporlarla erişilebilir yerel
Git geçmişinde ve kaynak kopyasında doğrulanmış sır bulmadı. Ek desen taramasında
veritabanı URL eşleşmeleri `example.invalid` test verileriydi. Bu sonuç tüm
sır türlerinin veya görsellerdeki kişisel verilerin otomatik olarak
tespit edildiği anlamına gelmez. Tarihsel raporlar bu nedenle özel yedekte kaldı.

Olumlu kontroller: gerçek `.env*` dosyaları, veritabanları ve yüklemeler Git
dışında; `.env.example` değerleri boş. Kullanıcı yönetiminde admin/kişinin kendi
kaydına erişim sınırları var; içerik yayın durumu denetleniyor. JSON-LD
serileştirmesinde `<` karakteri kaçırılıyor. Yüklemeler 10 MiB ve izinli MIME
türleriyle sınırlandırılmış. Ana sayfada HSTS mevcut (`max-age=63072000`).

Paket sürümleri değiştirilmedi. `npm audit fix --force` önerileri arasında
Next ESLint ve Payload için büyük sürüm değişimleri/geriye düşürmeler var;
bunlar uygulanmamalı. Uyumlu transitif yamalar ve büyük yükseltmeler ayrı
dallarda admin, yayınlama, görsel yükleme ve form akışlarıyla test edilmelidir.

Kaynaklar:

- [braces güvenlik bildirimi](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [DOMPurify güvenlik bildirimi](https://github.com/advisories/GHSA-cmwh-pvxp-8882)
- [esbuild güvenlik bildirimi](https://github.com/advisories/GHSA-67mh-4wv8-2f99)
- [Vercel dal bazında otomatik dağıtım ayarı](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled)

Ham npm audit, Gitleaks ve HTTP kontrol kayıtları özel yedek dizinindedir.
