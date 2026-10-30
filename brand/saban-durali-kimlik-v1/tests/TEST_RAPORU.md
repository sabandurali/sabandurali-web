# Şaban Durali — Test raporu (v1.0)

31 Ekim 2026. Testler otomatik SVG denetimi (yapı ve geometri), piksel testi (16–48 px), kontrast hesabı ve dosya kontrolleriyle yapıldı.

## 1. SVG denetimi

Puan 100’den başlar; HATA −25, UYARI −8, not −1. Tam çıktı: `svg-audit.txt` ve `svg-audit.json`. Hata sayısı: 0.

| Dosya | Puan | Bulgular |
|---|---|---|
| `saban-durali-app-icon-maskable-paper.svg` | 99 | not: nokta sayısı yüksek |
| `saban-durali-app-icon-maskable.svg` | 98 | not: zeminli ikon, not: nokta sayısı yüksek |
| `saban-durali-app-icon-rounded-paper.svg` | 99 | not: nokta sayısı yüksek |
| `saban-durali-app-icon-rounded.svg` | 98 | not: zeminli ikon, not: nokta sayısı yüksek |
| `saban-durali-app-icon-square-paper.svg` | 99 | not: nokta sayısı yüksek |
| `saban-durali-app-icon-square.svg` | 98 | not: zeminli ikon, not: nokta sayısı yüksek |
| `saban-durali-atlas-dark.svg` | 92 | UYARI: nokta sayısı yüksek |
| `saban-durali-atlas-light.svg` | 92 | UYARI: nokta sayısı yüksek |
| `saban-durali-logo-black.svg` | 91 | UYARI: nokta sayısı yüksek, not: çok geniş oran |
| `saban-durali-logo-color-ondark.svg` | 91 | UYARI: nokta sayısı yüksek, not: çok geniş oran |
| `saban-durali-logo-color.svg` | 91 | UYARI: nokta sayısı yüksek, not: çok geniş oran |
| `saban-durali-logo-navy.svg` | 91 | UYARI: nokta sayısı yüksek, not: çok geniş oran |
| `saban-durali-logo-vertical-black.svg` | 76 | UYARI: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), UYARI: küçük ayrıntı (alt satır) |
| `saban-durali-logo-vertical-color-ondark.svg` | 76 | UYARI: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), UYARI: küçük ayrıntı (alt satır) |
| `saban-durali-logo-vertical-color.svg` | 76 | UYARI: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), UYARI: küçük ayrıntı (alt satır) |
| `saban-durali-logo-vertical-navy.svg` | 76 | UYARI: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), UYARI: küçük ayrıntı (alt satır) |
| `saban-durali-logo-vertical-white.svg` | 76 | UYARI: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), UYARI: küçük ayrıntı (alt satır) |
| `saban-durali-logo-white.svg` | 91 | UYARI: nokta sayısı yüksek, not: çok geniş oran |
| `saban-durali-symbol-black.svg` | 100 | temiz |
| `saban-durali-symbol-color-ondark.svg` | 100 | temiz |
| `saban-durali-symbol-color.svg` | 100 | temiz |
| `saban-durali-symbol-navy.svg` | 100 | temiz |
| `saban-durali-symbol-small-black.svg` | 100 | temiz |
| `saban-durali-symbol-small-color-ondark.svg` | 100 | temiz |
| `saban-durali-symbol-small-color.svg` | 100 | temiz |
| `saban-durali-symbol-small-navy.svg` | 100 | temiz |
| `saban-durali-symbol-small-white.svg` | 100 | temiz |
| `saban-durali-symbol-white.svg` | 100 | temiz |
| `icon.svg` | 98 | not: zeminli ikon, not: nokta sayısı yüksek |
| `saban-durali-wordmark-black.svg` | 83 | UYARI: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), not: çok geniş oran |
| `saban-durali-wordmark-color-ondark.svg` | 83 | UYARI: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), not: çok geniş oran |
| `saban-durali-wordmark-color.svg` | 83 | UYARI: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), not: çok geniş oran |
| `saban-durali-wordmark-name-black.svg` | 90 | not: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), not: çok geniş oran |
| `saban-durali-wordmark-name-color-ondark.svg` | 90 | not: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), not: çok geniş oran |
| `saban-durali-wordmark-name-color.svg` | 90 | not: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), not: çok geniş oran |
| `saban-durali-wordmark-name-navy.svg` | 90 | not: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), not: çok geniş oran |
| `saban-durali-wordmark-name-white.svg` | 90 | not: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), not: çok geniş oran |
| `saban-durali-wordmark-navy.svg` | 83 | UYARI: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), not: çok geniş oran |
| `saban-durali-wordmark-white.svg` | 83 | UYARI: nokta sayısı yüksek, UYARI: 45°’ye yakın çapraz (Archivo N), not: çok geniş oran |

Özet:

- İşaret ve küçük boy kesimi (10 dosya) 100/100, temiz. Uygulama ikonları ve favicon 98–99; yalnız notlar (zeminli ikon, nokta sayısı).
- Yatay logo 91: nokta sayısı yüksek (930–939). Nedeni ad ve alt satırdaki 39 harfin yazı tipi konturları; oran çok geniş (7,9 : 1), dar alanlar için dikey logo ve yalnız ad var.
- Yalnız ad 90, alt satırlı yazı 83: aynı nokta sayısı ve “45°’ye yakın çapraz”. Bu, Archivo’nun genişlik 125 kesiminde N harfinin 42° çaprazı; yazı tipinin kendi açısı, düzeltilmedi.
- Dikey logo 76: nokta sayısı, N çaprazı ve “küçük ayrıntı”: alt satırdaki A harflerinin iç boşlukları ve Ş’nin çengeli logo yüksekliğinin 1/32’sinden küçük. Dikey logo bu yüzden 150 px genişliğin altında kullanılmaz; daha küçükte işaret ya da yalnız ad.
- Atlas deseni 92: kareli desen, nokta sayısı yüksek. Desendir, logo yerine kullanılmaz.

