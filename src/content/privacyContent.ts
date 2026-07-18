import { contactEmail } from "@/config/site";
import type { Locale } from "@/content/homeContent";

export type PrivacySection = {
  heading: string;
  paragraphs?: ReadonlyArray<string>;
  items?: ReadonlyArray<string>;
};

export type PrivacyContent = {
  locale: Locale;
  eyebrow: string;
  heading: string;
  introduction: string;
  sections: ReadonlyArray<PrivacySection>;
};

export const privacyContent = {
  tr: {
    locale: "tr",
    eyebrow: "KİŞİSEL VERİLER",
    heading: "Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni",
    introduction:
      "Bu metin, Şaban Durali internet sitesindeki iletişim ve beta geri bildirim formları üzerinden yürütülen kişisel veri işleme faaliyetleri hakkında 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında bilgi vermek amacıyla hazırlanmıştır.",
    sections: [
      {
        heading: "1. Veri sorumlusu",
        paragraphs: [
          `Veri sorumlusu Şaban Durali’dir. İletişim ve kişisel veri başvuruları için ${contactEmail} adresini kullanabilirsiniz.`,
        ],
      },
      {
        heading: "2. İşlenen kişisel veriler",
        items: [
          "Kimlik ve iletişim bilgileri: ad soyad ve e-posta adresi.",
          "İletişim içeriği: seçilen konu, mesaj ve kullanıcının kendi isteğiyle yazdığı diğer bilgiler.",
          "Beta geri bildirim formunda verilen değerlendirmeler ve yorumlar.",
          "Form hizmetinin güvenlik ve teslimat amacıyla işleyebileceği sınırlı teknik kayıtlar.",
        ],
      },
      {
        heading: "3. İşleme amaçları",
        items: [
          "İletişim taleplerini almak ve yanıtlamak.",
          "İş birliği ve danışmanlık taleplerini değerlendirmek.",
          "Teknik bildirimleri incelemek.",
          "Beta geri bildirimleriyle platformun içerik ve kullanıcı deneyimini geliştirmek.",
          "Kötüye kullanım ve spam girişimlerini önlemek.",
        ],
      },
      {
        heading: "4. Toplama yöntemi",
        paragraphs: [
          "Kişisel veriler, web sitesindeki iletişim ve beta geri bildirim formları üzerinden elektronik ortamda toplanır.",
        ],
      },
      {
        heading: "5. Hukuki sebepler",
        paragraphs: [
          "Kişisel veriler, faaliyetin niteliğine göre bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olma, veri sorumlusunun hukuki yükümlülüğünü yerine getirmesi, bir hakkın tesisi, kullanılması veya korunması ve ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaati hukuki sebeplerinden biri veya birkaçı kapsamında işlenebilir.",
        ],
      },
      {
        heading: "6. Verilerin aktarılması",
        paragraphs: [
          "Form gönderimlerinin iletilmesi ve spam kontrolü amacıyla Formspree altyapısından yararlanılır. Formspree kullanımı, yurt dışında bulunan hizmet altyapısına kişisel veri aktarımı doğurabilir. Veriler pazarlama amacıyla satılmaz. Yasal bir zorunluluk bulunması hâlinde yetkili kamu kurumlarıyla paylaşım yapılabilir.",
        ],
      },
      {
        heading: "7. Saklama süresi",
        paragraphs: [
          "Veriler, iletişim veya geri bildirim talebinin sonuçlandırılması ve ilgili hukuki yükümlülüklerin yerine getirilmesi için gerekli süre boyunca; sonrasında uygulanabilir mevzuatta öngörülen sürelerle sınırlı olarak saklanır.",
        ],
      },
      {
        heading: "8. İlgili kişinin hakları",
        paragraphs: [
          "KVKK’nın 11. maddesi kapsamında veri sorumlusuna başvurarak aşağıdaki hakları kullanabilirsiniz:",
        ],
        items: [
          "Kişisel verilerinizin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme.",
          "İşleme amacını ve verilerin bu amaca uygun kullanılıp kullanılmadığını öğrenme.",
          "Kişisel verilerin yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.",
          "Eksik veya yanlış işlenen verilerin düzeltilmesini isteme.",
          "Kanundaki şartlar çerçevesinde verilerin silinmesini veya yok edilmesini isteme.",
          "Düzeltme, silme veya yok etme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme.",
          "Yalnızca otomatik sistemlerle analiz sonucunda aleyhinize bir sonuç ortaya çıkmasına itiraz etme.",
          "Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.",
        ],
      },
      {
        heading: "9. Başvuru yöntemi",
        paragraphs: [
          `Haklarınıza ilişkin başvurunuzu ${contactEmail} adresine iletebilirsiniz. Başvuruda kimliğin doğrulanmasını sağlayacak yeterli bilgiler ile talebinizin açık ve anlaşılır biçimde yer alması gerekir. Gerekli olmadığı sürece kimlik belgesi veya ek kişisel veri göndermeyin.`,
        ],
      },
    ],
  },
  en: {
    locale: "en",
    eyebrow: "PERSONAL DATA",
    heading: "Privacy Notice on the Processing of Personal Data",
    introduction:
      "This notice explains the processing of personal data through the contact and beta feedback forms on the Şaban Durali website in the context of Türkiye’s Personal Data Protection Law No. 6698 (KVKK).",
    sections: [
      {
        heading: "1. Data controller",
        paragraphs: [
          `The data controller is Şaban Durali. You may use ${contactEmail} for communications and requests concerning your personal data.`,
        ],
      },
      {
        heading: "2. Personal data processed",
        items: [
          "Identity and contact details: full name and email address.",
          "Communication content: the selected subject, message and any other information the user chooses to provide.",
          "Ratings and comments submitted through the beta feedback form.",
          "Limited technical records that the form service may process for security and delivery purposes.",
        ],
      },
      {
        heading: "3. Purposes of processing",
        items: [
          "Receiving and responding to contact requests.",
          "Evaluating collaboration and consulting enquiries.",
          "Reviewing technical reports.",
          "Improving the platform’s content and user experience through beta feedback.",
          "Preventing misuse and spam attempts.",
        ],
      },
      {
        heading: "4. Method of collection",
        paragraphs: [
          "Personal data is collected electronically through the contact and beta feedback forms on this website.",
        ],
      },
      {
        heading: "5. Legal grounds",
        paragraphs: [
          "Depending on the nature of the activity, personal data may be processed on one or more of the grounds that processing is directly related to establishing or performing a contract, is necessary for the data controller to comply with a legal obligation, is necessary for establishing, exercising or protecting a right, or is necessary for the data controller’s legitimate interests provided that the data subject’s fundamental rights and freedoms are not harmed.",
        ],
      },
      {
        heading: "6. Transfers of personal data",
        paragraphs: [
          "Formspree infrastructure is used to deliver form submissions and help control spam. Using Formspree may result in personal data being transferred to service infrastructure located outside Türkiye. Personal data is not sold for marketing purposes. Data may also be shared with authorised public authorities where legally required.",
        ],
      },
      {
        heading: "7. Retention",
        paragraphs: [
          "Data is retained for as long as necessary to conclude the relevant contact or feedback request and meet related legal obligations, and afterwards only for the periods required by applicable legislation.",
        ],
      },
      {
        heading: "8. Your rights",
        paragraphs: [
          "Under Article 11 of Law No. 6698, you may apply to the data controller to exercise the following rights:",
        ],
        items: [
          "Learn whether your personal data is processed and request information if it has been processed.",
          "Learn the purpose of processing and whether the data is used in accordance with that purpose.",
          "Know the third parties to whom personal data is transferred in Türkiye or abroad.",
          "Request correction of incomplete or inaccurate personal data.",
          "Request deletion or destruction of personal data under the conditions set out in the Law.",
          "Request notification of correction, deletion or destruction to third parties to whom the data has been transferred.",
          "Object to an adverse result arising from analysis carried out exclusively by automated systems.",
          "Request compensation if you suffer damage because personal data has been processed unlawfully.",
        ],
      },
      {
        heading: "9. How to apply",
        paragraphs: [
          `You may send a request concerning these rights to ${contactEmail}. Your application should contain sufficient information to verify your identity and clearly explain your request. Do not send identity documents or additional personal data unless they are necessary.`,
        ],
      },
    ],
  },
} satisfies Record<Locale, PrivacyContent>;
