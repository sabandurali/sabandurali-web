# 90 saniyelik ürün sunumu / 90-second product demo

18 Ekim 2026 · Metin ve mevcut kod üzerinden hazırlanmıştır; bu görevde kayıt veya canlı demo provası yapılmadı. Her dil için yaklaşık 90 saniye hedeflenir; arayüz geçişlerinde kısa duraklama bırakın. Sunucu gecikmesini başarı iddiasına dönüştürmeyin.

## Sunucu hazırlığı

Mevcut korumalı Preview ve ücretsiz kaynak modunu kullanın. Vercel Authentication açık kalır. Kullanıcının bildirdiği paylaşım bağlantısının sonu **19 Ekim 2026 02:57 Türkiye saati (UTC+3)**; süre bu görevde yeniden doğrulanmadı. Token içeren bağlantıyı dosyaya, başvuruya veya kayda koymayın. Yeni erişim oluşturmayın. Süre sonunda erişim yoksa gösterim tamamlanmış gibi davranmayın; mevcut dosyaları kullanın, yeni paylaşım için ayrı karar gerekir.

Başvuru web adresi https://www.sabandurali.com kişisel marka sitesidir; asistanın herkese açık demo adresi değildir. EN tanıtım yolu `/en/istanbul-research-assistant`, TR etkileşim yolu `/istanbul-asistani` mevcut Preview içindedir. İngilizce anlatırken soruları Türkçe girin; İngilizce araştırma desteği vaat etmeyin.

## Ekran akışı (iki dil için aynı)

| Süre | İşlem | Gösterilecek gerçek davranış |
| --- | --- | --- |
| 0–15 sn | Ürün başlığı ve ücretsiz mod açıklaması | Prototip, 39 ilçe, Claude çağrısı yapılmadığı |
| 15–40 sn | Tek ilçe: Kadıköy. `Kadıköy’de ulaşım nasıl?` yazın; `Kaynaklarla araştır` | Ulaşım alıntısı, yayımlanmış rehber bağlantısı, rehber tarihi; `İlgili kaynaklar` açılınca yayıncı, kaynak tarihi ve editoryal kontrol |
| 40–60 sn | `İki yaka, iki ilçe` örneğini seçip gönderin | `Kadıköy ile Beşiktaş’ı ulaşım ve gündelik yaşam açısından karşılaştır.`; iki ilçenin ilgili alıntıları, puanlama yok |
| 60–75 sn | Tek ilçe Kadıköy'e dönün; `Güncel kira fiyatı ne kadar?` gönderin | Mevcut kaynak kapsamıyla güvenilir yanıt verilemediği; uydurulmuş fiyat yok |
| 75–90 sn | Ürün sınırı / Claude entegrasyonu açıklaması | Hazır sunucu entegrasyonu ile tamamlanmamış canlı doğrulama ayrımı |

Kod dayanağı: `ResearchAssistant.tsx` örnekleri ve kaynak kartları; `research.ts` konu eşleştirmesi/kapsam dışı filtresi; `http.ts` ücretsiz Preview yolu. Kira örneği eksik canlı veri için kapsam dışı yanıtı gösterir; genel bir yapay zekâ belirsizlik ölçümü değildir.

## English narration

**0–15.** I'm Şaban Durali, the individual founder of Istanbul Research Assistant. This early prototype helps people explore 39 Istanbul districts through published guides and visible sources. I have not incorporated a company for it.

**15–40.** First, I ask in Turkish about transport in Kadıköy. The demo selects an original guide excerpt. I can open the published guide and inspect the linked sources, publishers and editorial dates. These links support the section; they do not mean every sentence has been independently checked today. This is free source-selection mode, with no Claude call.

**40–60.** Next, I compare Kadıköy and Beşiktaş on transport and everyday life. The interface brings relevant passages from both districts together. It does not rank the districts or invent a recommendation.

**60–75.** Now I ask for current rents. The fixed corpus cannot support that answer, so the system states its limits instead of supplying a price.

**75–90.** The server-side Claude integration is ready for a controlled pilot: selecting evidence IDs that the application validates. Live model evaluation is still pending. Our next step is to measure selection quality, then test whether users understand the evidence and its limits.

## Türkçe anlatım

**0–15.** Ben Şaban Durali. Bireysel kurucu olarak geliştirdiğim İstanbul Araştırma Asistanı, 39 ilçeyi yayımlanmış rehberler ve görünür kaynaklarla araştırmayı sağlayan erken aşama bir prototip. Ürün için henüz şirket kurmadım.

**15–40.** Önce Kadıköy'de ulaşımı soruyorum. Demo, rehberden özgün bir alıntı seçiyor. Yayımlanmış rehbere gidebiliyor; kaynakları, yayıncıları ve editoryal tarihleri inceleyebiliyorum. Bağlantılar ilgili bölümü destekliyor; her cümlenin bugün bağımsız olarak doğrulandığı anlamına gelmiyor. Bu ücretsiz kaynak seçme modu; Claude çağrısı yapılmıyor.

**40–60.** Şimdi Kadıköy ile Beşiktaş'ı ulaşım ve gündelik yaşam açısından karşılaştırıyorum. Arayüz iki ilçenin ilgili alıntılarını bir araya getiriyor. İlçeleri puanlamıyor veya yeni bir öneri uydurmuyor.

**60–75.** Ardından güncel kirayı soruyorum. Sabit içerik kopyası bu yanıtı desteklemiyor. Sistem bir fiyat vermek yerine sınırını açıkça belirtiyor.

**75–90.** Sunucu tarafındaki Claude entegrasyonu kontrollü pilot için hazır: modelin seçtiği alıntı kimliklerini uygulama doğrulayacak. Canlı model değerlendirmesi henüz tamamlanmadı. Sonraki adımımız seçim kalitesini ölçmek, ardından kullanıcıların kanıtları ve sınırları anlayıp anlamadığını incelemek.
