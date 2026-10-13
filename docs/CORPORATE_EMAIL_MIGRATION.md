# Kurumsal iletişim e-postası geçişi

Kontrol tarihi: 13 Ekim 2026.

## Kapsam

- Kurumsal iletişim adresinin tek kaynak kod tanımı `src/config/site.ts` içindeki `contactEmail` değeridir.
- Türkçe ve İngilizce statik footer etiketi ve `mailto:` hedefi bu değeri kullanır.
- Türkçe KVKK ve İngilizce gizlilik metinlerindeki iletişim ve kişisel veri başvuru adresleri aynı değeri kullanır.
- TR/EN iletişim sayfaları ortak `ContactPage` bileşenini ve footer'ı kullanır. Form başarı/hata mesajlarında sabit iletişim adresi yoktur.
- Header, SEO metadata, JSON-LD ve sitemap kaynaklarında ayrı bir sabit iletişim adresi bulunmadı; bu alanlara yeni içerik eklenmedi.
- Payload kaynakları ve yapılandırmasında eski iletişim adresi bulunmadı. Payload navigasyonu ve sayfa içerikleri veritabanından gelebilir; canlı kayıtlar bu kaynak taramasıyla doğrulanmış değildir. Yayın öncesi/sırasında kontrol edilmelidir.
- Form gönderimi, servis alıcıları, kimlik doğrulama, yönetici hesapları, ortam dosyaları ve veritabanı değiştirilmedi.

## Formun gönderim yolu ve alıcı yönetimi

`src/components/forms/ContactForm.tsx`, `NEXT_PUBLIC_FORMSPREE_CONTACT_FORM_ID` değişkenini `useFormspreeSubmission` hook'una iletir. Hook, form verilerini `https://formspree.io/f/{formId}` adresine HTTP POST ile gönderir. `contactEmail`, formun alıcısını belirlemez.

Gerçek bildirim alıcısı Formspree panelinde ilgili formun **Workflow → Email → Settings** bölümünden yönetilir; eski arayüzde **Form Settings → Target Email** kullanılır. Workflow kuralları varsa bildirim yönlendirmeleri de kontrol edilmelidir. Canlı form alıcısına erişilmedi ve alıcı değiştirilmedi.

Kaynaklar:

