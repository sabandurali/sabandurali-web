# İstanbul Araştırma Asistanı — başvuru anlatısı

18 Ekim 2026 · Hazırlık dosyası; gönderilmedi. Bu başlıklar resmî form soruları değildir. Program şu anda kapalıdır; uygunluk ayrıntıları [uygunluk notunda](ELIGIBILITY-AND-REQUIREMENTS.md).

## Kurucu ve marka

Ben Şaban Durali. Gayrimenkul, danışmanlık, araştırma ve teknoloji alanlarını bir araya getiren kişisel markam altında İstanbul Araştırma Asistanı'nı geliştiriyorum. Ürün bireysel kurucu tarafından geliştirilen erken aşama prototiptir. Bu ürün için henüz şirket kurulmadı; marka adı bir tüzel kişilik adı değildir. Şirket kuruluş tarihi, yatırım, gelir, aktif müşteri, çalışan veya ortak sayısı beyan etmiyorum. İçerik hacmini kullanıcı çekişi olarak sunmuyorum.

Site: https://www.sabandurali.com · İletişim: saban@sabandurali.com · Kod deposu: https://github.com/sabandurali/sabandurali-web

## Ürün ve gerçek problem

**İstanbul Araştırma Asistanı, İstanbul'un 39 ilçesi hakkında Türkçe soruları ve iki ilçe karşılaştırmalarını yayımlanmış rehber alıntıları, kaynak bağlantıları ve editoryal tarihlerle incelemeyi sağlar.**

İlçe araştırması yapan kişi farklı kurum ve yayınlardaki bilgileri bir araya getirirken kaynağı, tarihi ve kapsamı takip etmek zorundadır. Ürün bu araştırmayı aynı arayüzde okunabilir hâle getirmeyi amaçlar. Bu ihtiyacın yaygınlığı veya zaman tasarrufu henüz kullanıcı araştırmasıyla ölçülmedi.

Hedef kullanıcılar İstanbul'u tanımak veya taşınma öncesi çevre araştırması yapmak isteyen kişiler, yerel araştırmacılar ve gayrimenkul/danışmanlık çalışmalarında ilk kaynak taraması yapan profesyonellerdir. Bunlar hedef gruplardır; mevcut müşteri listesi değildir. Ürün yatırım kararı, fiyat tahmini veya bina güvenliği değerlendirmesi sunmaz.

## Mevcut ürün

- 39 yayımlanmış ilçe rehberinden alınmış sabit kamu içeriği; demo içinde 391 kaynak kaydı. Production için önceki doğrulanmış toplam 402'dir; yayın filtresinin dışarıda bıraktığı 11 kayıt [hazırlık değerlendirmesinde](PRODUCT-READINESS.md) açıklanır. Kaynak kaydı, benzersiz web sayfası demek değildir.
- Ulaşım, tarih, yaşam, konum, konut dokusu, gezi ve araştırma başlıklarında Türkçe soru; bir veya iki ilçe seçimi.
- Ücretsiz anahtar sözcük tabanlı seçim ve özgün alıntı gösterimi; iki ilçe için aynı konudaki alıntıları yan yana inceleme. Puanlama veya yeni karşılaştırmalı çıkarım yoktur.
- Rehber bağlantısı, kaynak yayıncısı, kaynak/veri tarihi ve editoryal kontrol tarihi; kapsam dışı sorularda açık kaçınma.
- Türkçe araştırma arayüzü, İngilizce ürün tanıtımı ve Vercel Authentication korumalı Preview.

39 ilçenin aynı araştırma düzeninde sunulması, kapsamı birkaç popüler bölgeyle sınırlamaz. Ayırt edici yaklaşımımız, yerel editoryal içeriği görünür kaynak ve kapsam sınırlarıyla sunmaktır. Genel arama araçlarına göre araştırma akışını daraltmayı amaçlarız; hız, doğruluk veya rakip üstünlüğü ölçülmüş değildir. Kaynaklar kamuya açıktır; münhasır veri iddiası yoktur.

## Claude'un gerçek görevi

