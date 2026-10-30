# Şaban Durali Brand System v1.0 — Uygulama rehberi

Bu dosya Şaban Durali araştırma ve bilgi platformunun (sabandurali.com) görsel kimlik standardıdır (v1.0, 31 Ekim 2026). Klasörü projeye kopyala, Claude Code’a “SABAN_DURALI_BRAND_SYSTEM.md dosyasını oku ve uygula” de. Hedef: mevcut Next.js sitesi (App Router; Türkçe `/`, İngilizce `/en`). Renk, köşe ve yazı değişkenleri sitedeki değişkenlerle aynıdır; bu paket logo, ikon, paylaşım görseli ve uygulama dosyalarını ekler ve sitenin eski ikonunu (siyah zemin, altın serif SD) değiştirir.

| Klasör | İçerik |
|---|---|
| `logo/` | `saban-durali-logo-{color,color-ondark,navy,black,white}.svg` (yatay) ve `saban-durali-logo-vertical-{…}.svg` (dikey) |
| `wordmark/` | `saban-durali-wordmark-{…}.svg` (alt satırlı yazı) ve `saban-durali-wordmark-name-{…}.svg` (yalnız ad) |
| `symbol/` | `saban-durali-symbol-{…}.svg` (ŞD işareti) ve `saban-durali-symbol-small-{…}.svg` (16–32 px kesimi) |
| `app-icon/` | `saban-durali-app-icon-{square,rounded,maskable}.svg` ve `-paper` sürümleri |
| `web/` | Next.js dosyaları: `favicon.ico`, `icon.svg`, `icon.png`, `apple-icon.png`, `opengraph-image.png` (+ `.alt.txt`), `site.webmanifest`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` |
| `css/saban-durali-tokens.css` | Sitenin değişkenleri (`:root` ve Tailwind v4 `@theme`) ve `.sd-highlight`, `.sd-chip`, `.sd-region`, `.sd-hatch` |
| `tokens/saban-durali-tokens.json` | Aynı değerler JSON olarak (rol, RGB, CMYK, kontrast, en yakın Pantone) |
| `graphic/` | Atlas deseni (açık ve koyu zemin) |
| `fonts/` | Archivo ve Martian Mono (TTF, OFL) |
| `png/`, `jpg/`, `print/`, `applications/` | Ekran, ofis, baskı dosyaları; kartvizit, antetli kâğıt, e-posta imzası, sosyal medya, sunum kapağı |

---

## 0 · Genel talimat (Claude Code için)

1. `web/` klasörünü `web/README.md`’deki tabloya göre yerleştir: ikonlar ve paylaşım görseli `app/`, manifest ve manifest ikonları `public/`. Sitenin eski ikon dosyalarını (siyah zemin, altın serif SD) `app/` ve `public/` içinden kaldır.
2. `logo/`, `wordmark/`, `symbol/` ve `graphic/` SVG’lerini `public/brand/` altına kopyala (klasörsüz, dosya adlarıyla).
3. Renk, köşe ve yazı değişkenleri sitenin global CSS’inde zaten var; değerleri Bölüm 2 ve 3’teki tablolarla karşılaştır, farklıysa paketteki değere çek. Yeni bir projede `css/saban-durali-tokens.css` dosyasını import et.
4. Üst bilgideki logoyu Bölüm 5’teki `Logo` bileşeniyle göster.
5. `app/layout.tsx` metadata’sına Bölüm 6’daki iki alanı ekle (yoksa).
6. Mevcut işlevselliği ve metinleri değiştirme; yalnızca görsel katmanı uygula.

---

## 1 · Logo

Logo iki parçadır: ŞD işareti ve yazı bloğu (ŞABAN DURALİ ve altında ARAŞTIRMA VE BİLGİ PLATFORMU).

**Logo yeniden üretilmez.** Ad Archivo ile yazılarak, işaret CSS ile çizilerek taklit edilmez; her zaman `/brand/` dosyaları kullanılır.

İşaret:

- Harfler Archivo 800, genişlik 125 (logo yazısıyla aynı kesim).
- S, D’nin gövdesine S genişliğinin %26’sı kadar biner. Kesişim sinyal turuncusu (`#F47A2E`); kesişim zemine değmez, her yanından harflerle çevrilidir.
- Ş’nin çengeli Archivo’nun kendi çengeli, 1,25 kat, lacivert. Küçük boy kesiminde (16–32 px) 1,55 kat; harfler aynı.

