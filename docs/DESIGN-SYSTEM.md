# İstanbul Atlası — tasarım sistemi

Sitenin görsel dili: İstanbul bir atlas gibi okunur. Serin harita kâğıdı zemin, Boğaz mavisi mürekkep, tek
bir sinyal turuncusu; Archivo'nun genişlik ekseni başlıkları ve harita etiketlerini, Martian Mono verileri
taşır. Ana fikir 39 ilçenin Boğaz şeridiyle 25'e 14 bölünmüş şematik kare haritası, ilçe rehberinin yön
levhası başlıkları, veri tablosu ve hat şemalarıdır.

Kaynaklar (tek doğru kaynak bunlardır, bu belge onları açıklar):

| Dosya | İçerik |
|---|---|
| `src/app/globals.css` | Token'lar (`@theme`), taban stiller (`@layer base`), tipografi sınıfları (`@utility type-*`) |
| `src/app/fonts.ts` | Archivo ve Martian Mono (`next/font/google`) |
| `src/components/ui/` | Erişilebilir temel bileşenler |
| `src/components/ui/design-tokens.test.ts` | Kontrast tablosu, 12 px tabanı, katman kuralı, odak halkası, font ayarları |
| `src/components/ui/typography-guard.test.ts` | Sitede 12 px altı yazı boyutu yasağı |

## 1. İlkeler

1. **Önce veri, sonra süs.** Sayı, birim, veri tarihi ve kaynak birlikte görünür. Eksik veri için açık bir
   boş durum (`EmptyState`) gösterilir; dolgu metin, uydurma sayı ya da süs görseli kullanılmaz.
2. **Şematik olduğunu söyle.** Kare harita, anahtar harita ve hat şemaları gerçek coğrafya değildir; her
   biri "Şematik, ölçeksiz" etiketini ya da eşdeğer notunu taşır.
3. **Tek vurgu.** Sinyal turuncusu yalnızca bir şeyi öne çıkarır: öne çıkan ilçe karesi, levha numarası,
   ilçeye hizmet eden durak, yeni etiketi, geçerli bölüm çizgisi. Açık zeminde turuncu yazı yoktur.
4. **Düz yüzey.** Gölge yalnızca açılır panellerdedir. Gradyan dolgu yoktur; tek desen, veri olmayan
   panellerdeki tarama (`bg-hatch`) desenidir.
5. **Herkes için.** WCAG 2.2 AA: metin kontrastı en az 4.5:1, her zeminde görünen odak halkası, tam klavye
   kullanımı, atlama bağlantısı, `prefers-reduced-motion` desteği, 390 px'te yatay kaydırma olmadan düzen.

## 2. Token'lar

### Renkler

Hepsi `@theme static` içinde tanımlıdır; Tailwind sınıfları (`bg-paper`, `text-ink`, `border-tile-edge`,
`fill-signal` …) ve CSS değişkenleri (`var(--color-sea)`) olarak kullanılır.

| Token | Değer | Rol |
|---|---|---|
| `paper` | `#eef2f1` | Sayfa zemini: serin harita kâğıdı |
| `land` | `#f8faf9` | Kareler, kartlar, paneller, form alanları |
| `band` | `#e4ebea` | İkincil bant bölümleri, tarama deseni çizgileri |
| `mist` | `#dce7ec` | Komşu ilçe kareleri; deniz zemininde gövde metni |
| `ink` | `#0a3352` | Açık zemindeki tüm metin, çizgi ve kenarlar |
| `ink-muted` | `#4a6377` | Altyazı, etiket, ikincil metin |
| `sea` | `#0a3352` | Boğaz mavisi zemin: levhalar, Hakkımda, footer, birincil buton |
| `on-sea` | `#ffffff` | Deniz zeminindeki metin |
| `on-sea-soft` | `#dce7ec` | Deniz zeminindeki gövde metni |
| `on-sea-muted` | `#b9d0df` | Deniz zeminindeki ikincil metin |
| `sea-line` | `#2c5577` | Deniz zeminindeki ayraçlar, buton hover |
| `sea-track` | `#6f93ae` | Deniz zeminindeki güzergâh çizgisi; anahtar haritada vurgulu kare |
| `signal` | `#f47a2e` | Tek vurgu; açık zeminde yalnızca dolgu |
| `signal-ink` | `#a8410e` | Açık zeminde küçük turuncu metin ("Yakında") |
| `hairline` | `#b8c7cd` | Dekoratif ayraçlar |
| `tile-edge` | `#6b8496` | Kare, form alanı ve sayfa numarası kenarları (≥ 3:1) |
| `keymap` | `#c3d1d8` | Anahtar haritadaki sıradan kareler |
| `danger` | `#a3261b` | Yalnızca form hataları (her zaman ikon ve "Hata:" metniyle) |

