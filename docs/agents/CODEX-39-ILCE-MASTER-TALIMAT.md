# CODEX — İstanbul 39 İlçe Yayınlama Master Talimatı

## Amaç
`sabandurali/sabandurali-web` projesindeki mevcut İstanbul ilçe altyapısını, kullanıcı tarafından sağlanan 39 ilçe araştırma PDF'sini kullanarak üretime hazır, sürdürülebilir ve CMS üzerinden yönetilebilir bir **İstanbul 39 İlçe İçerik ve Yayın Merkezi** haline getir.

Bu çalışma yeni bir site/mimari kurma işi değildir. Mevcut Next.js + Payload mimarisini incele, varsa mevcut ilçe modülünü genişlet; aynı işi yapan ikinci bir sistem oluşturma.

## Çalışma biçimi ve güvenlik sınırları
1. Önce repo durumunu ve proje talimatlarını oku: `git status`, `git branch --show-current`, `git log -n 10 --oneline`, `AGENTS.md`, `README.md`, `package.json`, Payload config/collections/globals, mevcut ilçe registry/route/haber/fotoğraf/SEO kodları ve migration/DB yapısı.
2. Çalışma ağacı temiz değilse mevcut kullanıcı değişikliklerini silme, resetleme veya üzerine yazma.
3. Mevcut ilçe altyapısı varsa refactor/extend et; duplicate collection/route/model oluşturma.
4. Production verisini silen/destructive migration yapma.
5. `.env*`, production secrets, Vercel/Neon/Blob kaynakları ve canlı environment değerlerini değiştirme.
6. `YONETIM-PANELI-KULLANIM-KILAVUZU.md` dosyasını kullanıcı ayrıca istemedikçe değiştirme.
7. PDF araştırma dosyalarını Git deposuna commit etme.
8. `main` üzerinde doğrudan geliştirme yapma. Yeni feature branch kullan: `codex/istanbul-39-ilce-production`.
9. Açık kullanıcı onayı olmadan production deploy, `main` merge veya production migration çalıştırma.
10. Mevcut içerikleri, kullanıcıları, rolleri, medya kayıtlarını ve CMS verilerini koru.

## Kaynak seti
39 ilçe: Adalar, Arnavutköy, Ataşehir, Avcılar, Bağcılar, Bahçelievler, Bakırköy, Başakşehir, Bayrampaşa, Beşiktaş, Beykoz, Beylikdüzü, Beyoğlu, Büyükçekmece, Çatalca, Çekmeköy, Esenler, Esenyurt, Eyüpsultan, Fatih, Gaziosmanpaşa, Güngören, Kadıköy, Kağıthane, Kartal, Küçükçekmece, Maltepe, Pendik, Sancaktepe, Sarıyer, Silivri, Sultanbeyli, Sultangazi, Şile, Şişli, Tuzla, Ümraniye, Üsküdar, Zeytinburnu.

PDF'leri ham araştırma/kaynak havuzu kabul et. PDF'de “TÜİK” yazıp URL üçüncü taraf siteye gidiyorsa resmi TÜİK kaynağı gibi etiketleme. Birincil/resmî kaynak > akademik/kurumsal kaynak > güvenilir ikincil kaynak > piyasa platformu. Kaynağı zayıf veya doğrulanamayan kesin rakamı public içeriğe otomatik alma. Kaynak/URL uydurma, eksik veriyi tahminle doldurma.

## Veri sınıfları
### A — Kalıcı / düşük değişken
Tarihçe, coğrafi konum, tarihî yapılar, genel şehir karakteri, temel mekânsal kimlik.

### B — Periyodik
Nüfus, yüzölçümü, mahalle sayısı/listesi, ulaşım ağı. Mümkün olduğunca `dataYear`, `source`, `verifiedAt` tut.

### C — Dinamik / yüksek değişken
Konut satış fiyatı, kira, amortisman, proje ilerleme yüzdesi, metro açılış hedefi, dönüşüm projesi durumu ve haberler. Kaynak, veri tarihi, son doğrulama tarihi ve gerektiğinde `needsVerification` zorunlu olsun. Eski/doğrulanamayan dinamik veriyi güncel gerçekmiş gibi yayınlama.