Yazı bloğu:

- ŞABAN DURALİ: Archivo 800, genişlik 125, harf aralığı 0,07 em.
- Alt satır: Archivo 700, genişlik 125, aralık 0,16 em; adla aynı genişlikte.

Yerleşim:

- Yatay logo: işaretin tamamı (harf üstünden çengelin ucuna) yazı bloğu kadar yüksektir (h = ad harf üstü → alt satır tabanı). İşaretle yazı arası 0,34 h.
- Dikey logo: işaret yazının üstünde ortalı; işaretin harf yüksekliği 2,2 x, çengelin ucuyla ad arası 0,55 x (x = ŞABAN DURALİ’nin harf yüksekliği).

Oranlar (genişlik : yükseklik; dosyalar 256 birim yüksekliğinde, tam sayı tuvalde):

| Dosya | viewBox | Oran |
|---|---|---|
| Yatay logo | `0 0 2027 256` | 7,918 |
| Dikey logo | `0 0 685 256` | 2,676 |
| Alt satırlı yazı | `0 0 1637 256` | 6,395 |
| Yalnız ad | `0 0 2470 256` | 9,648 |
| İşaret | `0 0 367 256` | 1,434 |
| Küçük boy kesimi | `0 0 346 256` | 1,352 |
| Atlas deseni | `0 0 372 140` | 2,657 |

Renk kuralı:

| Sonek | Zemin | Renkler |
|---|---|---|
| `-color` | Kâğıt, beyaz, kara (açık zemin). **Birincil** | Lacivert harfler ve ad, turuncu kesişim, alt satır soluk mürekkep (`#4A6377`) |
| `-color-ondark` | Deniz (`#0A3352`) ve koyu fotoğraf | Beyaz harfler ve ad, turuncu kesişim, alt satır `#B9D0DF` |
| `-navy` | Tek renk baskı, kaşe | Tamamı lacivert; kesişim ince bir boşlukla ayrılır |
| `-black` | Siyah baskı, lazer; varak ve kabartma kalıbı | Tamamı siyah (`#000000`), kesişim boşlukla ayrılır |
| `-white` | Fotoğraf üstü, ters baskı | Tamamı beyaz, kesişim boşlukla ayrılır |

Kurallar:

- Koruma alanı: her yanda en az x (ŞABAN DURALİ’nin harf yüksekliği). İşaret tek başına: her yanda en az işaret yüksekliğinin yarısı. İkon ve favicon dosyalarında boşluk dosyanın içindedir.
- En küçük boy: yatay logo 200 px (50 mm), dikey logo 150 px (38 mm), yalnız ad 110 px (28 mm), işaret 24 px (7 mm). 16–32 px (favicon, sekme) için küçük boy kesimi.
- Yapılmaz: rengi değiştirmek, kesişimi kaldırmak ya da tek renge boyamak (tek renk dosyalar dışında), çengeli silmek, adı başka yazı tipiyle yazmak, esnetmek, döndürmek, gölge ya da parlama eklemek, logoyu turuncu zemine koymak, koyu zemin sürümünü açık zeminde kullanmak.
- Logonun erişilebilir adı: Türkçe sayfalarda “Şaban Durali, Araştırma ve Bilgi Platformu”, İngilizce sayfalarda “Şaban Durali, Research and Knowledge Platform”. Logodaki alt satır Türkçedir; İngilizce alt satırlı bir logo bu pakette yok (İngilizce sayfalarda yalnız ad ya da işaret de kullanılabilir).