`ink` ve `sea` aynı renktir; ayrı adlar rolü anlatır: `text-ink` metin, `bg-sea` zemin.

### Kontrast tablosu

Oranlar WCAG 2.x formülüyle hesaplanır. `design-tokens.test.ts` bu tabloyu okur: her satırın oranı
token'larla birebir tutmalı ve türünün eşiğini geçmelidir (`text` ≥ 4.5, `large` ≥ 3, `ui` ≥ 3;
`decorative` satırlar bilgi taşımaz). Yeni bir metin/zemin eşleşmesi kullanmadan önce buraya ekleyin.

| Ön plan | Arka plan | Oran | Tür | Kullanım |
|---|---|---|---|---|
| `ink` | `paper` | 11.57:1 | text | Gövde metni, başlıklar, bağlantılar, çizgiler |
| `ink` | `land` | 12.46:1 | text | Kart, kare ve panel metni |
| `ink` | `band` | 10.80:1 | text | Bant bölümlerindeki metin |
| `ink` | `mist` | 10.37:1 | text | Komşu ilçe karelerindeki etiketler |
| `ink-muted` | `paper` | 5.57:1 | text | Altyazı, etiket, ayraç karakterleri |
| `ink-muted` | `land` | 5.99:1 | text | Kart ve panel içindeki altyazılar |
| `ink-muted` | `band` | 5.20:1 | text | Bant bölümlerindeki altyazılar |
| `ink-muted` | `mist` | 4.99:1 | text | Komşu ilçe karelerindeki ikincil metin |
| `signal-ink` | `paper` | 5.43:1 | text | Küçük turuncu metin ("Yakında") |
| `signal-ink` | `land` | 5.85:1 | text | Kart üzerindeki küçük turuncu metin |
| `signal-ink` | `band` | 5.07:1 | text | Bant bölümündeki küçük turuncu metin |
| `signal-ink` | `mist` | 4.87:1 | text | Komşu karedeki küçük turuncu metin |
| `danger` | `paper` | 6.53:1 | text | Form hataları |
| `danger` | `land` | 7.03:1 | text | Alan ve panel içindeki form hataları |
| `danger` | `band` | 6.09:1 | text | Bant bölümündeki form hataları |
| `ink` | `signal` | 4.77:1 | text | Levha numaraları, 2026 etiketleri, öne çıkan kare etiketi ve kenarı |
| `on-sea` | `sea` | 13.06:1 | text | Deniz zemininde metin: levhalar, Hakkımda, footer, butonlar, hat çipleri |
| `on-sea-soft` | `sea` | 10.37:1 | text | Deniz zemininde gövde metni |
| `on-sea-muted` | `sea` | 8.18:1 | text | Deniz zemininde ikincil metin |
| `on-sea` | `sea-line` | 7.86:1 | text | Birincil buton hover |
| `sea` | `on-sea` | 13.06:1 | text | Deniz zeminindeki beyaz hat çipi |
| `tile-edge` | `paper` | 3.47:1 | ui | Kare, form alanı ve sayfa numarası kenarı |
| `tile-edge` | `land` | 3.73:1 | ui | Kare kenarı, kendi dolgusuna karşı |
| `tile-edge` | `band` | 3.24:1 | ui | Bant bölümündeki kare kenarı |
| `tile-edge` | `mist` | 3.11:1 | ui | Komşu kare kenarı, kendi dolgusuna karşı |
| `ink` | `on-sea` | 13.06:1 | ui | Odak halkası, beyaz halesine karşı |
| `signal` | `sea` | 4.77:1 | ui | Durak noktaları, deniz zeminindeki geçerli dil çizgisi |
| `sea-track` | `sea` | 4.02:1 | ui | Deniz zeminindeki güzergâh çizgisi |
| `sea-track` | `land` | 3.10:1 | ui | Anahtar haritadaki vurgulu kareler |
| `signal` | `paper` | 2.43:1 | decorative | Öne çıkan kare dolgusu: sınırı 2 px mürekkep kenar çizer |
| `mist` | `paper` | 1.12:1 | decorative | Komşu kare dolgusu: sınırı kare kenarı çizer |
| `hairline` | `paper` | 1.54:1 | decorative | Satır ve bölüm ayraçları |
| `hairline` | `land` | 1.66:1 | decorative | Kart içi ayraçlar |
| `keymap` | `land` | 1.49:1 | decorative | Anahtar haritadaki sıradan kareler |
| `sea-line` | `sea` | 1.66:1 | decorative | Deniz zeminindeki ayraçlar |

