# web/: Next.js dosyaları

Bu klasördeki dosyalar Next.js App Router’ın dosya adlarıyla hazırlandı. Next.js `<link rel="icon">`, `apple-touch-icon` ve `og:image` etiketlerini bu dosyalardan kendisi üretir.

## Nereye

| Dosya | Klasör | Ne işe yarar |
|---|---|---|
| `favicon.ico` | `app/` (kök) | Tarayıcı sekmesi; 16, 32 ve 48 px, küçük boy kesimi |
| `icon.svg` | `app/` | Vektör favicon (küçük boy kesimi) |
| `icon.png` | `app/` | 512 px favicon (küçük boy kesimi) |
| `apple-icon.png` | `app/` | 180 px, iPhone ve iPad ana ekranı (asıl işaret, deniz zemin) |
| `opengraph-image.png` | `app/` | 1200 × 630 paylaşım görseli |
| `opengraph-image.alt.txt` | `app/` | Paylaşım görselinin alternatif metni |
| `site.webmanifest` | `public/` | Uygulama adı, renkler ve ikonlar |
| `icon-192.png`, `icon-512.png` | `public/` | Manifest ikonları (yuvarlak köşeli) |
| `icon-maskable-512.png` | `public/` | Android maskable ikon |

## Adımlar

1. Sitenin bugünkü ikonlarını (siyah zemin, altın serif SD) bu dosyalarla değiştirin: `app/` içinde aynı adlı dosyalar varsa üzerlerine yazın.
2. `public/` içinde eski bir `favicon.ico`, `icon.png` ya da `apple-touch-icon.png` varsa silin; `app/` içindekilerle aynı adrese düşer ve eski ikon görünmeye devam edebilir.
3. Kök `app/layout.tsx` içindeki `metadata` nesnesine `manifest: '/site.webmanifest'` ekleyin. `metadataBase` olarak `new URL('https://sabandurali.com')` tanımlı değilse ekleyin; paylaşım görselinin tam adresi buradan gelir.
4. Bir sayfa kendi `metadata`’sında `openGraph` tanımlıyorsa `images` alanını boş bırakmayın ya da `opengraph-image.png` dosyasını o sayfanın klasörüne de koyun; aksi halde o sayfada görsel düşebilir.
5. Kontrol: sitede sekme ikonu yeni ŞD olmalı; bir sayfa bağlantısı paylaşıldığında görsel `opengraph-image.png` olmalı.

Ayrıntı ve logo bileşeni: `../SABAN_DURALI_BRAND_SYSTEM.md`.
