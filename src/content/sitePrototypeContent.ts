import type { Locale } from "@/content/homeContent";

export type PrototypeStatus = "existing" | "candidate" | "prototype";

export type PrototypePageKind =
  | "center"
  | "home"
  | "listing"
  | "detail"
  | "tool"
  | "search"
  | "form"
  | "state";

export type LocalizedText = Readonly<Record<Locale, string>>;

export type PrototypePage = {
  id: string;
  group: string;
  kind: PrototypePageKind;
  status: PrototypeStatus;
  paths: Readonly<Record<Locale, readonly string[]>>;
  title: LocalizedText;
  description: LocalizedText;
};

const page = (
  id: string,
  group: string,
  kind: PrototypePageKind,
  status: PrototypeStatus,
  trPath: string,
  enPath: string,
  trTitle: string,
  enTitle: string,
  trDescription: string,
  enDescription: string,
): PrototypePage => ({
  id,
  group,
  kind,
  status,
  paths: {
    tr: trPath === "" ? [] : trPath.split("/"),
    en: enPath === "" ? [] : enPath.split("/"),
  },
  title: { tr: trTitle, en: enTitle },
  description: { tr: trDescription, en: enDescription },
});

export const prototypePages = [
  page("center", "center", "center", "prototype", "", "", "Site Karar Merkezi", "Site Decision Center", "Bütün aday bölümleri, durumlarını ve derin sayfalarını tek yerde karşılaştırın.", "Compare every candidate section, its status and deep pages in one place."),
  page("home", "home", "home", "existing", "ana-sayfa", "home", "Ana Sayfa", "Home", "Önerilen tam ana sayfa akışı.", "The proposed complete homepage flow."),
  page("about", "about", "detail", "existing", "hakkimda", "about", "Hakkımda", "About", "Doğrulanmış genel marka bilgileriyle yapılandırılmış profil.", "A structured profile using verified general brand information."),
  page("articles", "articles", "listing", "existing", "yazilar", "articles", "Yazılar", "Articles", "Arama, kategori ve etiket kontrolleriyle yazı listesi.", "Article listing with search, category and tag controls."),
  page("article-market", "articles", "detail", "prototype", "yazilar/istanbulda-konut-degeri", "articles/housing-value-in-istanbul", "İstanbul’da Konut Değerini Okumak", "Reading Housing Value in Istanbul", "Örnek uzun yazı yerleşimi ve ilişkili içerikler.", "Sample long-form article layout and related content."),
  page("article-ai", "articles", "detail", "prototype", "yazilar/yapay-zeka-ile-arastirma", "articles/research-with-ai", "Yapay Zekâ ile Araştırma Süreci", "A Research Workflow with AI", "Örnek teknoloji yazısı yerleşimi.", "Sample technology article layout."),
  page("articles-empty", "articles", "state", "prototype", "yazilar/bos-durum", "articles/empty-state", "Yazılar — Boş Durum", "Articles — Empty State", "Henüz içerik yokken gösterilecek durum.", "State shown when no content exists yet."),
  page("articles-no-results", "articles", "state", "prototype", "yazilar/sonuc-yok", "articles/no-results", "Yazılar — Sonuç Bulunamadı", "Articles — No Results", "Filtrelerin sonuç üretmediği durum.", "State shown when filters return no results."),
  page("books", "books", "listing", "existing", "kitaplar", "books", "Kitaplar", "Books", "Kitap incelemeleri ve öğrenme notları için liste.", "A listing for book reviews and learning notes."),
  page("book-deep-work", "books", "detail", "prototype", "kitaplar/derin-calisma", "books/deep-work", "Derin Çalışma", "Deep Work", "Örnek kitap incelemesi yerleşimi.", "Sample book review layout."),
  page("book-thinking", "books", "detail", "prototype", "kitaplar/hizli-ve-yavas-dusunme", "books/thinking-fast-and-slow", "Hızlı ve Yavaş Düşünme", "Thinking, Fast and Slow", "Örnek kitap incelemesi yerleşimi.", "Sample book review layout."),
  page("books-empty", "books", "state", "prototype", "kitaplar/bos-durum", "books/empty-state", "Kitaplar — Boş Durum", "Books — Empty State", "Henüz inceleme yokken gösterilecek durum.", "State shown when no review exists yet."),
  page("photos", "photos", "listing", "existing", "fotograflar", "photography", "Fotoğraflar", "Photography", "Koleksiyon, etiket ve güvenli örnek görsellerle galeri.", "Gallery with collections, tags and safe sample visuals."),
  page("photo-detail", "photos", "detail", "prototype", "fotograflar/davutpasa-avlu", "photography/davutpasa-courtyard", "Davutpaşa Avlu Çalışması", "Davutpaşa Courtyard Study", "EXIF, etiket ve ilişkili kare alanları bulunan fotoğraf detayı.", "Photo detail with EXIF, tags and related frames."),
  page("photo-collection", "photos", "detail", "prototype", "fotograflar/koleksiyonlar/davutpasada-yasam", "photography/collections/life-in-davutpasa", "Davutpaşa’da Yaşam", "Life in Davutpaşa", "Tarafsız yer tutucularla örnek fotoğraf koleksiyonu.", "A sample photo collection with neutral placeholders."),
  page("photos-empty", "photos", "state", "prototype", "fotograflar/bos-durum", "photography/empty-state", "Fotoğraflar — Boş Durum", "Photography — Empty State", "Henüz fotoğraf yokken gösterilecek durum.", "State shown when no photo exists yet."),
  page("istanbul", "istanbul", "listing", "candidate", "istanbul-analizleri", "istanbul-analyses", "İstanbul Analizleri", "Istanbul Analyses", "Semt, ulaşım ve yaşam odağında örnek analiz kartları.", "Sample analysis cards focused on district, transport and daily life."),
  page("istanbul-detail", "istanbul", "detail", "prototype", "istanbul-analizleri/davutpasa", "istanbul-analyses/davutpasa", "Davutpaşa Örnek Analizi", "Davutpaşa Sample Analysis", "Tüm sayısal değerleri örnek olarak işaretlenmiş analiz detayı.", "Analysis detail with every numeric value marked as a sample."),
  page("guides", "guides", "listing", "candidate", "gayrimenkul-rehberleri", "real-estate-guides", "Gayrimenkul Rehberleri", "Real Estate Guides", "Karar süreçlerini sadeleştiren temel rehberler.", "Core guides that simplify decision processes."),
  page("guide-detail", "guides", "detail", "prototype", "gayrimenkul-rehberleri/tapu-kontrol-listesi", "real-estate-guides/title-deed-checklist", "Tapu Kontrol Listesi", "Title Deed Checklist", "Örnek adımlar ve kontrol listesi yerleşimi.", "Sample steps and checklist layout."),
  page("law", "law", "listing", "candidate", "gayrimenkul-hukuk-bankasi", "real-estate-law-bank", "Gayrimenkul Hukuk Bankası", "Real Estate Law Bank", "Gayrimenkulle ilgili mevzuatı konu başlıklarıyla düzenleyen prototip.", "Prototype organizing real-estate legislation by topic."),
  page("law-detail", "law", "detail", "prototype", "gayrimenkul-hukuk-bankasi/kira-iliskileri", "real-estate-law-bank/tenancy-relations", "Kira İlişkileri", "Tenancy Relations", "Hukuki danışmanlık yerine geçmeyen örnek mevzuat özeti.", "Sample legal summary that is not legal advice."),
  page("tools", "tools", "listing", "candidate", "araclar", "tools", "Araçlar", "Tools", "Altı aday aracın karar prototipi.", "Decision prototype for six candidate tools."),
  page("tool-rent", "tools", "tool", "prototype", "araclar/kira-getirisi-hesaplayicisi", "tools/rental-yield-calculator", "Kira Getirisi Hesaplayıcısı", "Rental Yield Calculator", "Basit örnek brüt kira getirisi etkileşimi.", "A simple sample gross rental yield interaction."),
  page("tool-roi", "tools", "tool", "prototype", "araclar/gayrimenkul-roi-hesaplayicisi", "tools/real-estate-roi-calculator", "Gayrimenkul ROI Hesaplayıcısı", "Real Estate ROI Calculator", "Basit örnek ROI etkileşimi.", "A simple sample ROI interaction."),
  page("tool-loan", "tools", "tool", "prototype", "araclar/kredi-hesaplayicisi", "tools/loan-calculator", "Kredi Hesaplayıcısı", "Loan Calculator", "Basit örnek aylık ödeme etkileşimi.", "A simple sample monthly payment interaction."),
  page("tool-tax", "tools", "tool", "prototype", "araclar/gayrimenkul-deger-artis-kazanci-vergisi-hesaplayicisi", "tools/real-estate-capital-gains-tax-calculator", "Gayrimenkul Değer Artış Kazancı Vergisi Hesaplayıcısı", "Real Estate Capital Gains Tax Calculator", "Hesaplama yapmayan yalnızca arayüz karar prototipi.", "UI decision prototype only; it performs no calculation."),
  page("tool-maps", "tools", "tool", "prototype", "araclar/haritalar", "tools/maps", "Haritalar", "Maps", "Harici API kullanmayan örnek harita yüzeyi.", "Sample map surface without an external API."),
  page("tool-dashboards", "tools", "tool", "prototype", "araclar/veri-panelleri", "tools/data-dashboards", "Veri Panelleri", "Data Dashboards", "Örnek olarak işaretlenmiş CSS veri görselleştirmeleri.", "CSS data visualizations clearly marked as samples."),
  page("pdf", "pdf", "listing", "candidate", "pdf-rehberler", "pdf-guides", "PDF Rehberler", "PDF Guides", "Henüz dosya üretmeden indirme kartı kararları.", "Download-card decisions without generating files yet."),
  page("current", "current", "listing", "candidate", "guncel", "current", "Güncel İçerikler", "Current Content", "Dört örnek güncel içerik kartı.", "Four sample current-content cards."),
  page("current-detail", "current", "detail", "prototype", "guncel/istanbul-piyasa-notu", "current/istanbul-market-note", "İstanbul Piyasa Notu", "Istanbul Market Note", "Gerçek haber olmayan açıkça işaretli prototip içerik.", "Clearly marked prototype content, not real news."),
  page("search", "search", "search", "candidate", "arama", "search", "Site Araması", "Site Search", "Prototip kayıtları içinde çalışan istemci tarafı arama.", "Working client-side search across prototype records."),
  page("consulting", "consulting", "detail", "existing", "danismanlik", "consulting", "Danışmanlık", "Consulting", "Yaklaşım, kapsam ve iletişim çağrısı.", "Approach, scope and contact call to action."),
  page("membership", "membership", "form", "candidate", "uyelik", "membership", "Üyelik ve Hesap", "Membership and Account", "Kimlik doğrulaması olmayan yalnızca görsel hesap prototipi.", "Visual account prototype only, without authentication."),
  page("contact", "contact", "form", "existing", "iletisim", "contact", "İletişim", "Contact", "Gönderim yapmayan görsel form prototipi.", "Visual form prototype that sends nothing."),
  page("feedback", "feedback", "form", "existing", "geri-bildirim", "feedback", "Geri Bildirim", "Feedback", "Satış seçeneği içermeyen geri bildirim yapısı.", "Feedback structure without a sales option."),
  page("legal", "legal", "listing", "candidate", "yasal-ve-teknik", "legal-and-technical", "Yasal ve Teknik Sayfalar", "Legal and Technical Pages", "Yasal metin ve sistem durumu yerleşimlerinin merkezi.", "Hub for legal text and system-state layouts."),
  page("privacy", "legal", "detail", "existing", "yasal-ve-teknik/gizlilik", "legal-and-technical/privacy", "Gizlilik", "Privacy", "Gizlilik metni yerleşim prototipi.", "Privacy-text layout prototype."),
  page("kvkk", "legal", "detail", "existing", "yasal-ve-teknik/kvkk", "legal-and-technical/kvkk", "KVKK Aydınlatma Metni", "KVKK Privacy Notice", "Aydınlatma metni yerleşim prototipi.", "Privacy-notice layout prototype."),
  page("cookies", "legal", "detail", "candidate", "yasal-ve-teknik/cerez-politikasi", "legal-and-technical/cookie-policy", "Çerez Politikası", "Cookie Policy", "Çerez tercihleri için içerik yapısı.", "Content structure for cookie preferences."),
  page("terms", "legal", "detail", "candidate", "yasal-ve-teknik/kullanim-kosullari", "legal-and-technical/terms", "Kullanım Koşulları", "Terms of Use", "Kullanım koşulları içerik yapısı.", "Terms-of-use content structure."),
  page("sitemap-view", "legal", "state", "prototype", "yasal-ve-teknik/site-haritasi", "legal-and-technical/sitemap", "Site Haritası Görünümü", "Sitemap View", "Prototip bölümlerinin insan tarafından okunabilir görünümü.", "Human-readable view of prototype sections."),
  page("not-found-view", "legal", "state", "prototype", "yasal-ve-teknik/404", "legal-and-technical/404", "404 Görünümü", "404 View", "Bulunamayan sayfa karar görünümü.", "Decision view for a missing page."),
  page("empty-view", "legal", "state", "prototype", "yasal-ve-teknik/bos-durum", "legal-and-technical/empty-state", "Genel Boş Durum", "General Empty State", "İçerik oluşmadan önceki genel görünüm.", "General view before content is created."),
  page("error-view", "legal", "state", "prototype", "yasal-ve-teknik/hata", "legal-and-technical/error", "Hata Görünümü", "Error View", "Tekrar deneme ve geri dönüş seçenekli hata görünümü.", "Error view with retry and return options."),
] as const satisfies readonly PrototypePage[];

