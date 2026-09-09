# Kaynak ve içerik incelemesi — 9 Eylül 2026

39 PDF yeniden çıkarılmadı; mevcut 535 sayfalık araştırma havuzu ve PDF SHA-256 eşleştirmeleri kullanıldı. `data/districts/research.json` ham araştırmadır; `editorial.json` aynı DistrictGuides import akışına bağlanan, yeniden yazılmış sınırlı yayın içeriğidir. İkinci bir public veri kaynağı değildir: public sayfalar yine mevcut Payload kaydını okur.

## İncelemenin kapsamı

- 39/39 ilçe için özet, seçilmiş tarih/coğrafya metni ve mahalle listesi onaylandı. Metinler PDF transkripsiyonu değildir.
- 39/39 mahalle listesi güncel erişilebilen resmî dizinlerle karşılaştırıldı. Tarihsiz dizinin erişildiği gün, **gözlem tarihidir**; kurumun yayın tarihi değildir. Gelecekteki idari değişikliklere karşı kalıcı güncellik garantisi vermez.
- İBB muhtarlık dizinlerinin tamamı okundu; mevcut ilçe belediyesi/kaymakamlık listeleriyle karşılaştırıldı. JavaScript gerektiren Beşiktaş ve Sarıyer listeleri tarayıcıda açıldı. Büyükçekmece’nin iki sayfası birlikte kontrol edildi.
- 1.500 ham kaynak kaydındaki 1.407 benzersiz URL için HEAD erişim kontrolü ve başlık/alan adı risk taraması yapıldı. **Bu, 1.500 belgenin tüm iddialarının semantik onayı değildir.** Ham kaynakların hiçbiri otomatik güvenilir veya public kabul edilmedi.
- Onaylı kaynakların kullanımı yalnız `sections` ile belirtilen seçilmiş iddiaları kapsar. Resmî sayfaların tamamı doğru kabul edilmedi.

## Somut düzeltmeler