Sunucu entegrasyonu, Türkçe soruya ilişkin en fazla altı aday kamu alıntısı içinden uygun alıntı kimliklerini Claude'a seçtirmek için hazırdır. Adaylar önce mevcut konu eşleştirmesiyle sınırlanır; Claude tüm web'de arama yapmaz ve aday havuzunu genişletmez. Uygulama modelin seçtiği kimlikleri doğrular, yalnız özgün alıntıları gösterir ve iki ilçe karşılaştırmasında her iki ilçenin temsilini denetler. Serbest model metni gösterilmez.

Canlı Claude değerlendirmesi tamamlanmadı. Çevrimiçi demo Claude çağırmaz. Gerçek Claude kullanım maliyeti kurucu tarafından sağlanan mevcut duruma göre 0 USD'dir; bu görevde de çağrı yapılmadı. Türkçe anlamsal seçim kalitesi, gecikme ve gerçek maliyet henüz ölçülmedi.

## Güvenilirlik, gizlilik ve maliyet

Kaynak ilişkisi bölüm düzeyindedir; her cümlenin bağımsız doğrulandığı anlamına gelmez. Tarihler editoryal kayıtlardır; anlık güncellik veya bu oturumda yeniden teyit vaadi yoktur. Canlı fiyat, nüfus, yatırım getirisi ve bina güvenliği soruları kapsam dışıdır. Kelime eşleştirmesi bazı geçerli soruları da kaçırabilir.

Demo statik kamu kopyası kullanır; CMS/veritabanı erişimi yoktur. Uygulama sorguları kaydetmez; kullanıcıdan kişisel bilgi yazmaması istenir. Onaylı yerel pilotta soru ve sınırlı kamu alıntıları Anthropic'e gönderilecektir; sağlayıcının veri işleme koşulları ayrıca geçerlidir. Tüm altyapı için sıfır kayıt veya sıfır saklama iddiası yoktur.

Claude varsayılan kapalı ve Vercel üzerinde devre dışıdır. Yerel pilot açık, süreli onay; istek, eşzamanlılık, token ve bağlam sınırları gerektirir. Otomatik ücretli tekrar yoktur. Süreç içi tahmini bütçe koruması hesap genelinde kesin fatura tavanı değildir. Anahtar oluşturulmadı, satın alma yapılmadı.

## Planlanan geliştirme ve ilk kullanıcı doğrulaması

1. Onay sonrası tek süreçte küçük yerel Claude pilotu: mevcut değerlendirme sorularında konu uygunluğu, iki ilçenin temsili, geçerli kaynak kimliği, kaçınma, gecikme ve usage ölçümü. En fazla 20 deneme ve 0.03 USD süreç içi rezerv mevcut pilot önerisidir; onay verilmiş bütçe değildir. Model erişimi ve güncel fiyat önceden kontrol edilir.
2. Teknik pilot güvenilir bulunursa hedef gruplardan 3–5 gönüllüyle kontrollü kullanım görüşmesi planlanır. Henüz katılımcı alınmadı. Her katılımcı tek ilçe sorusu, karşılaştırma ve kapsam dışı soru dener; kaynağı bulup tarihlerin anlamını açıklayabilmesi ve sistemin sınırını anlayabilmesi gözlenir. İzinli, kimliksiz özet geri bildirim tutulur; özel bilgiler toplanmaz.
3. Kaynak kimliği veya desteksiz iddia hatası görülürse pilot durdurulur. İlk düzeltmeler yalnız gözlenen seçim ve anlaşılabilirlik sorunlarıyla sınırlanır; sonraki kapsam kullanıcı bulgularına göre belirlenir. Tarih veya ticari başarı taahhüdü yoktur.

Claude Startups'a katılmak istememizin nedeni bu sınırlı Türkçe kanıt seçimi yaklaşımını gerçek model ve kullanıcı verisiyle değerlendirmek, teknik geri bildirim almak ve uygunsa denemelerin maliyetini program desteğiyle karşılamaktır. Kabul, kredi veya Anthropic ortaklığı iddiası yoktur. Şirket kurmadan uygunluk ve yeni dönem koşulları doğrulanmadan başvuru yapılmayacaktır.