## İlçe sayfası standart modeli
1. İlçeye Genel Bakış — kısa özet, yaka, yüzölçümü, nüfus+veri yılı, mahalle sayısı, şehir karakteri
2. Tarihçe
3. İlçeyi Tanı — coğrafya, demografi, İstanbul içindeki rolü, ayırt edici karakter
4. Yaşam ve Ulaşım — günlük yaşam, ticaret, eğitim/sağlık, yeşil alan, metro/tramvay/Marmaray/metrobüs/otobüs/deniz/karayolu; devam eden projeler ayrı statü
5. Mahalleler — tam resmî liste + öne çıkan mahallelerin karakteri
6. Gayrimenkul ve Yapı Dokusu — yapı stoku, alt bölge farklılıkları, dönüşüm, piyasa göstergeleri varsa kaynak+tarih. Görünür uyarı: **“Bu içerik yatırım tavsiyesi değildir. Gayrimenkul verileri belirtilen veri tarihindeki piyasa göstergelerini yansıtır.”**
7. Şehircilik, İmar ve Kentsel Dönüşüm — statüler: Planlama / Onay / İhale / İnşaat-Uygulama / Tamamlandı / Belirsiz-Doğrulama gerekli
8. Görülecek ve Fotoğraflanacak Yerler — saha rehberi, gündüz/gece, fotoğraf değeri, mahalle/bölge
9. İlçeden Kareler — mevcut Photos sistemiyle ilişkilendir; fotoğraf yoksa bölüm bozulmasın/gizlenebilsin
10. İlçeyi Özel Kılan Şeyler
11. Araştırmalar ve Analizler — ileri araştırma konuları, ileride Articles ile ilişkilendirilebilir
12. İlçeden Haberler — mevcut Articles/haber altyapısı; ana ilçe sayfasında en fazla 3 güncel haber; tüm haberlere bağlantı; tam metin kopyalama yok, özet+orijinal kaynak
13. Kaynaklar ve Metodoloji — kurum/yayıncı, başlık, URL, kaynak türü, veri/yayın tarihi, son kontrol tarihi, birincil kaynak mı, desteklediği bölüm
14. Son Güncelleme

## CMS / Payload hedefi
Önce mevcut modeli incele; en az değişiklikle hedefi sağla.
- İlçeler CMS üzerinden yönetilebilir olmalı.
- 39 ilçe merkezi registry tek doğruluk kaynağı olmalı.
- Slug sabit ve SEO dostu olmalı.
- TR içerik şimdi yayınlanabilir.
- EN mimari desteklenebilir fakat araştırma olmadığı için otomatik/uydurma İngilizce çeviri üretme.
- District relation gereken mevcut koleksiyonlarda string tekrarları yerine mümkünse kontrollü ilişki/enum kaynağı kullan.
- Articles ile district/neighborhood/newsType/source ilişkisi korunmalı.
- Photos ile district/neighborhood/category/dayNight ilişkisi korunmalı.
- Media usage protection ve publish-date guard bozulmamalı.
- Admin kullanımını gereksiz karmaşıklaştırma.
- Mevcut merkezi registry + dinamik route varsa kaldırma; veri sözleşmesini güçlendir.

## İçerik aktarım stratejisi
39 PDF'yi elle kod içine yapıştırma.
Tercih:
1. mevcut Payload modeline idempotent import/seed script
2. yapılandırılmış JSON/TS ara veri + import script
3. mevcut CMS yapısına en az riskli eşdeğer yöntem

Import:
- slug üzerinden upsert
- ikinci çalıştırmada duplicate üretme
- mevcut elle düzenlenmiş içeriği kontrolsüz overwrite etme
- `--dry-run` veya eşdeğer önizleme
- oluşturulacak/güncellenecek/atlanacak kayıt sayısını raporla
- dinamik/doğrulanmamış alanları draft/flag tut
- PDF binary'lerini repoya alma