---

## 2 · Renkler

Değerler sabandurali.com’daki CSS değişkenleriyle birebir aynıdır; adlar değiştirilmez.

| Değişken | Hex | Bu kılavuzdaki rolü |
|---|---|---|
| `--color-sea`, `--color-ink` | `#0A3352` | Logo, başlık, metin; koyu zemin (sunum, kapak, uygulama ikonu) |
| `--color-paper` | `#EEF2F1` | Sayfa zemini |
| `--color-land` | `#F8FAF9` | Kart ve kutu zemini |
| `--color-band` | `#E4EBEA` | Bant zemini |
| `--color-mist` | `#DCE7EC` | Açık yüzey |
| `--color-keymap` | `#C3D1D8` | Atlas kareleri (açık zemin) |
| `--color-hairline` | `#B8C7CD` | İnce çizgi, kenar, tarama |
| `--color-tile-edge` | `#6B8496` | Kare kenarı |
| `--color-ink-muted` | `#4A6377` | İkincil metin, alt satır, bölge etiketi |
| `--color-sea-line` | `#2C5577` | Koyu zeminde çizgi ve atlas kareleri |
| `--color-sea-track` | `#6F93AE` | Koyu zeminde ikincil çizgi |
| `--color-on-sea` | `#FFFFFF` | Koyu zeminde yazı |
| `--color-on-sea-muted` | `#B9D0DF` | Koyu zeminde ikincil yazı |
| `--color-on-sea-soft` | `#DCE7EC` | Koyu zeminde yumuşak ton |
| `--color-signal` | `#F47A2E` | Vurgu zemini, bölüm çipi, logodaki kesişim |
| `--color-signal-ink` | `#A8410E` | Açık zeminde turuncu yazı ve bağlantı |
| `--color-danger` | `#A3261B` | Hata |

Kontrast (WCAG):

| Ön plan / zemin | Oran | Kullanım |
|---|---|---|
| Deniz / kâğıt | 11,6:1 | Metin ve logo, her boyda |
| Deniz / beyaz | 13,1:1 | Belge |
| Soluk mürekkep / kâğıt | 5,6:1 | İkincil metin |
| Sinyal yazısı / kâğıt | 5,4:1 | Turuncu bağlantı ve yazı |
| Deniz / sinyal | 4,8:1 | Vurgu ve çip yazısı |
| Beyaz / deniz | 13,1:1 | Koyu zeminde yazı |
| Denizde soluk / deniz | 8,2:1 | Koyu zeminde ikincil yazı |
| Sinyal / kâğıt | 2,4:1 | Yalnız grafik; açık zeminde turuncu yazı kullanılmaz (yerine `signal-ink`) |

Baskı (CMYK düz dönüşüm; en yakın Pantone C, fiziksel rehberle doğrulanmalı):

| Renk | CMYK | Pantone (ΔE) |
|---|---|---|
| Deniz `#0A3352` | 88 38 0 68 | 540 C (2,4) |
| Sinyal `#F47A2E` | 0 50 81 4 | 1575 C (2,2) |
| Sinyal yazısı `#A8410E` | 0 61 92 34 | 1675 C (2,8) |
| Soluk mürekkep `#4A6377` | 38 17 0 53 | 7699 C (4,8) |
| Pafta `#C3D1D8` | 10 3 0 15 | 5455 C (0,9) |

Oran: sayfayı kâğıt ve deniz taşır; turuncu yalnız vurgu, çip ve kesişimde. Bir cümlede en fazla bir vurgu.

---

## 3 · Köşe, çizgi, yüzey

| Değişken | Değer | Kullanım |
|---|---|---|
| `--radius-tile` | 2px | Atlas karesi, bölüm numarası (`.sd-chip`) |
| `--radius-card` | 3px | Kart, görsel kutusu |
| `--radius-control` | 4px | Düğme, form alanı |
| `--radius-chip` | 6px | Etiket ve filtre çipi |

