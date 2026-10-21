import { districtGuidePath } from "@/content/districts/district-routes";

export type WorkspaceKey =
  | "gayrimenkul-ve-istanbul"
  | "satis-ve-muzakere"
  | "arastirma-ve-analiz"
  | "yapay-zeka-ve-teknoloji"
  | "kitaplar-ve-ogrenme"
  | "fotograf";

export type WorkspaceEntry = {
  slug: string;
  title: string;
  description: string;
  href: string;
  articleCategory?: string;
  photoCategory?: string;
};

export type Workspace = {
  key: WorkspaceKey;
  title: string;
  eyebrow: string;
  description: string;
  icon: "city" | "handshake" | "research" | "technology" | "book" | "network";
  entries: readonly WorkspaceEntry[];
};

export const workspacePath = "/calisma-alanlari";

export const workspaces: readonly Workspace[] = [
  {
    key: "gayrimenkul-ve-istanbul",
    title: "Gayrimenkul & İstanbul",
    eyebrow: "01 — Çalışma alanı",
    description:
      "İstanbul’u, gayrimenkulü ve şehir ölçeğindeki gelişmeleri kaynak temelli rehberler ve araştırmalarla takip etmek için bir başlangıç noktası.",
    icon: "city",
    entries: [
      { slug: "ilce-rehberi", title: "İstanbul İlçe Rehberi", description: "İstanbul’un 39 ilçesine tek bir rehberden erişin.", href: districtGuidePath },
      { slug: "gayrimenkul-rehberleri", title: "Gayrimenkul Rehberleri", description: "Yayınlanan gayrimenkul içerikleri burada derlenir.", href: "/gayrimenkul-ve-istanbul/gayrimenkul-rehberleri", articleCategory: "gayrimenkul" },
      { slug: "sehir-ve-imar", title: "Şehir & İmar", description: "Şehir ve planlama üzerine yayınlanan içerikler.", href: "/gayrimenkul-ve-istanbul/sehir-ve-imar", articleCategory: "sehir" },
      { slug: "arastirmalar", title: "Araştırmalar", description: "İstanbul ve gayrimenkul odağındaki araştırmalar.", href: "/gayrimenkul-ve-istanbul/arastirmalar", articleCategory: "arastirma" },
      { slug: "hesaplama-araclari", title: "Hesaplama Araçları", description: "Doğrulanmış araçlar yayımlandığında bu bölümden erişilebilir.", href: "/gayrimenkul-ve-istanbul/hesaplama-araclari" },
    ],
  },
  {
    key: "satis-ve-muzakere",
    title: "Satış & Müzakere",
    eyebrow: "02 — Çalışma alanı",
    description: "Satış, müzakere ve müşteri ilişkileri üzerine uygulamaya dönük yayın girişleri.",
    icon: "handshake",
    entries: [
      { slug: "satis", title: "Satış", description: "Satış pratiğine ilişkin yayınlar.", href: "/satis-ve-muzakere/satis", articleCategory: "sales_and_negotiation" },
      { slug: "muzakere", title: "Müzakere", description: "Müzakere yöntemleri ve notları.", href: "/satis-ve-muzakere/muzakere", articleCategory: "sales_and_negotiation" },
      { slug: "iletisim", title: "İletişim", description: "Açık ve güvene dayalı iletişim üzerine içerikler.", href: "/satis-ve-muzakere/iletisim", articleCategory: "sales_and_negotiation" },
      { slug: "ikna", title: "İkna", description: "Etik ikna ve karar süreçlerine ilişkin yayınlar.", href: "/satis-ve-muzakere/ikna", articleCategory: "sales_and_negotiation" },
      { slug: "musteri-iliskileri", title: "Müşteri İlişkileri", description: "Müşteri ilişkileri ve uzun vadeli güven üzerine notlar.", href: "/satis-ve-muzakere/musteri-iliskileri", articleCategory: "sales_and_negotiation" },
      { slug: "rehberler", title: "Rehberler", description: "Uygulanabilir satış ve müzakere rehberleri.", href: "/satis-ve-muzakere/rehberler", articleCategory: "sales_and_negotiation" },
    ],
  },
  {
    key: "arastirma-ve-analiz",
    title: "Araştırma & Analiz",
    eyebrow: "03 — Çalışma alanı",
    description: "Veriyi, şehirleri ve güncel başlıkları anlaşılır araştırma ve analizlerle inceleyen yayın alanı.",
    icon: "research",
    entries: [
      { slug: "istanbul-arastirmalari", title: "İstanbul Araştırmaları", description: "İstanbul odağındaki araştırmalar.", href: "/arastirma-ve-analiz/istanbul-arastirmalari", articleCategory: "istanbul" },
      { slug: "veri-ve-analiz", title: "Veri & Analiz", description: "Veriyle desteklenen analizler.", href: "/arastirma-ve-analiz/veri-ve-analiz", articleCategory: "analiz" },
      { slug: "sehir-arastirmalari", title: "Şehir Araştırmaları", description: "Şehirler, yaşam ve mekân üzerine çalışmalar.", href: "/arastirma-ve-analiz/sehir-arastirmalari", articleCategory: "sehir" },
      { slug: "ozel-dosyalar", title: "Özel Dosyalar", description: "Birden fazla yazı ve kaynağı bir araya getiren dosyalar.", href: "/arastirma-ve-analiz/ozel-dosyalar", articleCategory: "ozel-dosya" },
    ],
  },
  {
    key: "yapay-zeka-ve-teknoloji",
    title: "Yapay Zekâ & Teknoloji",
    eyebrow: "04 — Çalışma alanı",
    description: "Yapay zekâ, teknoloji ve dijital üretimin pratik kullanımına yönelik yayın girişleri.",
    icon: "technology",
    entries: [
      { slug: "yapay-zeka", title: "Yapay Zekâ", description: "Yapay zekâ üzerine yayınlanan içerikler.", href: "/yapay-zeka-ve-teknoloji/yapay-zeka", articleCategory: "yapay-zeka" },
      { slug: "chatgpt", title: "ChatGPT", description: "ChatGPT kullanımına ilişkin notlar ve rehberler.", href: "/yapay-zeka-ve-teknoloji/chatgpt", articleCategory: "chatgpt" },
      { slug: "teknoloji", title: "Teknoloji", description: "Teknoloji alanındaki yayınlar.", href: "/yapay-zeka-ve-teknoloji/teknoloji", articleCategory: "teknoloji" },
      { slug: "yazilim-ve-web", title: "Yazılım & Web", description: "Yazılım ve web geliştirme notları.", href: "/yapay-zeka-ve-teknoloji/yazilim-ve-web", articleCategory: "yazilim-web" },
      { slug: "rehberler", title: "Rehberler", description: "Uygulanabilir teknoloji rehberleri.", href: "/yapay-zeka-ve-teknoloji/rehberler", articleCategory: "rehber" },
    ],
  },
  {
    key: "kitaplar-ve-ogrenme",
    title: "Kitaplar & Öğrenme",
    eyebrow: "05 — Çalışma alanı",
    description: "Kitap incelemeleri, öğrenme pratikleri ve düşünme notlarını bir araya getiren alan.",
    icon: "book",
    entries: [
      { slug: "kitap-incelemeleri", title: "Kitap İncelemeleri", description: "Mevcut kitap incelemeleri arşivi.", href: "/kitaplar" },
      { slug: "okuma-listeleri", title: "Okuma Listeleri", description: "Okuma listeleri yayımlandığında burada derlenir.", href: "/kitaplar-ve-ogrenme/okuma-listeleri", articleCategory: "okuma-listeleri" },
      { slug: "ogrenme", title: "Öğrenme", description: "Öğrenme yöntemleri ve uygulama notları.", href: "/kitaplar-ve-ogrenme/ogrenme", articleCategory: "ogrenme" },
      { slug: "dusunme-ve-notlar", title: "Düşünme & Notlar", description: "Düşünmeye ve not almaya dair yayınlar.", href: "/kitaplar-ve-ogrenme/dusunme-ve-notlar", articleCategory: "dusunme" },
    ],
  },
  {
    key: "fotograf",
    title: "Fotoğraf",
    eyebrow: "06 — Çalışma alanı",
    description: "İstanbul, şehir ve gündelik hayatı belgeleyen fotoğraf arşivine kategori girişleri.",
    icon: "network",
    entries: [
      { slug: "istanbul", title: "İstanbul", description: "İstanbul odağındaki fotoğraflar için giriş.", href: "/fotograf/istanbul", photoCategory: "istanbul" },
      { slug: "mimari-ve-sehir", title: "Mimari & Şehir", description: "Mimari ve şehir fotoğrafları için giriş.", href: "/fotograf/mimari-ve-sehir", photoCategory: "mimari-ve-sehir" },
      { slug: "sokak", title: "Sokak", description: "Sokak fotoğrafları için giriş.", href: "/fotograf/sokak", photoCategory: "sokak" },
      { slug: "hayvanlar", title: "Hayvanlar", description: "Hayvan fotoğrafları için giriş.", href: "/fotograf/hayvanlar", photoCategory: "hayvanlar" },
      { slug: "doga", title: "Doğa", description: "Doğa fotoğrafları için giriş.", href: "/fotograf/doga", photoCategory: "doga" },
      { slug: "galeriler", title: "Galeriler", description: "Yayınlanmış tüm fotoğraflar ve koleksiyonlar.", href: "/fotograflar" },
    ],
  },
];

export function getWorkspace(key: string): Workspace | null {
  return workspaces.find((workspace) => workspace.key === key) ?? null;
}

export function getWorkspaceEntry(key: string, slug: string): WorkspaceEntry | null {
  return getWorkspace(key)?.entries.find((entry) => entry.slug === slug) ?? null;
}
