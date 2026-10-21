# Güvenlik dalı: dağıtım öncesi doğrulama — 21 Ekim 2026

Bu değişiklik henüz canlıya dağıtılmadı. İncelenen uygulama commit'i `26be65cd9f1bb17edeec92809591b9ac0580d2ed`; taban `d47df10d773fc6a7b2f491e5df24cbe889d9d60d`. Bu rapordan sonra yalnızca dokümantasyon eklenmiştir.

## Son doğrulama

- Önceki temiz npm kurulumu, üretim build'i, lint ve 22 regresyon testi geçti; uygulama ve kilit dosyaları o doğrulamadan sonra değişmedi.
- Canlı PostgreSQL 18.6 custom dump'ı ayrı boş yerel ortama, ardından şifreli harici kopyadan ikinci boş ortama geri yüklendi. 115 tablo / 34.526 satır için kaynak snapshot ile bütün içerik hashleri eşleşti. Üretim Blob deposunun 15 dosyası iki indirmeyle doğrulandı. Preview Blob panelinde filtresiz kök envanter boş olarak doğrulandı.
- Güvenlik dalının üretim build'i, geri yüklenen PostgreSQL'e yalnızca SELECT yetkili ayrı rol ile localhost'tan bağlandı. Gerçek üretim sırları kullanılmadı; Payload ve Blob kimlikleri test değerleriydi. Blob adaptörü public kaynak URL'lerini okudu.
- Ana sayfa, iletişim, admin login, 404, statik ve optimize JPEG başlık testleri geçti. Anonim kullanıcı API'si 403 döndü. PostgreSQL üzerinden ilçe API'si 39, medya API'si 15 kayıt bildirdi. Gerçek public Blob görseli Next image optimizer üzerinden 200 döndü; MIME, nosniff ve image sandbox CSP kontrolü geçti.
- Önceki tarayıcı doğrulaması yerel yapay hesapla admin/Monaco ve görsel yükleme akışlarını kapsar. Yeni PostgreSQL testi salt okunurdur; gerçek yönetici oturumu, gerçek Blob yazma işlemi ve Formspree teslimatı sınanmadı.
- İletişim bileşeni Formspree'ye fetch ile gönderir; CSP connect-src/default-src kısıtlaması eklenmedi. form-action aynı origin ve Formspree'yi kapsar. Katı script/XSS CSP sağlandığı iddia edilmiyor.

## Geri dönüş

- Migration, koleksiyon şeması, Payload config veya içerik değişikliği yoktur. Taban ile farkın ters yamasına `git apply --reverse --check` başarılı oldu; bu kontrol çalışma dosyalarını değiştirmedi.
- İleride izin verilerek dağıtılırsa, sorun halinde önce doğrulanmış önceki Vercel deployment'ı tekrar etkinleştirin. Deployment ayarlarını ve önceki deployment kimliğini dağıtım öncesi yeniden doğrulayın.
- Git tarafında yayımlanmış geçmişi koruyarak güvenlik kodu değişikliğini yeni bir revert commit'iyle geri alın. Squash/merge yöntemine göre geri alınacak gerçek commit'i seçin; force push/reset kullanmayın. Bu değişikliğin geri dönüşü için veritabanını eski snapshot'a döndürmek gerekmez ve yeni içerik kaybına yol açabilir.
- Canlı rollback uygulanmadı. Bu bir doğrulanmış ters-yama kontrolü ve geri dönüş prosedürüdür; gerçek platform rollback denemesi değildir.

## Karar ve sınırlar

Taslak PR incelemeye hazırdır; otomatik dağıtım bu dal için kapalıdır. Tam canlı uçtan uca uyumluluk doğrulanmış sayılmaz. Kurtarma için gerekli özgün production PAYLOAD_SECRET değeri yetkili yerel kaynaklarda doğrulanamadı; çalışan sır değiştirilmedi. Formspree eski başvurularının yalnızca görünen önizlemesi kaydedilebildi; tam dışa aktarım plan sınırına takılıyor. Ayrıntılı özel yedek ve parola saklama durumu yerel raporda tutulur.

Bağımlılık sonuçları değişmedi: son audit toplam 13 yüksek / 6 orta, omit-dev 10 yüksek / 6 orta. Monaco'nun gömülü/CDN sanitizer kopyaları, braces ve eski esbuild riskleri açık olarak korunmuştur. npm override yalnızca kendi kapsadığı DOMPurify bağımlılığını yamalar. Büyük yükseltme veya npm audit fix --force yapılmadı.