export const prototypeGroups = [
  "home", "about", "articles", "books", "photos", "istanbul", "guides", "law", "tools", "pdf", "current", "search", "consulting", "membership", "contact", "feedback", "legal",
] as const;

export const removedPrototypeSections: readonly LocalizedText[] = [
  { tr: "Uluslararası Rehberler", en: "International Guides" },
  { tr: "Kanada", en: "Canada" },
  { tr: "ABD", en: "USA" },
  { tr: "İngiltere", en: "United Kingdom" },
  { tr: "Avustralya", en: "Australia" },
  { tr: "Yapay Zekâ Rehberleri modülü", en: "AI Guides module" },
  { tr: "Satış ve Müzakere Kütüphanesi", en: "Sales and Negotiation Library" },
  { tr: "Eğitim Notları", en: "Education Notes" },
  { tr: "Projeler / Çalışmalar modülü", en: "Projects / Work module" },
  { tr: "Satış ve Müzakere çalışma alanı", en: "Sales and Negotiation focus area" },
];

export const focusAreas: readonly LocalizedText[] = [
  { tr: "Gayrimenkul", en: "Real Estate" },
  { tr: "Danışmanlık", en: "Consulting" },
  { tr: "Araştırma", en: "Research" },
  { tr: "Teknoloji ve Yapay Zekâ", en: "Technology and Artificial Intelligence" },
  { tr: "Kitaplar ve Öğrenme", en: "Books and Learning" },
];

