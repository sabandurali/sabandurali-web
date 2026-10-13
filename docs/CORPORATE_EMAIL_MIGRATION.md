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
- İlk sandbox içi `npm run build` denemesi Turbopack derleme aşamasında ilerleme göstermedi ve durduruldu. Sandbox içi Webpack denemesinde `fonts.googleapis.com` için `ENOTFOUND` nedeniyle Geist/Geist Mono indirilemedi.
- 13 Ekim 2026 tarihli ağ erişimi olan ortamda `npm run build`: geçti. Turbopack derlemesi, TypeScript kontrolü ve 71/71 statik sayfanın üretimi tamamlandı (çıkış kodu 0).
- Aynı ağ erişimiyle `npm run build -- --webpack`: geçti (çıkış kodu 0; bağımlılık uyarıları var). Google Fonts hatası ortamın ağ kısıtıyla ayrıştırıldı; fontlarda veya uygulama kodunda düzeltme gerekmedi.
- Üretilen production HTML'lerinde `/iletisim`, `/en/contact`, `/kvkk-aydinlatma-metni` ve `/en/privacy-notice` için yeni adres, `mailto:` hedefleri ve eski adresin yokluğu doğrulandı. İletişim sayfalarının form alanları da kontrol edildi.
- Gerçek Formspree gönderimi, e-posta teslimi ve Gmail üzerinden kurumsal göndericiyle yanıt testi yapılmadı.

## Git ve yayın durumu

- Remote, GitHub API ve proje kimliği ile doğrulandı: [sabandurali/sabandurali-web](https://github.com/sabandurali/sabandurali-web).
- Çalışma klasörü: `/Users/saban/Documents/Codex/sabandurali-web`. Eski `Documents/GitHub/sabandurali-web` klasörü mevcut değil.
- Başlangıç branch'i `codex/development`, başlangıç HEAD'i `07dada7b676d6839edf6d587e99d3c3cebac9cac` idi. Önceden bulunan yerel geliştirme rehberi commit'i korundu.
- GitHub `main` ucu `22fd7be1e6b891942a5a23236d2bb80c4a99474f` olarak doğrulandı. GitHub'da `codex/development` branch'i bulunmadı ve yerel branch'in upstream'i yoktu.
- Hazırlık commit'i `cdd18aebcb5b6b7a4a71fa3abc6766d11863305a` korunarak ayrı `codex/corporate-contact-email` feature branch'i oluşturuldu. `main`, `origin/main` ve GitHub `main` uçlarının aynı olduğu tekrar doğrulandı.
- Kullanıcı 13 Ekim 2026 tarihinde Vercel Production Branch/Branch Tracking değerinin `main` olduğunu doğruladı. Push hedefi yalnızca `codex/corporate-contact-email` feature branch'idir. Production branch'e push veya main'e merge bu hazırlığın kapsamı dışındadır.
- Production deployment, merge, veritabanı yazma veya migration çalıştırılmadı. Bu hazırlık canlı siteye aktarılmadı.
- [Vercel Git deployment davranışı](https://vercel.com/docs/git): production branch'e push otomatik production deployment oluşturabilir. Push öncesi proje panelindeki güncel branch ayarı doğrulanmalıdır.

## Yayın kapıları

- [ ] Yeni kurumsal posta kutusunun aktif olduğunu ve dışarıdan e-posta alabildiğini doğrula. Aktif değilken yeni `mailto:` adresine gönderilen iletiler ulaşmayabilir.
- [x] Google Fonts erişimi olan uygun ortamda production build'i başarıyla tamamla.
- [ ] Canlı Payload navigasyon/sayfa içeriğinde kurumsal iletişim adresini kontrol et; yönetici/servis/hesap adreslerine dokunma. Veritabanı değişikliği gerekiyorsa ayrı onay al.
- [x] Vercel production branch'inin `main` olduğu kullanıcı tarafından doğrulandı; push hedefi farklı feature branch olarak seçildi.
- [ ] Canlı yayın için ayrıca açık onay al; production deployment oluşturacak push veya main merge'i yapma.
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