## URL ve davranış
Önce mevcut canonical ilçe route'unu tespit et ve koru. Paralel URL ailesi oluşturma.
- İstanbul 39 İlçe ana rehber
- 39 detay sayfası
- ilçe bazlı tüm haberler
- geçersiz slug => 404
- eski/alternatif route varsa canonical redirect
- breadcrumb: Ana Sayfa > İstanbul > İlçeler > [İlçe]
Ana merkezde 39 ilçe, Avrupa/Anadolu filtresi, alfabetik erişim, arama, kısa kart özeti.

## SEO
Her ilçede unique title/description, canonical, Open Graph, yalnız mevcut dil için hreflang, breadcrumb structured data, uygun schema, sitemap, robots, iç bağlantılar. Keyword stuffing yapma. Mevcut SEO helper sistemini önce incele.

Örnek title: `[İlçe] Rehberi | Tarih, Yaşam, Ulaşım ve Gayrimenkul | Şaban Durali`

## Tasarım
Yeni tasarım dili icat etme. Mevcut sitenin tipografi/spacing/kart/renk/responsive sistemini kullan.
- güçlü hero
- gerekirse bölüm navigasyonu/sticky TOC
- mobilde kırılmayan tablolar
- kaynaklar sade
- uzun PDF metnini tek blok yapma
- fotoğraf yoksa boş placeholder karmaşası yaratma
- erişilebilir heading hiyerarşisi
- doğrulanmamış sahte mahalle haritası/geometrisi üretme

## Yayın kapıları
Otomatik kabul ETME:
- “2026'da açılacak”
- “%97 tamamlandı”
- kesin m²/kira rakamları
- “TÜİK verisi” denip üçüncü taraf URL verilmesi
- “en güvenli zemin”
- kaynak gerektiren üstünlük iddiaları

Bunları ya güçlü kaynak+tarih ile kullan, ya nötrleştir, ya `needsVerification` yap, ya public metinden çıkar.

## Test / Acceptance
Statik:
- `git diff --check`
- `npm run lint`
- TypeScript `--noEmit` (projeye uygun komut)
- production build

Veri/CMS:
- migration/schema güvenliği
- SQLite dev bozulmamalı
- PostgreSQL prod uyumu korunmalı
- import dry-run
- 39 unique district
- 39 unique slug
- duplicate yok

Route:
- 39 ilçe URL'si 200
- ana rehber 200
- invalid slug 404
- boş fotoğraf UI bozulmuyor
- hiçbir testte 5xx yok

SEO:
- 39 canonical
- sitemap
- metadata
- breadcrumb
- yanlış noindex yok

Regression:
ana sayfa, makaleler, kitaplar, fotoğraflar, admin, `/admin/help` çalışmaya devam etmeli.

## Git teslim
Branch: `codex/istanbul-39-ilce-production`

Örnek commitler:
- `feat: strengthen district content model`
- `feat: add district content import pipeline`
- `feat: render 39 district guides`
- `feat: connect district news and photography`
- `test: add district production acceptance`

En sonda raporla:
- branch
- başlangıç HEAD
- bitiş HEAD
- değişen dosyalar
- migration durumu
- import sonucu
- 39/39 route sonucu
- lint/type/build
- bilinen riskler
- doğrulanması gereken dinamik veriler
- production için GO / NO-GO

Kullanıcı istemeden `main` merge/push/deploy yapma.

## Çalışma sırası
Aşama 0 Keşif → Aşama 1 Veri sözleşmesi → Aşama 2 39 ilçe veri dönüşümü → Aşama 3 Import → Aşama 4 Public UI → Aşama 5 SEO → Aşama 6 Test → Aşama 7 Teslim.

## Başarı tanımı
- 39 ilçe eksiksiz
- aynı içerik sözleşmesi
- CMS'den güncellenebilir
- dinamik veriler kaynak/tarih kontrollü veya public dışı
- haberler ve fotoğraflar ilçe ile ilişkili
- 39 sayfa mobil+SEO uyumlu
- mevcut site bozulmamış
- production tek kontrollü onay adımına indirilmiş

Başlangıçta önce keşif yap. Mevcut kodun gerçekten ne durumda olduğunu görmeden varsayımla collection/route yaratma. En küçük, güvenli ve sürdürülebilir değişiklik setiyle ilerle.