export const articleExamples: readonly LocalizedText[] = [
  { tr: "İstanbul’da Konut Değerini Okumak", en: "Reading Housing Value in Istanbul" },
  { tr: "Yapay Zekâ ile Araştırma Süreci", en: "A Research Workflow with AI" },
  { tr: "Danışmanlıkta Doğru Soruyu Kurmak", en: "Framing the Right Question in Consulting" },
  { tr: "Bir Kitaptan Uygulanabilir Notlar Çıkarmak", en: "Turning a Book into Actionable Notes" },
  { tr: "Veriye Dayalı Gayrimenkul Kararı", en: "A Data-Informed Real Estate Decision" },
];

export const bookExamples: readonly LocalizedText[] = [
  { tr: "Derin Çalışma", en: "Deep Work" },
  { tr: "Hızlı ve Yavaş Düşünme", en: "Thinking, Fast and Slow" },
  { tr: "Atomik Alışkanlıklar", en: "Atomic Habits" },
  { tr: "Akıllı Yatırımcı", en: "The Intelligent Investor" },
];

export const photoTags: readonly LocalizedText[] = [
  { tr: "Mimari", en: "Architecture" },
  { tr: "Sokak", en: "Street" },
  { tr: "Işık", en: "Light" },
  { tr: "Doku", en: "Texture" },
  { tr: "İstanbul", en: "Istanbul" },
  { tr: "Davutpaşa", en: "Davutpaşa" },
];

export const getPrototypeBase = (locale: Locale) =>
  locale === "tr" ? "/site-prototipi" : "/en/site-prototype";

export const getPrototypeHref = (pageValue: PrototypePage, locale: Locale) => {
  const suffix = pageValue.paths[locale].join("/");
  return suffix === ""
    ? getPrototypeBase(locale)
    : `${getPrototypeBase(locale)}/${suffix}`;
};

export const findPrototypePage = (locale: Locale, segments: readonly string[]) =>
  prototypePages.find(
    (entry) => entry.paths[locale].join("/") === segments.join("/"),
  );

export const prototypeSearchRecords = prototypePages
  .filter((entry) => entry.id !== "center")
  .map((entry) => ({
    id: entry.id,
    group: entry.group,
    title: entry.title,
    description: entry.description,
    href: {
      tr: getPrototypeHref(entry, "tr"),
      en: getPrototypeHref(entry, "en"),
    },
  }));