Yasak eşleşmeler: açık zeminde `signal` metin (2.18–2.61:1), deniz zemininde `ink-muted` (2.08:1),
`hairline` ile bilgi taşıyan kenar.

### Boşluk, ölçü, köşe, gölge

| Token | Değer | Sınıf örneği | Kullanım |
|---|---|---|---|
| `--spacing-gutter` | `clamp(1rem, 4vw, 4.5rem)` | `px-gutter` | Sayfa yan boşluğu (16–72 px) |
| `--spacing-section` | `clamp(3.5rem, 7vw, 6.5rem)` | `py-section` | Bölüm dikey boşluğu |
| `--spacing-section-sm` | `clamp(2.5rem, 4.4vw, 4rem)` | `py-section-sm` | İlçe rehberi bölümleri |
| `--spacing-tap` | `2.75rem` | `min-h-tap`, `min-w-tap` | 44 px dokunma alanı |
| `--container-page` | `90rem` | `max-w-page` | 1440 px sayfa sütunu |
| `--container-measure` | `66ch` | `max-w-measure` | Okuma satırı |
| `--radius-tile` / `card` / `control` / `chip` | 2 / 3 / 4 / 6 px | `rounded-card` … | Kare / kart / buton / hat çipi |
| `--shadow-panel` | iki katmanlı mavi gölge | `shadow-panel` | Yalnızca açılır paneller |
| `--ease-atlas` | `cubic-bezier(0.2, 0, 0, 1)` | `ease-atlas` | Kısa geçişler |

Diğer her ölçü Tailwind'in 4 px tabanlı ölçeğinden gelir.

## 3. Tipografi

### Yazı aileleri

- **Archivo** (değişken; ağırlık ve genişlik `wdth` 62–125): tüm metin ve başlıklar. Genişlik ekseni bir
  sistemdir: `--stretch-wide` 125 % (ŞABAN DURALİ, levha başlığı, bölge etiketleri), `--stretch-title`
  112 % (kart başlıkları), `--stretch-heading` 92 % (h2), `--stretch-display` 88 % (ana sayfa h1, durak
  adları), `--stretch-compact` 82 % ve `--stretch-tile` 76 % (harita kareleri), gövde 100 %.
- **Martian Mono** (değişken, `wdth` 75–112.5, `--stretch-mono` 87.5 %): yalnızca veri — değerler, birimler,
  tarihler, kare adresleri, hat kodları, kaynak numaraları.