- [Formspree alıcı adresi yönetimi](https://help.formspree.io/articles/form-and-project-settings/changing-a-form-email-address)
- [Formspree bildirim kuralları](https://help.formspree.io/articles/advanced-features/form-rules)

## Yerel doğrulama

- `npm run lint -- --ignore-pattern 'ml-env/**'`: geçti.
- `node_modules/.bin/tsc --noEmit --incremental false`: geçti.
- Node/tsx ile TR/EN statik footer etiketi, `mailto:` hedefi, her dildeki iki gizlilik adresi ve form durum mesajlarının varlığı doğrulandı.
- `git diff --check`: geçti.
- Kaynaklarda ve Git'in takip ettiği metin dosyalarında eski Gmail adresi bulunmadı; `.env` ve yedek dosyaları tarama/çıktı kapsamı dışında tutuldu. Git geçmişi değiştirilmedi.
- Önceki normal `npm run lint` denemesi, `ml-env` içindeki üçüncü taraf JavaScript dosyaları da tarandığı için başarısızdı. ESLint yapılandırması değiştirilmedi.
- `npm run build`: Turbopack derleme aşamasında ilerleme göstermedi; durduruldu. Başarılı değildir.
- `npm run build -- --webpack`: `fonts.googleapis.com` için `ENOTFOUND` nedeniyle Geist/Geist Mono indirilemedi ve build başarısız oldu. Bu ortam/Google Fonts erişim sorunudur; tam production build henüz doğrulanmadı.
- Gerçek Formspree gönderimi, e-posta teslimi ve Gmail üzerinden kurumsal göndericiyle yanıt testi yapılmadı.

## Git ve yayın durumu

- Remote, GitHub API ve proje kimliği ile doğrulandı: [sabandurali/sabandurali-web](https://github.com/sabandurali/sabandurali-web).
- Çalışma klasörü: `/Users/saban/Documents/Codex/sabandurali-web`. Eski `Documents/GitHub/sabandurali-web` klasörü mevcut değil.
- Başlangıç branch'i `codex/development`, başlangıç HEAD'i `07dada7b676d6839edf6d587e99d3c3cebac9cac` idi. Önceden bulunan yerel geliştirme rehberi commit'i korundu.
- GitHub `main` ucu `22fd7be1e6b891942a5a23236d2bb80c4a99474f` olarak doğrulandı. GitHub'da `codex/development` branch'i bulunmadı ve yerel branch'in upstream'i yoktu.
- Vercel'in güncel Production Branch/Branch Tracking ayarı doğrulanamadığından push yapılmayacak; hazırlık yerel commit olarak tutulacak. `vercel.json` bu ayarı kanıtlamaz.
- Production deployment, merge, veritabanı yazma veya migration çalıştırılmadı. Bu hazırlık canlı siteye aktarılmadı.
- [Vercel Git deployment davranışı](https://vercel.com/docs/git): production branch'e push otomatik production deployment oluşturabilir. Push öncesi proje panelindeki güncel branch ayarı doğrulanmalıdır.

## Yayın kapıları

- [ ] Yeni kurumsal posta kutusunun aktif olduğunu ve dışarıdan e-posta alabildiğini doğrula. Aktif değilken yeni `mailto:` adresine gönderilen iletiler ulaşmayabilir.
- [ ] Google Fonts erişimi olan uygun ortamda production build'i başarıyla tamamla.
- [ ] Canlı Payload navigasyon/sayfa içeriğinde kurumsal iletişim adresini kontrol et; yönetici/servis/hesap adreslerine dokunma. Veritabanı değişikliği gerekiyorsa ayrı onay al.
- [ ] Vercel'in production branch ve otomatik deployment ayarını doğrula. Production deployment oluşturacak push yapma; canlı yayın için ayrıca açık onay al.
- [ ] Formspree'nin mevcut alıcısını koru. İleride alıcı değişikliği istenirse yeni adresi Formspree'de doğrulayıp ayrı onayla güncelle.

## Yayın sonrası doğrulama kontrol listesi

Bu kontroller yayın onayı verilip değişiklik canlıya alındıktan sonra uygulanır; aşağıdaki maddeler henüz tamamlanmadı.

- [ ] `/iletisim` ve `/en/contact`: sayfalar, form alanları, onay kutusu ve footer doğru görünüyor.
- [ ] TR/EN footer: kurumsal iletişim etiketi merkezi ayarla aynı; bağlantı ve mevcut yerleşim doğru.
- [ ] TR/EN `mailto:`: hedef yeni kurumsal adres; tıklayınca posta uygulaması doğru alıcıyla açılıyor.
- [ ] `/kvkk-aydinlatma-metni` ve `/en/privacy-notice`: iletişim ve başvuru adresleri yeni adres; eski adres görünmüyor.
- [ ] Canlı sayfa kaynağı, metadata ve JSON-LD'de eski iletişim adresi kalmamış; sitemap ve ilgili URL'ler çalışıyor.
- [ ] TR/EN Formspree gerçek gönderim testi: izinli test mesajı gönder, başarı mesajını, Formspree kaydını ve mevcut alıcı posta kutusuna teslimi doğrula. Hata/boş alan durumlarını kontrollü ortamda kontrol et.
- [ ] Kurumsal posta kutusu aktifken harici bir hesaptan yeni adrese test e-postası gönder; gelen kutusu/spam ve teslimi doğrula.
- [ ] Gmail'de kurumsal gönderici yetkilendirildiğinde test mesajına bu adresle yanıt ver; alıcı tarafında From/Reply-To adresini, teslimi ve yanıtın doğru kutuya dönmesini doğrula. Bu görev Gmail hesap ayarlarını değiştirmez.
