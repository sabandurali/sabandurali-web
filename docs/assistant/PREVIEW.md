# Asistan Preview — Aşama 16

Yalnız `codex/istanbul-research-assistant`, mevcut `sabanduralis-projects/sabandurali-web` projesi. Git otomatik deployment kapalı kalır; doğrulanmış GitHub dalı/SHA ile manuel Preview oluşturulur. Production/main birleştirmesi yoktur. Vercel Authentication korunur; bağlantı herkese açık, kimlik doğrulamasız bir demo değildir.

## Dal kapsamı

Aşağıdaki değerlerin tamamı yalnız **Preview → codex/istanbul-research-assistant** içindir. Genel Preview, Production ve diğer dal kayıtları değiştirilmez.

| Değişken | Değer |
|---|---|
| ASSISTANT_DEMO_ONLY | true |
| ASSISTANT_ENABLE_CLAUDE | false |
| PAYLOAD_DATABASE | sqlite |
| PAYLOAD_STORAGE | local |
| DATABASE_URL | file::memory: |
| PAGE_PUBLIC_SOURCE | static |
| NAVIGATION_PUBLIC_SOURCE | static |
| ARTICLE_PUBLIC_SOURCE | static |
| BOOK_PUBLIC_SOURCE | static |
| PHOTO_PUBLIC_SOURCE | static |
| PAYLOAD_SECRET | Bağımsız rastgele gizli değer; belgelenmez |

Genel Preview Neon/Blob bağlantıları proje entegrasyonu nedeniyle devralınabilir, fakat bu demo bunları kullanmaz. DATABASE_URL yalnız bu dalda bellek içi SQLite ile gölgelenir; Blob adaptörü kapalıdır. Yeni veritabanı/depolama oluşturulmaz. Build koruması tam dal/Preview/statik yapılandırmayı doğrular; yanlış ortamda durur. Asistan API’si yalnız JSON anlık görüntüsünü okur. Proxy yalnız iki demo sayfası, asistan API’si ve statik varlıklara izin verir; /admin ve diğer /api yolları 404 döner. Ana adres demoya yönlenir.

Gerçek Claude kod düzeyinde Vercel'de kapalıdır; yanlışlıkla anahtar devralınsa dahi Preview asistanı ücretsiz modda kalır. Süreç başına 20 istek/dakika sınırı küresel kota değildir. Koruma kaldırılmadan ve bütçeli, kimlik doğrulamalı pilot onaylanmadan ücretli API açılmamalıdır.

## 402 → 391 kaynak farkı

Production kaynak tablosunun önceki doğrulanmış sayısı 402'dir. Depodaki `data/districts/editorial.json` da 402 kayıt içerir. Production DB'ye bağlanmadan aynı yayın politikası (`mapDistrictGuide` / `sourceSupportsSection`) bu dosyaya uygulandı: 391 kaynak kaldı ve **39 ilçenin her birinde URL çoklu kümeleri demo anlık görüntüsüyle birebir eşleşti**.

Bu filtre asistan tarafından yeni eklenmedi: DistrictGuides `afterRead` anonim API yanıtına zaten uygular. Snapshot aracı API'deki bütün kaynak kayıtlarını alır; ek kaynak silmez. Rehberler/Production kaynakları değiştirilmedi.

| Neden | İlçe / kayıt | Adet |
|---|---|---:|
| Ulaşım/planlama için gereken dataDate yok | Bakırköy Ulaştırma; Kartal Marmaray; Maltepe Şehir Hatları; Pendik Tuzla–Pendik–Büyükada; Sancaktepe metro projesi; Ümraniye M8; Üsküdar M5 ve Şehir Hatları | 8 |
| official türünde fakat mevcut resmî alan adı izin listesinde yok | Beylikdüzü Yaşam Vadisi için iki beylikduzu.istanbul kaydı; Esenler YTÜ raporu (yildiz.edu.tr) | 3 |

İkinci grup kaynakların yanlış olduğunu kanıtlamaz; mevcut muhafazakâr izin listesi/sınıflandırma sınırıdır. Yeniden dahil etme ayrı editoryal inceleme gerektirir. Mevcut yayın politikasını gevşetmedik. 391 benzersiz web sayfası değil, ilçe başına kaynak kaydı toplamıdır. Yanıtlar ayrıca konu/bölüm eşleştirmesi kullanır; bütün 391 kayıt her yanıtta gösterilmez.