`fonts.ts` ikisini de `latin` + `latin-ext` alt kümeleri ve `display: "swap"` ile yükler; ğ Ğ ı İ ş Ş
`latin-ext` içindedir. Archivo önyüklenir (her sayfa onunla açılır). Martian Mono önyüklenmez: yalnızca
küçük veri etiketlerinde kullanılır ve ilk kullanıldığı sayfada iner. İtalik ya da başka bir statik kesim
istenmez. Kök layout'lar fontları yalnızca `fontVariables` sınıflarıyla `<html>` üzerine bağlar; başka
`next/font` çağrısı yapılmaz (test eder).

### Tip ölçeği

Her rol tek bir `type-*` sınıfıdır: boyut, satır aralığı, ağırlık, harf aralığı ve genişlik birlikte gelir.
Tailwind bileşik `type-*` sınıflarını tek özellikli sınıflardan önce yazar; bu yüzden bir özelliği tek bir
sınıfla ezebilirsiniz (`type-data font-bold`). Aynı özelliği iki tek özellikli sınıfla ayarlamayın
(`font-medium font-bold`): hangisinin kazanacağı sınıf adına bağlıdır.

| Sınıf | Boyut | Kullanım |
|---|---|---|
| `type-plate` | 44 → 150 px, 800, 125 % | İlçe rehberinin levha başlığı (h1); `PlateTitle` ile kullanın |
| `type-display` | 34 → 60 px, 800, 88 % | Ana sayfa h1 |
| `type-h2-lg` | 28 → 42 px, 800, 92 % | Ana sayfa bölüm başlıkları |
| `type-h2` | 26 → 34 px, 800, 92 % | Bölüm başlıkları |
| `type-card-title` | 26 → 32 px, 800, 112 % | Kart başlıkları |
| `type-h3` | 20 → 24 px, 800, 95 % | Alt başlıklar |
| `type-h4` | 18 px, 700 | Liste başlıkları, akordeon |
| `type-lead` | 19 → 24 px, 500 | Giriş paragrafı |
| `type-body` | 17 px / 1.65 | Gövde metni |
| `type-small` | 15 px | İkincil metin, navigasyon |
| `type-caption` | 13 px | Altyazı, lejant, kredi |
| `type-label` | 12 px, 600 | Kısa UI etiketleri |
| `type-sign` | 17 px, 700 | Yön levhası adı |
| `type-tile` | 14 px, 600, 76 % | Harita karesi etiketi |
| `type-region` | 13 px, 700, 125 %, 0.16 em | AVRUPA YAKASI gibi bölge etiketleri |
| `type-wordmark` / `type-tagline` | 17 / 12 px | ŞABAN DURALİ ve alt satırı |
| `type-data` / `type-data-md` / `type-data-lg` | 12 / 13 / 17 → 22 px, mono | Veri etiketleri, tarihler, tablo değerleri |

**Taban 12 px'tir.** Daha küçük bir token, sınıf ya da `text-[…]` değeri yoktur;
`typography-guard.test.ts` sitedeki tüm kaynakları tarar. Henüz yeniden yapılmamış eski bileşenler testte
listelidir; liste yalnızca kısalır.

### Türkçe karakter kontrolü

Yeni bir yazı ailesi, genişlik ya da ağırlık eklerken şu sözcükleri hem Archivo hem Martian Mono ile, en dar
(76 %) ve en geniş (125 %) genişlikte kontrol edin: **Şaban Durali, ŞABAN DURALİ, İSTANBUL BOĞAZI,
Kağıthane, Üsküdar, Çifte Havuzlar, Gaziosmanpaşa, ığüşöçİĞÜŞÖÇ**. Noktalı/noktasız i (İ ı) ve Ş Ğ
kuyrukları kesilmemeli, satır yüksekliği sıkışmamalı.

- Büyük harfli sabit etiketleri doğrudan büyük harfle yazın (`İSTANBUL BOĞAZI`). `uppercase` yalnızca
  doğru `lang` değerinin olduğu yerde kullanılabilir; `lang="tr"` "i" harfini "İ" yapar.
- Uzun ilçe adları dar karelerde yumuşak tire (U+00AD) ile bölünür; bölme noktaları
  `district-tile-grid.ts` içindeki `breaks` alanındadır ("Gazi|osman|paşa"), `getDistrictLabel(slug)` bu
  biçimi verir.