Köşeler küçük ve keskindir; 8 px üstü yuvarlak köşe ve yumuşak büyük gölgeler kullanılmaz. Kenarlar `--color-hairline` 1 px ya da deniz 1,5 px.

---

## 4 · Yazı tipleri

| Rol | Yazı | Ayar |
|---|---|---|
| Ekran başlığı | Archivo 800 | `font-stretch: 88%`, `letter-spacing: -.018em` |
| Bölüm ve ara başlık | Archivo 800 | `font-stretch: 92–95%`, `letter-spacing: -.012em` |
| Metin | Archivo 400–600 | normal genişlik |
| Bölge etiketi | Archivo 700 | `font-stretch: 125%`, büyük harf, `letter-spacing: .16em` |
| Veri, kare adresi, çip | Martian Mono 600–700 | `font-stretch: 87.5%` |

Next.js (`app/layout.tsx`), site bu yazı tiplerini başka yolla yüklüyorsa olduğu gibi bırak:

```tsx
import { Archivo, Martian_Mono } from 'next/font/google';

const archivo = Archivo({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const martianMono = Martian_Mono({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--font-martian-mono', display: 'swap' });

// <html lang="tr" className={`${archivo.variable} ${martianMono.variable}`}>
```

```css
@theme {
  --font-sans: var(--font-archivo), "Helvetica Neue", Arial, sans-serif;
  --font-mono: var(--font-martian-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
```

Türkçe karakterler `latin-ext` içinde. Genişlik ekseni (`wdth`) yüklenmezse `font-stretch` çalışmaz; başlıklar ve etiketler yanlış genişlikte görünür.

---

## 5 · Logo bileşeni

```tsx
// components/Logo.tsx
import Image from 'next/image';

type Way = 'color' | 'color-ondark' | 'navy' | 'black' | 'white';

const ALT = {
  tr: 'Şaban Durali, Araştırma ve Bilgi Platformu',
  en: 'Şaban Durali, Research and Knowledge Platform',
};

export function Logo({ way = 'color', height = 40, lang = 'tr', className }:
  { way?: Way; height?: number; lang?: 'tr' | 'en'; className?: string }) {
  return (
    <Image src={`/brand/saban-durali-logo-${way}.svg`} alt={ALT[lang]} width={Math.round(height * 2027 / 256)} height={height}
      unoptimized className={className} />
  );
}

export function LogoVertical({ way = 'color', height = 120, lang = 'tr', className }:
  { way?: Way; height?: number; lang?: 'tr' | 'en'; className?: string }) {
  return (
    <Image src={`/brand/saban-durali-logo-vertical-${way}.svg`} alt={ALT[lang]} width={Math.round(height * 685 / 256)} height={height}
      unoptimized className={className} />
  );
}

export function NameMark({ way = 'color', height = 22, className }: { way?: Way; height?: number; className?: string }) {
  return (
    <Image src={`/brand/saban-durali-wordmark-name-${way}.svg`} alt="Şaban Durali" width={Math.round(height * 2470 / 256)} height={height}
      unoptimized className={className} />
  );
}

export function BrandMark({ way = 'color', height = 32, className }: { way?: Way; height?: number; className?: string }) {
  return (
    <Image src={`/brand/saban-durali-symbol-${way}.svg`} alt="Şaban Durali" width={Math.round(height * 367 / 256)} height={height}
      unoptimized className={className} />
  );
}
```

Üst bilgide (kâğıt zemin):

```tsx
<Link href="/" aria-label="Şaban Durali, ana sayfa" className="inline-flex">
  <Logo height={40} />
</Link>
```

Logo yüksekliği masaüstünde 36–44 px; 200 px genişliğin altına inen dar başlıkta `NameMark` ya da `BrandMark`. Koyu zeminde (`bg-sea`) `way="color-ondark"`.

---

## 6 · Metadata ve ikonlar

