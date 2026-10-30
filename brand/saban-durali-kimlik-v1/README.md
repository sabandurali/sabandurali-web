# Şaban Durali kimlik paketi v1.0

Ekim 2026. Şaban Durali, Araştırma ve Bilgi Platformu ([sabandurali.com](https://sabandurali.com), İngilizcesi `/en`). Kimlik sitenin kendisinden geliyor: renkler, köşe ölçüleri ve yazı tipleri sitedeki CSS değişkenleriyle birebir aynı (deniz laciverti, kâğıt zemin, sinyal turuncusu; Archivo ve Martian Mono). İşaret ŞD: S, D’nin gövdesine biner ve buluştukları yer turuncudur; Ş’nin çengeli Archivo’nun kendi çengelidir. Sitenin bugünkü ikonu (siyah zemin, altın serif SD) bu işaretle değiştirilir.

## Klasörler

| Klasör | İçerik |
|---|---|
| `logo/` | Yatay logo (`saban-durali-logo-*`) ve dikey logo (`saban-durali-logo-vertical-*`): `color` (açık zemin), `color-ondark` (koyu zemin), `navy`, `black`, `white` (SVG) |
| `wordmark/` | Yalnız yazı: alt satırlı (`saban-durali-wordmark-*`) ve yalnız ad (`saban-durali-wordmark-name-*`), aynı beş sürüm |
| `symbol/` | ŞD işareti, beş sürüm; 16–32 px için küçük boy kesimi (`saban-durali-symbol-small-*`) |
| `app-icon/` | Uygulama ikonu: kare, yuvarlak köşeli, maskable; deniz ve kâğıt zemin (SVG) |
| `web/` | Next.js dosyaları: `favicon.ico` (16, 32, 48), `icon.svg`, `icon.png` (512), `apple-icon.png` (180), `opengraph-image.png` (1200 × 630) ve `.alt.txt`, `site.webmanifest`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`. Nereye konacağı: `web/README.md` |
| `png/` | Şeffaf PNG’ler: logolar 1200 ve 2400 px, işaretler 512 ve 1024 px, ikonlar 1024 px, atlas deseni 1600 px |
| `jpg/` | Zeminli JPG’ler (Word, PowerPoint, e-posta): yatay logo beyaz, kâğıt ve deniz zeminde; dikey logo açık ve koyu zeminde |
| `print/` | Baskı için vektör PDF’ler (CMYK): yatay ve dikey logo, işaret (beşer sürüm), yazı (renkli ve lacivert) |
| `tokens/`, `css/` | `saban-durali-tokens.json` ve `saban-durali-tokens.css`: sitenin değişkenleri aynı adlarla, Tailwind v4 `@theme` ve sitenin dört imzası (`.sd-highlight`, `.sd-chip`, `.sd-region`, `.sd-hatch`) |
| `fonts/` | Archivo ve Martian Mono (değişken TTF), OFL lisans metinleri, Google Fonts bağlantıları |
| `graphic/` | Atlas deseni, açık ve koyu zemin (SVG) |
| `guide/` | Yapı ve koruma alanı çizimleri (PNG) |
| `applications/` | Kartvizit (ön ve arka, 3 mm taşmalı PDF), A4 antetli kâğıt (PDF, PNG), e-posta imzası (HTML, PNG), sosyal medya (profil 1080, LinkedIn 1584 × 396, X 1500 × 500, makale paylaşım 1200 × 630), sunum kapağı 1920 × 1080 |
| `tests/` | Test raporu, SVG denetimi, piksel testi |

## Önce hangi dosya

- Sitenin üst bilgisi (kâğıt zemin): `logo/saban-durali-logo-color.svg`. Dar başlıkta `wordmark/saban-durali-wordmark-name-color.svg` ya da işaret.
- Koyu zemin (sunum, alt bilgi, deniz zeminli görseller): `-color-ondark`.
- Kare ve dik alanlar (afiş, kapak, sosyal medya görseli): dikey logo `logo/saban-durali-logo-vertical-color.svg`.
- Profil fotoğrafı: `applications/sosyal/saban-durali-sosyal-profil-1080.png` (uygulama ikonu; yuvarlak kesimde de işaret içeride kalır).
- Favicon ve tarayıcı sekmesi: `web/` (küçük boy kesimi).
- Tek renk baskı, kaşe: `-navy`, `-black`, `-white`. Tek renkte kesişim ince bir boşlukla ayrılır.
- Matbaa: `print/` PDF’leri; kartvizit ve antetli kâğıt için `applications/` içindeki PDF’ler. Ekran PNG’lerini matbaaya göndermeyin.
- **Tam marka kılavuzu (20 sayfa PDF):** `SABAN_DURALI_MARKA_KILAVUZU.pdf`.
- Geliştirici rehberi: `SABAN_DURALI_BRAND_SYSTEM.md`.

## Renkler

| Ad | Değişken | Hex | Pantone (en yakın) |
|---|---|---|---|
| Deniz | `--color-sea`, `--color-ink` | `#0A3352` | 540 C |
| Kâğıt | `--color-paper` | `#EEF2F1` | — |
| Sinyal | `--color-signal` | `#F47A2E` | 1575 C |
| Sinyal yazısı | `--color-signal-ink` | `#A8410E` | 1675 C |
| Soluk mürekkep | `--color-ink-muted` | `#4A6377` | 7699 C |
| Pafta | `--color-keymap` | `#C3D1D8` | 5455 C |

Bütün değişkenler (18 renk, 4 köşe ölçüsü, 2 yazı ailesi) `css/` ve `tokens/` içinde. Pantone karşılıkları ekranda hesaplanan en yakın Pantone C değerleridir; baskıdan önce fiziksel rehberle doğrulanmalı.

## En küçük boylar

| Sürüm | Ekran | Baskı |
|---|---|---|
| Yatay logo | 200 px | 50 mm |
| Dikey logo | 150 px | 38 mm |
| Yalnız ad | 110 px | 28 mm |
| İşaret | 24 px | 7 mm |
| Favicon (küçük boy kesimi) | 16 px | — |

## Test özeti

- SVG denetimi: hata yok. İşaret ve küçük boy kesimi 100/100; uygulama ikonları ve favicon 98–99. Yazı içeren dosyalar daha düşük: yatay logo 91, yalnız ad 90, alt satırlı yazı 83, dikey logo 76. Nedenleri yazıdan geliyor: ad ve alt satırın 39 harfi (nokta sayısı yüksek), Archivo’nun N harfindeki 42° çapraz (yazı tipinin kendi açısı) ve dikey logoda alt satırın küçük iç boşlukları; dikey logo bu yüzden 150 px’in altında kullanılmaz. Ayrıntı: `tests/TEST_RAPORU.md`.
- 16 px favicon: ŞD ve turuncu kesişim seçiliyor; Ş’nin çengeli 24 px’ten itibaren net (`tests/piksel-testi.png`).
- Kontrast: deniz yazı kâğıtta 11,6:1, soluk mürekkep 5,6:1, turuncu zeminde deniz yazı 4,8:1, sinyal yazısı kâğıtta 5,4:1. Sinyal turuncusu açık zeminde yazı için kullanılmaz (2,4:1); logoda kesişim zemine değmez, her yanından harflerle çevrilidir.

## Notlar

- E-posta imzasındaki logo adresi (`https://sabandurali.com/eposta/saban-durali-eposta-logo@2x.png`), dosya siteye yüklenince çalışır.
- Logodaki alt satır Türkçe; İngilizce alt satırlı (Research and Knowledge Platform) bir logo bu pakette yok. İngilizce sayfalarda (`/en`) logo olduğu gibi ya da yalnız ad sürümüyle kullanılabilir; logonun `alt` metni İngilizce yazılır.
- Pakette telefon, adres ve unvan yok; kartvizite telefon eklenecekse e-postayla aynı satır düzeninde, Martian Mono 7 pt.
- Logo, yazı ve işaret dosyalarında harfler kontura çevrili; açmak için yazı tipi gerekmez.
- Archivo ve Martian Mono SIL Open Font License 1.1 ile ücretsizdir.