- Levha başlığı tek satıra sığacak kadar küçülür: `PlateTitle` görünen karakter sayısını
  (`--plate-chars`) CSS'e geçirir, `type-plate` boyutu `100cqi / (karakter × 0.82)` ile sınırlar (0.82 em,
  39 adın en genişi Çekmeköy'ün 125 % genişlikteki ölçülen karakter başı genişliği 0.792'yi kapsar). Boyut
  36 px'in altına inmez; daha dar bir sütunda yumuşak tireler ve `overflow-wrap` taşmayı önler. 390 px'te
  "Gaziosmanpaşa" ve "Küçükçekmece" tek satırdır.

## 4. Taban stiller ve katmanlar

`globals.css` içinde katmansız kural yoktur. Taban stiller `@layer base` içindedir; bu yüzden her Tailwind
sınıfı (`focus-visible:` dahil) onları ezebilir (FE-12).

- `body`: `paper` zemin, `ink` metin, Archivo, 17 px / 1.6.
- Başlıklar: 800 ağırlık, 92 % genişlik, `text-wrap: balance`. Boyutu `type-*` sınıfı verir.
- Bağlantılar: 1 px alt çizgi, 0.2 em ofset. Kart gibi blok bağlantılar kendi stilini kurar.
- **Odak halkası (FE-4):** her odaklanabilir öğede iki tonlu gösterge: 3 px `ink` halka, arada 3 px beyaz
  hale. Açık zeminde mürekkep halka (≥ 10.37:1), deniz zemininde beyaz hale (13.06:1) görünür.
  `Section tone="sea"` iki rengi yer değiştirir. Halkayı bir kapsayıcıya taşımak için `focus-ring`
  sınıfı vardır (kart). Halkayı kaldırmayın; `outline-none` yalnızca halka başka bir öğede çiziliyorsa.
  Taban kural haleyi `--tw-ring-offset-shadow` olarak da verir; bu yüzden `shadow-*` ya da `ring-*`
  sınıfı olan bir öğe odaklanınca hale kendi gölgesiyle birlikte görünür (koyu zeminde yalnız mürekkep
  halka kalmaz, test eder). Haleyi bilerek kaldırmak için `focus-visible:[box-shadow:none]` kullanın;
  `shadow-none` haleyi geri ekler.
- Hareket: `prefers-reduced-motion: reduce` tüm animasyon ve geçişleri durdurur. Yumuşak kaydırma
  yalnızca `no-preference` iken açıktır; kök layout'lar `data-scroll-behavior="smooth"` taşır, böylece
  Next.js 16 sayfa geçişlerinde yumuşak kaydırmayı kapatır.
- `::selection`: turuncu zemin, mürekkep metin (4.77:1).

### Geçiş dönemi

Eski koyu lacivert/altın palet (`--background`, `--ivory`, `--accent` …) `globals.css` sonunda
"Legacy" bloğundadır ve yalnızca henüz yeniden yapılmamış sayfaları okunur tutar. Yeni kodda kullanılmaz;
son kullanımı kalkan token silinir. TR ve EN kök layout'ları bu sayfalar için `<html class="scheme-dark">`
ve `<body class="bg-background text-foreground">` taşır; atlas layout'u bu sınıfları kaldırınca taban
zemin (`paper`) devreye girer. `--ink` ve `--focus-ring` eski bloktan çıkarıldı: `text-ink` artık Boğaz
mavisidir (eski açık zeminlerde de ≥ 5.44:1), odak halkası her yerde iki tonludur.

## 5. Bileşenler

Hepsi `src/components/ui/` altındadır ve aksi belirtilmedikçe sunucu bileşenidir. İstemci adaları
yalnızca etkileşim gerektirenlerdir: `SkipLink`, `Disclosure`, `NavMenu`, `FormStatus`. Her bileşenin
`locale` (`"tr"` | `"en"`) prop'u yerleşik metinleri (ekran okuyucu etiketleri dahil) seçer.

