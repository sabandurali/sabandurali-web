# Ürün hazırlık değerlendirmesi

18 Ekim 2026 · İncelenen demo kodu: `d31332b`, dal `codex/istanbul-research-assistant`. Kullanıcı tarafından bildirilen Production: `dc798d5`. Değerlendirme mevcut kod, snapshot ve önceki belgeler üzerindendir; Production/DB bağlantısı, deploy veya test tekrarı yapılmadı.

## Başvuru değerlendiricisinin ilk 30 saniyesi

**Amaç anlaşılır görünüyor (kod/metin incelemesi; kullanıcı testi değil).** TR girişinde ilçe tanıma, iki ilçe karşılaştırması ve kaynaklara ulaşma açıklanıyor; EN girişinde 39 ilçelik erken prototip açıkça yazıyor. Ücretsiz mod ile Claude entegrasyonu ayrılıyor. İngilizce sunum Türkçe etkileşime eşlik eder. Bunu ölçülmüş 30 saniyelik anlama başarısı olarak sunmuyoruz.

Dayanak: `src/components/assistant/ResearchAssistant.tsx`; `src/app/(en)/en/istanbul-research-assistant/page.tsx`.

## Kaynaklar ve tarihler

**Prototipin izlenebilirliğini göstermek için yeterli; bağımsız doğruluk garantisi değil.** Arayüz rehber bağlantısı ve güncelleme tarihini; açılabilir kaynak listesinde yayıncı, veri tarihi ve editoryal kontrol tarihini gösteriyor. Eksik tarih “Belirtilmemiş” olarak gösterilir. Bölüm düzeyi kaynak ilişkisinin sınırı ve snapshot niteliği açıklanır. Linkler bu görevde yeniden taranmadı; canlı veri güncelliği iddiası yoktur.

## 402 → 391 açıklaması

[Önceki Preview raporu](../assistant/PREVIEW.md) farkı yeterince belgeliyor: Production için önceki doğrulanmış 402 kayıt, depodaki editoryal dosyada da 402. Yayın politikası sonucunda 391 kaynak kaydı demo snapshot'ına geçiyor. Önceki rapor 39 ilçenin URL çoklu kümelerinin eşleştiğini kaydediyor; bu eşleştirme bu görevde tekrar çalıştırılmadı.

| Dışarıda kalan | Adet | Açıklama |
| --- | ---: | --- |
| Ulaşım/planlama için gerekli `dataDate` eksik | 8 | Bakırköy Ulaştırma; Kartal Marmaray; Maltepe Şehir Hatları; Pendik Tuzla–Pendik–Büyükada; Sancaktepe metro projesi; Ümraniye M8; Üsküdar M5 ve Şehir Hatları |
| `official` türü, mevcut resmî alan adı izin listesi dışında | 3 | Beylikdüzü Yaşam Vadisi için iki `beylikduzu.istanbul` kaydı; Esenler YTÜ raporu `yildiz.edu.tr` |

402 − 8 − 3 = 391. Son grup yanlış kaynak demek değildir; sınıflandırma/izin listesi sınırıdır. Snapshot üretimi kamu API'sinin yayın filtresinden gelen kaynaklarını alır; asistana özel yeni bir kaynak elemesi değildir. 391 benzersiz sayfa veya her yanıtta kullanılan kaynak sayısı değildir. Kullanıcı/kaynak içeriği değiştirilmedi.

## Gerçek Claude pilotundan önce teknik engel

**Kodda yeni bir uygulama geliştirmesini zorunlu kılan engel tespit edilmedi; canlı uyumluluk doğrulanmış değil.** `claude.ts`, `pilot-policy.ts`, `http.ts` ve [pilot planı](../assistant/CLAUDE-PILOT.md) sunucuya özel entegrasyonu, varsayılan kapalı çalışmayı, Vercel'de ücretli çağrı yasağını, yerel onay/süre/kota kontrollerini, altı aday sınırını, token ön sayımını, 800 çıkış token'ı sınırını, 20 saniyelik süreyi ve otomatik tekrar yapılmamasını gösteriyor.

İlk gerçek çağrıdan önce zorunlu operasyonel kapılar: kurucunun ücretli pilot onayı ve bütçe/süre/deneme sınırı; kendi Console hesabında model erişimi ve güncel fiyat doğrulaması; mevcut gizli anahtarın güvenli süreç aktarımı ve sağlayıcı veri işleme koşullarının kabulü. Anahtar bu görevde oluşturulmadı veya okunmadı. Süreç sayacı yeniden başlatmada sıfırlanır; hesap genelinde kesin maliyet limiti değildir. Pilot tek süreçte ve insan gözetiminde yapılmalıdır. Bu kapılar sağlanmadan canlı model hazır/başarılı deneme iddiası kurulamaz.

Claude yalnız mevcut anahtar sözcük aday havuzunu daraltır; tüm 391 kayıt üzerinde bağımsız anlamsal arama veya serbest araştırma yapmaz. Pilot başarı iddiaları bu gerçek görevle sınırlandırılmalıdır.

## Anthropic onayı izlenimi

**İncelenen TR/EN ürün metinlerinde onay, sponsorluk veya ortaklık iddiası görülmedi.** Ücretsiz mod ve tamamlanmamış canlı test açıklanıyor. Yeni başvuru metinleri şirket kurulmadığını ayrıca netleştiriyor. Önceki başvuru taslakları yeni dosyalara yönlendirilerek belirsiz şirket bilgisi ifadelerinin yeniden kullanılması önlenir.

## Gösterim kararı ve kanıt sınırı

Mevcut ücretsiz demo, erişimi olan değerlendiriciye üç özellikli sunum için hazır kabul edilebilir. Bu, bu görevde yeni tarayıcı doğrulaması yapıldığı anlamına gelmez. Vercel Authentication korunur. Kullanıcı bildirimine göre geçici link 19 Ekim 2026 02:57 Türkiye saatinde sona erer; kalıcı başvuru demo adresi değildir. Link/token bu dosyalarda tutulmaz. Sonraki değerlendirme için erişim gerekirse o tarihte ayrıca karar verilmelidir.

Kullanıcı Aşama 15–18 için 59 başarılı otomatik test bildirdi. Depodaki [değerlendirme notu](../assistant/EVALUATION.md) mock sözleşme/güvenlik kapsamını anlatıyor; bu görevde 59 test yeniden çalıştırılmadı ve yeni test sonucu üretilmedi. Gerçek Claude doğrulaması ve fatura incelemesi yapılmadı. Kaynak içerikleri üzerinden statik sayım, doküman bağlantıları ve Git farkı kontrolü testlerin tekrarı değildir.

Engelleyici kalanlar: başvuruların kapalı olması; şirketleşmemiş kurucu uygunluğunun belirsizliği; gerçek Claude için onaylı hesap/model/bütçe kapıları; ileride değerlendirici için geçerli korumalı erişim. Yeni özellik geliştirme zorunluluğu bulunmadı.