| Konu | Karar / kanıt |
|---|---|
| Esenler 17 → 19 | [13 Ocak 2026 belediye duyurusu](https://esenler.bel.tr/haberler/genel/esenlere-iki-yeni-mahalle-kazandirildi/) ve İBB dizini: Şehitler, Yeşil Vadi eklendi. Eski belediye muhtarlık sayfası da 17 ile güncel değildi. |
| Beykoz | PDF’de Ortaçeşme eksik; Çiftlik/Çavuşbaşı Çiftlik çift kayıt. [Belediyenin e-Devlet mahalle seçicisi](https://www.turkiye.gov.tr/beykoz-belediyesi-arsa-rayic-degeri-sorgulama-v2) ile 45 kayıt ve Çiğdem, Polonezköy, Zerzavatçı yazımları doğrulandı. İBB/kaymakamlık dizinlerindeki yazım hataları kopyalanmadı. |
| Sultangazi | İBB 14 kayıtla eksik; [belediyenin e-Devlet seçicisi](https://www.turkiye.gov.tr/sultangazi-belediyesi-arsa-rayic-degeri-sorgulama-v2) 15 kaydı ve Zübeyde Hanım’ı doğruluyor. Belediye tanıtım sayfasının “güncellenmektedir” mesajı içerik kanıtı sayılmadı. |
| Esenyurt | PDF tam liste iddiasına rağmen Koza maddesinde kesiliyor ve Bağlarçeşme içeriyor. Belediye/İBB tam listeleri 43 kayıtta uyuşuyor; bu dizinlerde Bağlarçeşme yok, Şehitler var. İdari karar tarihi doğrulanmadığından ad değişikliği tarihi ileri sürülmedi. |
| Şile | PDF’de Kalem/Kızılca/Korucu; resmî dizinde Kalemköy/Kızılcaköy/Korucuköy. Akçakese/Akçekese resmî kaynaklar arası yazım farkı; yerel ilçe kaynaklarının Akçekese yazımı kullanıldı. |
| Başakşehir | Şahintepesi yerine belediyenin Şahintepe yazımı; Kayaşehir ayrı mahalle yapılmadı. Kaymakamlık alan adındaki TLS sertifika uyuşmazlığı atlanmadı. |
| Bakırköy / Adalar | Ataköy kısımları birleşik mahalle kayıtları olarak korundu; Maden ve Nizam’da Büyükada semt öneki idari adla karıştırılmadı. |
| Şişli / Sultanbeyli | Eski idari kapsamlar güncel komşuluk olarak sunulmadı. Şişli’de Ayazağa/Maslak, Sultanbeyli’de Paşaköy-Kartal anlatımı çıkarıldı. |
| Kalıcı iddialar | Bakırköy’de Konstantin/384; Çatalca’da MÖ 450 Roma anlatımı; Beyoğlu’nda Galata Kulesi 13. yüzyıl; Ümraniye’de Harun Reşid/Frigler ve ilçe geneli sağlam zemin; Maltepe’de 816/Theophilos; Bahçelievler’de Hebdomon eşleştirmesi kullanılmadı. Bunların yerine desteklenmiş dar kapsamlı metinler yazıldı. |

İlçe bazındaki resmî listeler, kaynak URL’leri, içerik kaynağı hash’leri ve notlar `editorial-review.json` içindedir. Normalize PDF metninde bulunmayan adlar yalnız eşleştirme kontrolüdür; imla/kısaltma farkı yeni mahalle anlamına gelmez.

## Envanterdeki riskler

`source-inventory-audit.json` 1.500 kaydın her birini gerçek yayıncı alan adı, erişim sonucu ve public dışı kararıyla gösterir. Bayraklar üst üste gelebilir:

- 11 kaynak kaydında HEAD 404/410.
- 34 kaynak kaydında ağ/TLS hatası; bunlar kesin olarak “silinmiş” sayılmaz.
- 55 kaynak kaydında diğer erişim belirsizlikleri; 403/405 bir belgenin yanlış olduğunu kanıtlamaz.
- 31 kurumsal başlıklı kayıtta yayıncı kimliği ayrıca incelenmeli. Bu sayı 31 yanlış kaynak demek değildir: haber aktarımı ve özel alan adlı gerçek belediye de bu grupta olabilir.
- 6 başka ilçe alan adı bağlantısı; bağlam dikkate alınmalı. Beşiktaş metnindeki Ataşehir coğrafyası, Gaziosmanpaşa’daki Arnavutköy tarihçesi, Esenyurt’taki Beylikdüzü coğrafyası ilgili ilçenin doğrudan kanıtı olarak kullanılmadı. Bağcılar gezisini duyuran Esenler sayfası, Bayrampaşa tramvayını anlatan Eyüpsultan haberi ve Ümraniye–Ataşehir metro haberi bağlamsal olabilir; yine de bu yayına alınmadı.
- 26 HTTP kaydı, 2 alan adı değiştiren yönlendirme ayrıca işaretlendi.
- 11 URL’de boşluk, satır ayırıcı veya sonda alıntı işareti gibi şüpheli karakterler bulundu; bunlar otomatik düzeltilip güvenilir sayılmadı.

Örnek yanlış resmî izlenimler: Kartal Aydos bağlantısı **Wikimapia**; Sancaktepe/Zeytinburnu belediye başlıklı sayfalar **kentbilgisistemi.com**; Bahçelievler belediye başlıklı kayıt **turkiye-belediyeleri.com**; Beşiktaş kurum profilleri **The Org/RocketReach**. Bunlar belediye yayını olarak etiketlenmedi. AA veya başka haber kuruluşunun belediye haberi, resmî birincil belge yerine geçmez. Bahçelievler’in gerçek `bahcelievler.istanbul` alan adı ise [e-Devlet belediye profilinden](https://www.turkiye.gov.tr/bahcelievler-belediyesi?belediye=TumHizmetler) doğrulandı.

## Bilinçli yayın dışı alanlar

39 ilçenin tamamında nüfus/yüzölçümü/yoğunluk, m² fiyatı, kira, amortisman, getiri tahmini, proje yüzdesi ve açılış/teslim takvimi bu incelemede yayın onayı almadı. Bazı kaynaklarda tarihli değer bulunması, bütün serinin karşılaştırılabilir veya güncel olduğunu kanıtlamaz; değerler uydurulmadı.

Ulaşım hatları/süreleri, güncel tesis hizmetleri, ziyaret erişimi ve saha rotaları, bina güvenliği/kalitesi ile gelir grubu genellemeleri de bu dar yayın kapsamına alınmadı. Bu alanların boş olması teknik arıza değildir. **Geniş kapsamlı şehir/saha rehberi içeriği henüz tamamlanmış sayılmaz.** 14 bölümlük görünüm korunur; boş bölümler açık durum mesajı gösterir. Gayrimenkul yatırım tavsiyesi uyarısı korunur. Haberler, fotoğraflar ve yayımlanmış araştırmalar yalnız mevcut Articles/Photos ilişkilerinden gelir.