| Bileşen | Kullanım kuralı |
|---|---|
| `Container` | 1440 px sütun ve akışkan yan boşluk. Sayfa içeriği her zaman bunun içinde. |
| `Section` | `tone`: `paper` · `land` · `band` · `sea`; kendi zemin ve metin rengini kurar. Görünen başlığın id'sini `labelledBy` ile verin. |
| `SectionSign` | Yön levhası: turuncu durak numarası, mavi ad paneli, yön oku; son durakta kare. Ekran okuyucu "Bölüm 1, 12 bölümden: …" duyar. Başlık değilse `p`, başlıksa `as="h2"`. |
| `PlateTitle` | İlçe rehberinin dev levha başlığı (`h1`). İlçe adını `getDistrictLabel(slug)` ile verin; uzun adlar sütuna sığacak kadar küçülür. |
| `Button` / `ButtonLink` | `primary` (deniz), `secondary` (mürekkep kenar), `on-sea`. Eylem `Button`, gezinme `ButtonLink`. Gönderim sırasında `disabled` yerine `aria-disabled` (odak kaybolmaz). |
| `TextLink` | Her zaman altı çizili. `standalone` 44 px yüksek çağrı bağlantısı; `external`/`newTab` ↗ ve ekran okuyucu notu ekler. |
| `UiLink` | Site içi yollar `next/link`, diğerleri `<a>`. `//host` ve `/\host` dış bağlantı sayılır. |
| `Chip` | Çerçeveli mono etiket ("Eylül 2026 itibarıyla"). Etkileşimsiz. |
| `GridRef` | Kare adresi (F2): harf + rakam, çerçeveli mono. Harfler I, O ve K kullanmaz. |
| `LineChip` | Yalnızca hat kodları (M1B, M7): dolu yuvarlak köşeli çip; `other` bağlantı hattı, `on-sea` deniz zemini. |
| `StationMarker` | Durak ya da kurum (Davutpaşa–YTÜ): durak halkası + ad; asla çip değil. |
| `Badge` | Kısa durum: `signal` (2026), `neutral`, `soon` ("Yakında"). Anlamı metin taşır. |
| `Figure` + `Credit` | Görsel + altyazı + kredi (yazar/koleksiyon · tarih · lisans bağlantısı · kaynak bağlantısı). `credit` prop'u zorunludur: kredi gerektirmeyen görsel için açıkça `null`. |
| `SourceRef` / `SourceRefList` | Kaynak atfı köşeli parantezli numaradır: [3]. Kaynak tablosu satırı `id="kaynak-3"` (`sourceAnchorId`). 44 × 44 px dokunma alanı. |
| `FactTable` | `dl` tabanlı veri tablosu: etiket, mono değer + birim, veri tarihi, kaynak atıfları; değeri çip olan satırlar (raylı sistem) için `extra`. Dar kapsayıcıda bloklar ("Veri tarihi:" etiketiyle), 42 rem'den itibaren dört sütun ve görsel başlık satırı. Eksik tarih/kaynak ızgarada "—" ve ekran okuyucuya "yok"; dar düzende hiç gösterilmez. |
| `Breadcrumb` | "Konum" izi; son öğe `aria-current="page"`, ayraçlar gizli. |
| `SkipLink` | Her sayfanın ilk odaklanılabilir öğesi; odaklanınca görünür, içeriğe klavye odağını taşır. Ana içerik `<main id="main">` olmalı (yoksa ilk `<main>` bulunur). |
| `VisuallyHidden` | Yalnızca yardımcı teknolojiye metin. |
| `Disclosure` | Göster/gizle. Panel butonundan hemen sonra gelir, kapalıyken DOM'da `hidden` kalır, Escape kapatıp odağı butona döndürür. |
| `NavMenu` | Masaüstü açılır menüleri (FE-5). Bir sonraki bölüme bakın. |
| `Timeline` | `axis` (tarih ekseni) ya da `route` (güzergâh; 40 rem altında dikey). Duraklar dekoratif; sıra, tarih ve metin içeriktir. Gerçek tarihlerde `dateTime` verin. |
| `Card` | Tek başlık bağlantısı; tıklama alanı tüm kartı kaplar, üzerine gelince yalnızca başlığın altı çizilir, odak halkası kartın çevresine çizilir. Kart içindeki başka bağlantılar (kredi, kaynak) tıklanabilir kalır. `cta` yalnızca görsel ipucudur. |
| `EmptyState` | Veri yoksa taramalı panel ve düz cümle ("… henüz eklenmedi."). |
| `Pagination` | Önceki/sonraki ve sayfa numaraları; geçerli sayfa `aria-current`; tek sayfada hiçbir şey çizmez. |
| `Field` + `Input` / `Textarea` | Görünen `label`, `hint` ve `error` kontrolün `aria-describedby` listesine bağlanır, hata `aria-invalid` ve "Hata:" önekiyle gelir, zorunlu alanlar "(zorunlu)" yazar. |
| `FormStatus` | İki kalıcı canlı bölge: ilerleme/başarı `role="status"`, hata `role="alert"`; yalnızca metin değişir, sonuçta odak mesaja taşınır (FE-21). `aria-busy` kapsayıcısının dışında durur. |
| `StationDiagram` | Hat şeması: yalnızca metinde adı geçen duraklar; ilçeye hizmet eden duraklar turuncu ve aralarında düz çizgi, ilçe dışı kesim noktalı. Dar kapsayıcıda dikey liste (390 px'te etiketler sıkışmaz), 36 rem'den itibaren yatay. Yanına `Legend` ile "yalnız metinde adı geçen istasyonlar" notunu koyun. |
| `Legend` | Harita ve şema sembollerinin anahtarı; her sembol metinle adlandırılır. |
| `DistrictTileMap` | 39 ilçelik atlas. Bir sonraki bölüme bakın. |
| `DistrictKeyMap` | Küçük anahtar harita (kartlar, rehber başlığı); `title` verilmezse dekoratiftir. |

### NavMenu (masaüstü açılır menüler)

WAI-ARIA "disclosure navigation" deseni; `role="menu"` değildir, ekran okuyucular normal gezinme
kipinde kalır. Klavye modeli `menu-keys.ts` içindedir ve test edilir:

- Panel yalnızca butonundan açılır: tıklama, Enter, Space, Aşağı ok (ilk bağlantı) ya da Yukarı ok (son
  bağlantı). Odak ya da hover paneli açmaz.
- Escape paneli kapatır ve odağı butona döndürür. Panel içinde oklar, Home ve End bağlantılar arasında
  gezer.
- Tab asla tutulmaz: belge sırasıyla ilerler; odak menü öğesinin dışına çıkınca panel kapanır. Dışarı
  tıklamak ya da bir bağlantıyı seçmek de kapatır.
- Panel butonundan hemen sonra, aynı `li` içinde ve kapalıyken de DOM'dadır; `aria-controls` her zaman
  var olan bir öğeyi gösterir. Ekranın sağ yarısındaki menüler paneli sola doğru açar.
- Alt düzeyde çocukları olan öğe başlıklı bir bağlantı grubu olur (ör. Avrupa Yakası → 25 ilçe).
  `layout="stack"` aynı modeli mobil çekmecede akış içinde kullanır.

### DistrictTileMap (ilçe atlası)

- Veri: `district-registry.ts` (ad, yaka) + `district-tile-grid.ts` (kare konumları, onaylı prototipten).
  Test: 39 benzersiz ilçe, 25 Avrupa / 14 Anadolu, doğru yaka, benzersiz kare, Esenler'in yedi komşusu F2'ye
  değer.
- Sütun harfleri A–H, J (Avrupa) ve L, M, N, P, R (Anadolu); I ve O yoktur (İ/ı ve 0 ile karışır), Boğaz
  şeridinin harfi yoktur. Böylece K harfi kare adreslerinde hiç geçmez; kuzey oku "Kuzey" yazar, kaynaklar
  [3] biçimindedir. (Prototipte K hem Boğaz sütunu, hem kuzey oku, hem kaynak kodu önekiydi.)
- Haritanın kendisi en az 72 rem genişse (kapsayıcı sorgusu `@6xl`; geniş ekrandaki dar bir sütun da
  kompakt biçimi alır) tam ızgara: kenar cetvelleri (dekoratif), bölge etiketleri, Boğaz şeridi, lejant,
  kuzey oku ve "Şematik, ölçeksiz" etiketi. Daha dar kapsayıcıda anahtar harita + yakaya göre
  gruplanmış, Türkçe alfabe sırasıyla kare bağlantılar; telefon yatay kaydırmaz. Izgara kareleri yaklaşık
  70 px ister: 64 rem'de kareler 55 px kalır, "Bağcılar" gibi adlar sözcük ortasından bölünür ve kuzey oku
  Adalar'ın üstüne biner; bu yüzden ızgara 72 rem'de başlar (tam genişlikte bir `Container` içinde
  yaklaşık 1255 px ve üstü ekran).
- Açık zemin bileşenidir (`Section tone` `paper`, `land` ya da `band`): kendi zeminlerini ve `text-ink`
  metin rengini kendisi kurar, koyu bir sayfadan açık renk yazı devralmaz.
- Her kare ilçe adını taşıyan gerçek bir bağlantıdır (`prefetch={false}`: 39 bağlantı önceden yüklenmez).
  `featuredSlug` turuncu kare + "öne çıkan rehber" notu; `currentSlug` bağlantı değil, `aria-current="page"`;
  `highlightSlugs` sis renkli kareler (ör. komşular).

## 6. Erişilebilirlik kuralları

- Metin kontrastı ≥ 4.5:1 (24 px ve üzeri ≥ 3:1); bileşen sınırları ve odak göstergesi ≥ 3:1. Yeni eşleşme
  önce tabloya.
- Her sayfa: tek `h1`, sıralı başlıklar, `<main id="main">`, en başta `SkipLink`.
- Bağlantılar altı çizgili; renk tek başına bilgi taşımaz (öne çıkan kare: dolgu + kalın kenar + ok + metin).
- Dokunma alanı en az 44 × 44 px (yoğun listelerde en az 36 px yükseklik, 24 px'in üzerinde).
- Dekoratif SVG `aria-hidden="true"` ve `focusable="false"`; anlamlı görselde `alt` ya da `title`.
- Kart başına tek bağlantı; erişilebilir ad başlıktır.
- Form: görünen etiket, ipucu ve hata `aria-describedby` ile; durum duyurusu `FormStatus` ile; gönderim
  sırasında buton odakta kalır.
- 390, 820 ve 1440 px'te yatay kaydırma yok; geniş tablolar kendi kutusunda kayar ve odak halkası
  kırpılmaz.

## 7. Yap / yapma

| Yap | Yapma |
|---|---|
| `type-h2` gibi tek tip sınıfı | `type-h2 text-3xl font-bold` gibi çakışan sınıflar |
| Açık zeminde turuncuyu dolgu olarak, üstünde mürekkep | Açık zeminde turuncu metin |
| Eksik veri için `EmptyState` | "Yakında", örnek sayı ya da stok görselle doldurmak |
| Kaynak atfı `[3]`, kare adresi `F2`, hat `M1B` | Kaynağı `K03` gibi harf+rakamla yazmak |
| Kurum/durak için `StationMarker` | YTÜ'yü hat çipiyle göstermek |
| Görselde `credit` ya da bilinçli `null` | Lisans gerektiren görselde krediyi atlamak |
| `Section tone="sea"` ile koyu bölüm | `bg-sea` verip odak ve metin renklerini unutmak |
| 12 px ve üzeri | `text-[10px]`, `text-[0.6rem]` |
| Hareketi `motion-safe:` ile | Zorunlu animasyon, otomatik kayan içerik |