## 2. Kontrol listesi

| Test | Sonuç |
|---|---|
| 16 px favicon | Geçti, küçük boy kesimiyle: ŞD, turuncu kesişim ve çengel seçiliyor (`piksel-testi.png`). Asıl işarette 16 px’te çengel zayıflıyor; favicon bu yüzden küçük boy kesimiyle (çengel 1,55 kat) |
| 24–48 px | Geçti: Ş’nin çengeli ve kesişim favicon, asıl işaret ve uygulama ikonunda net |
| favicon.ico | 16, 32, 48 px boyutlarını içeriyor |
| Tek renk | Geçti: lacivert, siyah, beyaz. Kesişim ince bir boşlukla ayrılıyor; S’nin D’nin üstünden geçtiği tek renkte de okunuyor |
| Koyu zemin | Geçti: beyaz harfler, turuncu kesişim (denizde 4,8:1) |
| Kesişim | Renkli logoda turuncu kesişimin her kenarı lacivert harfe değiyor (4,8:1); koyu zemin logosunda beyaz harfe (2,7:1, renk farkıyla ayrılıyor). Kesişimin zeminle sınırı yok; turuncunun kâğıtta 2,4:1 olması logoyu etkilemiyor |
| Kontrast | Bölüm 3; metin kombinasyonlarının hepsi 4,5:1 üstünde |
| CMYK ve Pantone | Tanımlı. En yakın Pantone C (CIEDE2000; metalik, pastel ve fosforlu seriler hariç): 540 C, 1575 C, 1675 C, 7699 C, 5455 C; ΔE 0,9–4,8. Fiziksel rehberle doğrulanmalı |
| Next.js dosyaları | `favicon.ico`, `icon.svg`, `icon.png` 512, `apple-icon.png` 180 (opak), `opengraph-image.png` 1200 × 630 ve `.alt.txt`, `site.webmanifest` (192, 512, maskable) |
| Uygulama ikonu, profil (daire kırpma) | Geçti: işaret karenin %72’si, daire kırpmada içeride; maskable ikonda %56, Android güvenli dairesinin içinde |
| Kartvizit ve antetli kâğıt | PDF’ler doğru ölçüde: kartvizit 91 × 61 mm (85 × 55 + 3 mm taşma), antetli A4 |
| Kılavuz PDF | 20 sayfa; her sayfa görüntüye çevrilip tek tek kontrol edildi, taşma denetimi temiz |
| Yol sızıntısı | Paketteki html, md, svg, css, json, webmanifest ve txt dosyalarında yerel dosya yolu yok |
| Geometri | `mark.py`, `concepts.py` ve `vtype.py` değişmedi. Tek ek: 16–32 px küçük boy kesiminde çengel 1,55 kat (izin verilen üst sınır 1,6); başka hiçbir şey kalınlaştırılmadı |

## 3. Kontrast

| Çift | Ön plan / zemin | Oran | Hedef | Sonuç | Kullanım |
|---|---|---|---|---|---|
| Deniz yazı / kâğıt | `#0A3352` / `#EEF2F1` | 11,6:1 | 4,5:1 | geçti | metin, logo |
| Deniz yazı / kara | `#0A3352` / `#F8FAF9` | 12,5:1 | 4,5:1 | geçti | kart, kutu |
| Deniz yazı / beyaz | `#0A3352` / `#FFFFFF` | 13,1:1 | 4,5:1 | geçti | belge |
| Soluk mürekkep / kâğıt | `#4A6377` / `#EEF2F1` | 5,6:1 | 4,5:1 | geçti | ikincil metin, alt satır |
| Sinyal yazısı / kâğıt | `#A8410E` / `#EEF2F1` | 5,4:1 | 4,5:1 | geçti | turuncu yazı ve bağlantı |
| Deniz yazı / sinyal | `#0A3352` / `#F47A2E` | 4,8:1 | 4,5:1 | geçti | vurgu, çip |
| Beyaz / deniz | `#FFFFFF` / `#0A3352` | 13,1:1 | 4,5:1 | geçti | koyu zeminde yazı |
| Denizde soluk / deniz | `#B9D0DF` / `#0A3352` | 8,2:1 | 4,5:1 | geçti | koyu zeminde ikincil yazı |
| Sinyal / deniz | `#F47A2E` / `#0A3352` | 4,8:1 | 3,0:1 | geçti | renkli logoda kesişim ve lacivert harfler; koyu zeminde turuncu öğe |
| Sinyal / kâğıt | `#F47A2E` / `#EEF2F1` | 2,4:1 | 3,0:1 | yazı için kullanılmaz | yalnız grafik (çip, vurgu zemini, kare); yazı değil |
| Sinyal / beyaz | `#F47A2E` / `#FFFFFF` | 2,7:1 | 3,0:1 | yazı için kullanılmaz | koyu zemin logosunda kesişim ve beyaz harfler (renk farkıyla ayrılır); yazı değil |

## 4. Açık işler

- Pantone provası (renk kartıyla).
- Logodaki alt satır Türkçe; İngilizce alt satırlı sürüm (Research and Knowledge Platform) istenirse ayrıca hazırlanır.
- E-posta imzasındaki logo, PNG siteye (`public/eposta/`) yüklenince görünür.