`web/` dosyaları `app/` ve `public/` içine konunca Next.js `<link rel="icon">`, `apple-touch-icon` ve `og:image` etiketlerini kendisi üretir (`web/README.md`). Kök `app/layout.tsx` içinde şu iki alan yoksa ekle:

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://sabandurali.com'),
  manifest: '/site.webmanifest',
  // sitenin mevcut title ve description alanları olduğu gibi kalır
};
```

- `favicon.ico` yalnız kök `app/` içinde olur. `public/` içinde aynı adlı eski dosyalar varsa kaldır.
- Bir sayfa kendi `openGraph` alanını tanımlıyorsa `images` alanını boş bırakma; yoksa o sayfada paylaşım görseli düşebilir.
- `site.webmanifest`: ad “Şaban Durali”, zemin `#eef2f1`, tema `#0a3352`.

---

## 7 · Grafik dil

Sitenin imzaları `css/saban-durali-tokens.css` içinde hazır:

```html
<!-- tek vurgu: cümlede bir ifade, turuncu zemin, yazı lacivert -->
<p>Bilgiyi araştıran, analiz eden ve <mark class="sd-highlight">değer üreten</mark> bir platform.</p>

<!-- bölüm çipi ve bölge etiketi -->
<div class="flex items-center gap-3"><span class="sd-chip">01</span><span class="sd-region">İstanbul Atlası</span></div>

<!-- kare adresi (Martian Mono) -->
<span class="font-mono font-bold" style="font-stretch: 87.5%">F2</span>

<!-- boş durum: ince eğik tarama -->
<div class="sd-hatch rounded-card border border-hairline p-6">…</div>

<!-- kaynak satırı -->
<p class="text-sm text-ink-muted">Yazar adı · GG.AA.YYYY · Lisans · <a class="underline" href="…">Kaynak</a></p>
```

- Atlas deseni (`graphic/saban-durali-atlas-{light,dark}.svg`): açık kareler ilçeler, şerit Boğaz, turuncu kare seçili ilçe. Kapak, paylaşım görseli ve sunumda desen olarak; içerik haritası yerine kullanılmaz.
- Vurgu sayfada en fazla bir kez. Turuncu yazı gerekiyorsa `text-signal-ink`.

---

## 8 · Uygulamalar

- E-posta imzası: `applications/eposta/saban-durali-eposta-imzasi.html`. Logo PNG’sini (`saban-durali-eposta-logo@2x.png`) sitenin `public/eposta/` klasörüne koy; imzadaki adres `https://sabandurali.com/eposta/saban-durali-eposta-logo@2x.png`. Yazılar Arial (e-posta programları web yazı tipi yüklemez).
- Sosyal medya: profil fotoğrafı `applications/sosyal/saban-durali-sosyal-profil-1080.png`; LinkedIn ve X kapakları ve 1200 × 630 makale paylaşım görseli aynı klasörde.
- Sunum kapağı: `applications/saban-durali-sunum-kapagi-1920x1080.png`; iç sayfalar kâğıt zeminde, bölüm numaraları turuncu çipte.
- Kartvizit ve antetli kâğıt: `applications/` içindeki PDF’ler matbaaya gider (kartvizit 3 mm taşmalı).

---

## 9 · Kontrol listesi

- [ ] Üst bilgideki logo `/brand/` SVG’sinden geliyor; ad metin olarak yazılmamış.
- [ ] Sekme ikonu, iPhone ana ekran ikonu ve manifest ikonları yeni ŞD; eski siyah-altın SD hiçbir yerde kalmadı (`app/`, `public/`).
- [ ] Bir bağlantı paylaşıldığında görsel `opengraph-image.png`.
- [ ] Turuncu yalnız vurgu, çip ve logodaki kesişimde; açık zeminde turuncu yazı `signal-ink`.
- [ ] Köşeler 2–6 px; metin kontrastı en az 4,5:1.
- [ ] İngilizce sayfalarda logonun `alt` metni İngilizce.
