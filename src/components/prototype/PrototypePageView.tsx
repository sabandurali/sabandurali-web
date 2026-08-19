import Link from "next/link";
import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import type { Locale } from "@/content/homeContent";
import { homeContent } from "@/content/homeContent";
import {
  articleExamples,
  bookExamples,
  focusAreas,
  getPrototypeBase,
  getPrototypeHref,
  photoTags,
  prototypeGroups,
  prototypePages,
  removedPrototypeSections,
  type PrototypePage,
  type PrototypeStatus,
} from "@/content/sitePrototypeContent";
import { PrototypeCalculator, PrototypeSearch } from "./PrototypeInteractive";

const ui = {
  tr: {
    prototype: "Karar prototipi",
    center: "Karar merkezine dön",
    notice: "Bu alan yalnızca yerel karar prototipidir. İçerikler yayımlanmış bilgi veya gerçek hizmet değildir.",
    status: { existing: "Mevcut", candidate: "Aday", prototype: "Prototip" },
    decisions: ["Kalsın", "Değiştir", "Kaldır"],
    open: "Prototipi aç",
    removed: "Rota oluşturulmayan kaldırılmış bölümler",
    removedNote: "Aşağıdaki adlar yalnızca karar kaydı olarak gösterilir; bunlara ait prototip rota yoktur.",
    sample: "Örnek içerik",
    placeholder: "Örnek görsel — gerçek fotoğraf kullanılmadı",
    related: "İlişkili içerikler",
  },
  en: {
    prototype: "Decision prototype",
    center: "Return to decision center",
    notice: "This area is a local decision prototype only. Its content is not published information or a real service.",
    status: { existing: "Existing", candidate: "Candidate", prototype: "Prototype" },
    decisions: ["Keep", "Change", "Remove"],
    open: "Open prototype",
    removed: "Removed sections with no routes",
    removedNote: "The names below appear only as a decision record; no prototype routes exist for them.",
    sample: "Sample content",
    placeholder: "Sample visual — no real photograph used",
    related: "Related content",
  },
} as const;

const groupLabels: Record<string, Record<Locale, string>> = {
  home: { tr: "Ana Sayfa", en: "Home" }, about: { tr: "Hakkımda", en: "About" }, articles: { tr: "Yazılar", en: "Articles" }, books: { tr: "Kitaplar", en: "Books" }, photos: { tr: "Fotoğraflar", en: "Photography" }, istanbul: { tr: "İstanbul Analizleri", en: "Istanbul Analyses" }, guides: { tr: "Gayrimenkul Rehberleri", en: "Real Estate Guides" }, law: { tr: "Gayrimenkul Hukuk Bankası", en: "Real Estate Law Bank" }, tools: { tr: "Araçlar", en: "Tools" }, pdf: { tr: "PDF Rehberler", en: "PDF Guides" }, current: { tr: "Güncel İçerikler", en: "Current Content" }, search: { tr: "Arama", en: "Search" }, consulting: { tr: "Danışmanlık", en: "Consulting" }, membership: { tr: "Üyelik", en: "Membership" }, contact: { tr: "İletişim", en: "Contact" }, feedback: { tr: "Geri Bildirim", en: "Feedback" }, legal: { tr: "Yasal ve Teknik", en: "Legal and Technical" },
};

const cardClass = "rounded-sm border border-border bg-surface p-5 sm:p-6";
const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-5 font-semibold text-ink transition-colors hover:bg-accent-strong motion-reduce:transition-none";

function StatusBadge({ locale, status }: { locale: Locale; status: PrototypeStatus }) {
  return <span className="rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.14em] text-accent-soft">{ui[locale].status[status]}</span>;
}

function DecisionChoices({ locale, name }: { locale: Locale; name: string }) {
  return (
    <div aria-label={`${name}: ${locale === "tr" ? "görsel karar seçenekleri" : "visual decision options"}`} className="mt-5 flex flex-wrap gap-2">
      {ui[locale].decisions.map((decision) => <span key={decision} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted">○ {decision}</span>)}
    </div>
  );
}

function Section({ title, children, eyebrow }: { title: string; children: ReactNode; eyebrow?: string }) {
  return (
    <section className="py-9 sm:py-12">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl text-ivory sm:text-4xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function CardGrid({ items, locale, columns = 3 }: { items: readonly { title: string; text?: string; href?: string; label?: string }[]; locale: Locale; columns?: 2 | 3 }) {
  return (
    <div className={`grid gap-4 ${columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"}`}>
      {items.map((item) => (
        <article key={`${item.title}-${item.href ?? "card"}`} className={cardClass}>
          <p className="text-xs uppercase tracking-[0.16em] text-accent-soft">{item.label ?? ui[locale].sample}</p>
          <h3 className="mt-2 text-xl text-ivory">{item.title}</h3>
          {item.text && <p className="mt-3 text-sm leading-6 text-muted">{item.text}</p>}
          {item.href && <Link href={item.href} className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-accent-strong underline decoration-border underline-offset-4">{ui[locale].open} →</Link>}
        </article>
      ))}
    </div>
  );
}

function DecisionCenter({ locale }: { locale: Locale }) {
  const topPages = prototypeGroups.map((group) => prototypePages.find((entry) => entry.group === group && entry.paths[locale].length === 1)).filter((entry): entry is PrototypePage => Boolean(entry));
  return (
    <>
      <section className="py-10 sm:py-14">
        <p className="max-w-3xl text-base leading-7 text-muted">{locale === "tr" ? "Her kart, ziyaretçi deneyiminde değerlendirilecek bir ana bölümü ve o bölüm için oluşturulan derin prototip sayfalarını temsil eder. Seçenekler görseldir; hiçbir karar kaydedilmez." : "Each card represents a main visitor section and its deep prototype pages. The choices are visual only; no decision is saved."}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {topPages.map((entry) => {
            const childCount = prototypePages.filter((candidate) => candidate.group === entry.group && candidate.id !== entry.id).length;
            return (
              <article key={entry.id} className={cardClass}>
                <div className="flex items-start justify-between gap-3"><h2 className="text-2xl text-ivory">{entry.title[locale]}</h2><StatusBadge locale={locale} status={entry.status} /></div>
                <p className="mt-3 text-sm leading-6 text-muted">{entry.description[locale]}</p>
                {childCount > 0 && <p className="mt-3 text-xs text-accent-soft">{locale === "tr" ? `${childCount} derin görünüm` : `${childCount} deep views`}</p>}
                <DecisionChoices locale={locale} name={entry.title[locale]} />
                <Link href={getPrototypeHref(entry, locale)} className="mt-5 inline-flex min-h-11 items-center font-semibold text-accent-strong underline decoration-border underline-offset-4">{ui[locale].open} →</Link>
              </article>
            );
          })}
        </div>
      </section>
      <Section title={ui[locale].removed} eyebrow={locale === "tr" ? "Kapsam dışı" : "Out of scope"}>
        <div className={cardClass}>
          <p className="text-sm leading-6 text-muted">{ui[locale].removedNote}</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {removedPrototypeSections.map((item) => <li key={item.tr} className="text-sm text-ivory">— {item[locale]}</li>)}
          </ul>
        </div>
      </Section>
    </>
  );
}

function PrototypeHome({ locale }: { locale: Locale }) {
  const tr = locale === "tr";
  const itemsFor = (group: string) => prototypePages.filter((entry) => entry.group === group && entry.paths[locale].length === 1).map((entry) => ({ title: entry.title[locale], text: entry.description[locale], href: getPrototypeHref(entry, locale) }));
  const homepageSections = [
    { key: "latest", title: tr ? "Son Yazılar" : "Latest Articles", items: articleExamples.slice(0, 3).map((item) => ({ title: item[locale], text: tr ? "Kategori ve etiketlerle sunulan örnek yazı kartı." : "Sample article card presented with category and tags.", href: getPrototypeHref(prototypePages.find((p) => p.id === "articles")!, locale) })) },
    { key: "books", title: tr ? "Kitaplar" : "Books", items: bookExamples.slice(0, 3).map((item) => ({ title: item[locale], text: tr ? "Örnek inceleme özeti; gerçek yayın kaydı değildir." : "Sample review summary; not a real publication record.", href: getPrototypeHref(prototypePages.find((p) => p.id === "books")!, locale) })) },
    { key: "photos", title: tr ? "Fotoğraflar" : "Photography", items: itemsFor("photos") },
    { key: "istanbul", title: tr ? "İstanbul Analizleri" : "Istanbul Analyses", items: itemsFor("istanbul") },
    { key: "guides", title: tr ? "Gayrimenkul Rehberleri" : "Real Estate Guides", items: itemsFor("guides") },
    { key: "law", title: tr ? "Gayrimenkul Hukuk Bankası" : "Real Estate Law Bank", items: itemsFor("law") },
    { key: "tools", title: tr ? "Araçlar" : "Tools", items: itemsFor("tools") },
    { key: "pdf", title: tr ? "PDF Rehberler" : "PDF Guides", items: itemsFor("pdf") },
    { key: "current", title: tr ? "Güncel İçerikler" : "Current Content", items: itemsFor("current") },
  ];
  return (
    <>
      <section className="border-b border-border py-16 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-soft">{tr ? "Araştırma • Bilgi • Uygulama" : "Research • Knowledge • Practice"}</p>
        <h2 className="mt-5 max-w-4xl text-4xl leading-tight text-ivory sm:text-6xl">{tr ? "Bilgiyi karar vermeyi kolaylaştıran bir yapıya dönüştürmek." : "Turning knowledge into a structure that makes decisions easier."}</h2>
        <p className="mt-6 max-w-2xl leading-7 text-muted">{tr ? "Bu hero yalnızca önerilen sayfa hiyerarşisini gösterir; sahte sayaç veya doğrulanmamış başarı iddiası içermez." : "This hero only demonstrates the proposed hierarchy; it contains no fake counters or unverified achievement claims."}</p>
      </section>
      <Section title={tr ? "Hakkımda" : "About"}><p className="max-w-3xl text-base leading-8 text-muted">{tr ? "Gayrimenkul, teknoloji, marka, programlama ve yaşam boyu öğrenme alanlarında araştıran; öğrendiklerini uygulamaya ve paylaşmaya odaklanan bağımsız bir bilgi platformu." : "An independent knowledge platform researching real estate, technology, branding, programming and lifelong learning, with a focus on applying and sharing what is learned."}</p></Section>
      <Section title={tr ? "Beş Çalışma Alanı" : "Five Focus Areas"}><CardGrid locale={locale} items={focusAreas.map((item) => ({ title: item[locale], text: tr ? "Bu alanın kapsamı genel yazı kategorileri ve ilgili içeriklerle desteklenebilir." : "This area can be supported by general article categories and related content." }))} /></Section>
      {homepageSections.map((section) => <Section key={section.key} title={section.title}><CardGrid locale={locale} items={section.items} /></Section>)}
      <Section title={tr ? "Danışmanlık" : "Consulting"}><CardGrid locale={locale} columns={2} items={[{ title: tr ? "İhtiyacı birlikte tanımlayalım" : "Let’s define the need together", text: tr ? "Kapsam, veri ve uygulanabilir çıktı odağında örnek danışmanlık çağrısı." : "Sample consulting call focused on scope, data and actionable output.", href: getPrototypeHref(prototypePages.find((p) => p.id === "consulting")!, locale) }]} /></Section>
      <Section title={tr ? "İletişim" : "Contact"}><Link className={buttonClass} href={getPrototypeHref(prototypePages.find((p) => p.id === "contact")!, locale)}>{tr ? "İletişim prototipini aç" : "Open contact prototype"}</Link></Section>
      <section className="border-t border-border py-8 text-sm text-muted">{tr ? "Alt bilgi: marka, iletişim, geri bildirim ve yasal bağlantılar için önerilen kapanış alanı." : "Footer: proposed closing area for brand, contact, feedback and legal links."}</section>
    </>
  );
}

const detailParagraphs = (locale: Locale) => locale === "tr"
  ? ["Bu metin, bilgi mimarisini ve okuma ritmini değerlendirmek için hazırlanmış nötr bir yer tutucudur.", "Başlıklar, özet alanı, kaynak notları ve ilişkili içerikler birlikte değerlendirilebilir. Buradaki ifade ve örnekler yayımlanmış danışmanlık, haber veya hukuk içeriği değildir."]
  : ["This text is a neutral placeholder for evaluating information architecture and reading rhythm.", "Headings, summary, source notes and related content can be reviewed together. Nothing here is published consulting, news or legal content."];

function ListingView({ page, locale }: { page: PrototypePage; locale: Locale }) {
  const tr = locale === "tr";
  if (page.id === "articles") return <><FilterBar locale={locale} /><CardGrid locale={locale} items={articleExamples.map((item, index) => ({ title: item[locale], text: tr ? "Örnek kategori: Araştırma · Örnek etiket: Bilgi" : "Sample category: Research · Sample tag: Knowledge", href: index < 2 ? getPrototypeHref(prototypePages.find((p) => p.id === (index === 0 ? "article-market" : "article-ai"))!, locale) : undefined }))} /><StateLinks locale={locale} ids={["articles-empty", "articles-no-results"]} /></>;
  if (page.id === "books") return <><FilterBar locale={locale} /><CardGrid locale={locale} columns={2} items={bookExamples.map((item, index) => ({ title: item[locale], text: tr ? "Yer tutucu inceleme özeti; kişisel değerlendirme eklenmedi." : "Placeholder review summary; no personal assessment added.", href: index < 2 ? getPrototypeHref(prototypePages.find((p) => p.id === (index === 0 ? "book-deep-work" : "book-thinking"))!, locale) : undefined }))} /><StateLinks locale={locale} ids={["books-empty"]} /></>;
  if (page.id === "photos") return <><FilterBar locale={locale} /><div className="mb-5 flex flex-wrap gap-2">{photoTags.map((tag) => <span key={tag.tr} className="rounded-full border border-border px-3 py-1 text-xs text-muted">#{tag[locale]}</span>)}</div><PhotoGrid locale={locale} /><StateLinks locale={locale} ids={["photo-detail", "photo-collection", "photos-empty"]} /></>;
  if (page.id === "istanbul") return <CardGrid locale={locale} items={["Davutpaşa", "Kadıköy", "Bakırköy"].map((name, index) => ({ title: name, text: tr ? "Ulaşım, çevre, yapı stoğu ve günlük yaşam başlıklarıyla örnek analiz." : "Sample analysis covering transport, surroundings, building stock and daily life.", href: index === 0 ? getPrototypeHref(prototypePages.find((p) => p.id === "istanbul-detail")!, locale) : undefined }))} />;
  if (page.id === "guides") return <CardGrid locale={locale} columns={2} items={[tr ? "Tapu Kontrol Listesi" : "Title Deed Checklist", tr ? "Konut Alım Süreci" : "Home-Buying Process", tr ? "Kiralama Öncesi Kontroller" : "Pre-Rental Checks", tr ? "Değerleme Raporunu Okumak" : "Reading a Valuation Report"].map((title, index) => ({ title, text: tr ? "Adım adım örnek rehber yerleşimi." : "Sample step-by-step guide layout.", href: index === 0 ? getPrototypeHref(prototypePages.find((p) => p.id === "guide-detail")!, locale) : undefined }))} />;
  if (page.id === "law") return <><p className="mb-6 rounded-sm border border-border bg-surface p-4 text-sm text-accent-soft">{tr ? "Hukuki bilgi amaçlı prototiptir; hukuki danışmanlık değildir. Güncel ve yetkili kaynaklar ayrıca doğrulanmalıdır." : "Prototype for legal-information purposes; not legal advice. Current authoritative sources must be verified separately."}</p><CardGrid locale={locale} items={[tr ? "Kira İlişkileri" : "Tenancy Relations", tr ? "Kat Mülkiyeti" : "Condominium Law", tr ? "Tapu ve Tescil" : "Title Deed and Registration"].map((title, index) => ({ title, text: tr ? "Kanun, yönetmelik ve kaynak bağlantısı için örnek kategori." : "Sample category for laws, regulations and source links.", href: index === 0 ? getPrototypeHref(prototypePages.find((p) => p.id === "law-detail")!, locale) : undefined }))} /></>;
  if (page.id === "tools") return <CardGrid locale={locale} columns={2} items={prototypePages.filter((p) => p.group === "tools" && p.kind === "tool").map((p) => ({ title: p.title[locale], text: p.description[locale], href: getPrototypeHref(p, locale) }))} />;
  if (page.id === "pdf") return <CardGrid locale={locale} items={[tr ? "Konut Alım Kontrol Rehberi" : "Home-Buying Checklist", tr ? "Kiralama Hazırlık Rehberi" : "Rental Preparation Guide", tr ? "Gayrimenkul Terimleri" : "Real Estate Terms"].map((title) => ({ title, text: tr ? "Örnek indirme — henüz aktif değil. PDF dosyası oluşturulmadı." : "Sample download — not active yet. No PDF file has been created.", label: tr ? "Devre dışı" : "Disabled" }))} />;
  if (page.id === "current") return <CardGrid locale={locale} columns={2} items={[tr ? "İstanbul Piyasa Notu" : "Istanbul Market Note", tr ? "Teknoloji Gündemi" : "Technology Brief", tr ? "Okuma Notları" : "Reading Notes", tr ? "Araştırma Günlüğü" : "Research Journal"].map((title, index) => ({ title, text: tr ? "Prototip güncel içeriktir; gerçek haber değildir." : "Prototype current content; not real news.", href: index === 0 ? getPrototypeHref(prototypePages.find((p) => p.id === "current-detail")!, locale) : undefined }))} />;
  if (page.id === "legal") return <CardGrid locale={locale} columns={2} items={prototypePages.filter((p) => p.group === "legal" && p.id !== "legal").map((p) => ({ title: p.title[locale], text: p.description[locale], href: getPrototypeHref(p, locale) }))} />;
  return <CardGrid locale={locale} items={[{ title: page.title[locale], text: page.description[locale] }]} />;
}

function FilterBar({ locale }: { locale: Locale }) {
  return <div className="mb-6 grid gap-3 rounded-sm border border-border bg-surface p-4 sm:grid-cols-3"><input aria-label={locale === "tr" ? "Görsel arama alanı" : "Visual search field"} readOnly placeholder={locale === "tr" ? "Ara (görsel örnek)" : "Search (visual sample)"} className="min-h-11 rounded-sm border border-border bg-background px-3" /><select aria-label={locale === "tr" ? "Kategori" : "Category"} defaultValue="all" className="min-h-11 rounded-sm border border-border bg-background px-3"><option value="all">{locale === "tr" ? "Tüm kategoriler" : "All categories"}</option></select><select aria-label={locale === "tr" ? "Etiket" : "Tag"} defaultValue="all" className="min-h-11 rounded-sm border border-border bg-background px-3"><option value="all">{locale === "tr" ? "Tüm etiketler" : "All tags"}</option></select></div>;
}

function StateLinks({ locale, ids }: { locale: Locale; ids: readonly string[] }) {
  return <div className="mt-6 flex flex-wrap gap-3">{ids.map((id) => { const p = prototypePages.find((entry) => entry.id === id)!; return <Link key={id} href={getPrototypeHref(p, locale)} className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-sm text-accent-soft">{p.title[locale]}</Link>; })}</div>;
}

function PhotoGrid({ locale }: { locale: Locale }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex aspect-[4/3] items-center justify-center rounded-sm border border-border bg-[linear-gradient(135deg,#171d21,#0b0f12)] p-6 text-center text-xs uppercase tracking-[0.14em] text-muted">{ui[locale].placeholder}</div>)}</div>;
}

function DetailView({ page, locale }: { page: PrototypePage; locale: Locale }) {
  const tr = locale === "tr";
  if (page.id === "about") return <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]"><div className="flex min-h-72 items-center justify-center rounded-sm border border-border bg-surface text-sm text-muted">{tr ? "Portre alanı" : "Portrait area"}</div><div className={cardClass}>{detailParagraphs(locale).map((text) => <p key={text} className="mb-5 leading-8 text-muted last:mb-0">{text}</p>)}<h2 className="mt-8 text-2xl text-ivory">{tr ? "Çalışma yaklaşımı" : "Working approach"}</h2><p className="mt-3 leading-7 text-muted">{tr ? "Araştırma, uygulama ve açık anlatım arasında sürdürülebilir bir bağ kurmak." : "Building a sustainable link between research, practice and clear communication."}</p></div></div>;
  if (page.id === "photo-detail" || page.id === "photo-collection") return <><PhotoGrid locale={locale} /><div className="mt-6 grid gap-4 md:grid-cols-2"><div className={cardClass}><h2 className="text-2xl text-ivory">{tr ? "Örnek EXIF" : "Sample EXIF"}</h2><dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted"><dt>{tr ? "Kamera" : "Camera"}</dt><dd>{tr ? "Bilgi yok" : "Not provided"}</dd><dt>{tr ? "Tarih" : "Date"}</dt><dd>{tr ? "Örnek değil / girilmedi" : "Not sampled / not entered"}</dd></dl></div><div className={cardClass}><h2 className="text-2xl text-ivory">{tr ? "Etiketler ve ilişkili kareler" : "Tags and related frames"}</h2><div className="mt-4 flex flex-wrap gap-2">{photoTags.map((tag) => <span key={tag.tr} className="rounded-full border border-border px-3 py-1 text-xs text-muted">#{tag[locale]}</span>)}</div></div></div></>;
  if (page.id === "istanbul-detail") return <><p className="rounded-sm border border-border bg-surface p-4 text-sm text-accent-soft">{tr ? "Tüm sayısal değerler yalnızca yerleşimi göstermek için üretilmiş ÖRNEK değerlerdir; yatırım tavsiyesi değildir." : "All numeric values are SAMPLE values created only to demonstrate layout; not investment advice."}</p><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left text-sm"><thead><tr className="border-b border-border text-ivory"><th className="p-3">{tr ? "Başlık" : "Metric"}</th><th className="p-3">Davutpaşa</th><th className="p-3">{tr ? "Örnek karşılaştırma" : "Sample comparison"}</th></tr></thead><tbody className="text-muted">{[[tr ? "Ulaşım puanı (örnek)" : "Transport score (sample)", "72 / 100", "68 / 100"], [tr ? "Yeşil alan göstergesi (örnek)" : "Green-space indicator (sample)", "54 / 100", "61 / 100"], [tr ? "Yürüme göstergesi (örnek)" : "Walkability indicator (sample)", "66 / 100", "59 / 100"]].map((row) => <tr key={row[0]} className="border-b border-border"><td className="p-3">{row[0]}</td><td className="p-3">{row[1]}</td><td className="p-3">{row[2]}</td></tr>)}</tbody></table></div><div aria-label={tr ? "Örnek CSS veri çubukları" : "Sample CSS data bars"} className="mt-7 space-y-4">{[72, 54, 66].map((value) => <div key={value} className="h-4 rounded-full bg-surface"><div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} /></div>)}</div></>;
  if (page.id === "law-detail") return <><p className="rounded-sm border border-border bg-surface p-4 text-sm text-accent-soft">{tr ? "Bu prototip hukuki danışmanlık değildir. Güncel mevzuat ve somut olay için yetkili bir uzmana başvurulmalıdır." : "This prototype is not legal advice. Consult a qualified professional for current law and specific circumstances."}</p><ArticleBody locale={locale} relatedGroup="law" /></>;
  if (page.id === "current-detail") return <><p className="rounded-sm border border-border bg-surface p-4 text-sm text-accent-soft">{tr ? "PROTOTİP GÜNCEL İÇERİK — Gerçek haber veya güncel piyasa verisi değildir." : "PROTOTYPE CURRENT CONTENT — Not real news or current market data."}</p><ArticleBody locale={locale} relatedGroup="current" /></>;
  if (page.group === "articles" || page.group === "books" || page.group === "guides") return <ArticleBody locale={locale} relatedGroup={page.group} />;
  if (page.id === "consulting") return <CardGrid locale={locale} items={[tr ? "İhtiyaç ve kapsam" : "Need and scope", tr ? "Araştırma ve analiz" : "Research and analysis", tr ? "Uygulanabilir çıktı" : "Actionable output"].map((title) => ({ title, text: tr ? "Örnek süreç açıklaması; hizmet taahhüdü değildir." : "Sample process description; not a service commitment." }))} />;
  return <ArticleBody locale={locale} relatedGroup={page.group} />;
}

function ArticleBody({ locale, relatedGroup }: { locale: Locale; relatedGroup: string }) {
  return <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]"><article className="space-y-5">{detailParagraphs(locale).map((text) => <p key={text} className="leading-8 text-muted">{text}</p>)}<h2 className="pt-4 text-3xl text-ivory">{locale === "tr" ? "Örnek alt başlık" : "Sample subheading"}</h2>{detailParagraphs(locale).slice(0, 1).map((text) => <p key={`second-${text}`} className="leading-8 text-muted">{text}</p>)}</article><aside className={cardClass}><h2 className="text-xl text-ivory">{ui[locale].related}</h2><ul className="mt-4 space-y-3">{prototypePages.filter((p) => p.group === relatedGroup).slice(0, 3).map((p) => <li key={p.id}><Link href={getPrototypeHref(p, locale)} className="text-sm text-accent-strong underline decoration-border underline-offset-4">{p.title[locale]}</Link></li>)}</ul></aside></div>;
}

function ToolView({ page, locale }: { page: PrototypePage; locale: Locale }) {
  const tr = locale === "tr";
  if (page.id === "tool-rent") return <PrototypeCalculator locale={locale} kind="rent" />;
  if (page.id === "tool-roi") return <PrototypeCalculator locale={locale} kind="roi" />;
  if (page.id === "tool-loan") return <PrototypeCalculator locale={locale} kind="loan" />;
  if (page.id === "tool-tax") return <div className={cardClass}><p className="rounded-sm border border-border bg-background p-4 text-sm leading-6 text-accent-soft">{tr ? "Bu araç yalnızca bir arayüz prototipidir; vergi hesaplaması yapmaz, mali danışmanlık veya finansal tavsiye sunmaz. Güncel mevzuat ve kişisel durumunuz için Gelir İdaresi Başkanlığına veya yetkili bir mali müşavire başvurun." : "This tool is an interface prototype only. It does not calculate tax and does not provide tax, financial, or investment advice. Consult the relevant tax authority or a qualified professional regarding current rules and your circumstances."}</p><div className="mt-6 grid gap-4 md:grid-cols-3">{[tr ? "Edinim tarihi" : "Acquisition date", tr ? "Satış tarihi" : "Sale date", tr ? "Maliyet ve giderler" : "Cost and expenses"].map((label) => <label key={label} className="text-sm text-muted">{label}<input readOnly placeholder={tr ? "Görsel alan" : "Visual field"} className="mt-2 min-h-12 w-full rounded-sm border border-border bg-background px-4" /></label>)}</div><button type="button" disabled className="mt-6 min-h-12 cursor-not-allowed rounded-sm border border-border px-5 text-muted">{tr ? "Hesaplama devre dışı" : "Calculation disabled"}</button></div>;
  if (page.id === "tool-maps") return <div className="grid gap-5 lg:grid-cols-[280px_1fr]"><div className={cardClass}><h2 className="text-xl text-ivory">{tr ? "Katmanlar" : "Layers"}</h2><ul className="mt-4 space-y-3 text-sm text-muted"><li>□ {tr ? "Ulaşım" : "Transport"}</li><li>□ {tr ? "Yeşil alan" : "Green space"}</li><li>□ {tr ? "Örnek bölge" : "Sample district"}</li></ul></div><div className="flex min-h-[420px] items-center justify-center rounded-sm border border-border bg-[linear-gradient(30deg,#11171b_25%,#171d21_25%,#171d21_50%,#11171b_50%,#11171b_75%,#171d21_75%)] bg-[length:36px_36px] p-8 text-center text-sm text-accent-soft">{tr ? "Harici harita API’si kullanılmayan CSS yer tutucusu" : "CSS placeholder without an external map API"}</div></div>;
  return <><p className="mb-6 rounded-sm border border-border bg-surface p-4 text-sm text-accent-soft">{tr ? "Aşağıdaki değer ve grafiklerin tamamı ÖRNEKTİR; gerçek veri veya yatırım tavsiyesi değildir." : "Every value and chart below is a SAMPLE; not real data or investment advice."}</p><div className="grid gap-4 sm:grid-cols-3">{[42, 68, 81].map((value, index) => <div key={value} className={cardClass}><p className="text-xs text-muted">{tr ? `Örnek gösterge ${index + 1}` : `Sample indicator ${index + 1}`}</p><p className="mt-2 text-3xl text-ivory">{value}</p><div className="mt-4 h-2 rounded-full bg-background"><div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} /></div></div>)}</div></>;
}

function FormView({ page, locale }: { page: PrototypePage; locale: Locale }) {
  const tr = locale === "tr";
  const fields = page.id === "membership" ? [tr ? "E-posta" : "Email", tr ? "Parola" : "Password"] : [tr ? "Ad soyad" : "Full name", tr ? "E-posta" : "Email", tr ? "Konu" : "Subject", tr ? "Mesaj" : "Message"];
  return <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><div className={cardClass}><h2 className="text-2xl text-ivory">{tr ? "İşlev sınırı" : "Functional boundary"}</h2><p className="mt-3 text-sm leading-6 text-muted">{page.id === "membership" ? (tr ? "Kimlik doğrulaması, hesap oluşturma veya veri kaydı yoktur." : "There is no authentication, account creation or data storage.") : (tr ? "Bu görsel form hiçbir veri göndermez veya kaydetmez." : "This visual form sends or stores no data.")}</p>{page.id === "feedback" && <p className="mt-3 text-sm text-accent-soft">{tr ? "Geri bildirim türleri: içerik, kullanılabilirlik, teknik sorun. Satış seçeneği yoktur." : "Feedback types: content, usability, technical issue. There is no sales option."}</p>}</div><div className={cardClass}><div role="group" aria-label={tr ? "Gönderimsiz görsel form" : "Non-submitting visual form"} className="space-y-4">{fields.map((label) => <label key={label} className="block text-sm text-muted">{label}<input readOnly className="mt-2 min-h-12 w-full rounded-sm border border-border bg-background px-4" /></label>)}<button type="button" disabled className="min-h-12 cursor-not-allowed rounded-sm border border-border px-5 text-muted">{tr ? "Prototipte gönderim yok" : "No submission in prototype"}</button></div></div></div>;
}

function StateView({ page, locale }: { page: PrototypePage; locale: Locale }) {
  const tr = locale === "tr";
  if (page.id === "sitemap-view") return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{prototypeGroups.map((group) => <div key={group} className={cardClass}><h2 className="text-xl text-ivory">{groupLabels[group][locale]}</h2><ul className="mt-3 space-y-2">{prototypePages.filter((p) => p.group === group).map((p) => <li key={p.id}><Link href={getPrototypeHref(p, locale)} className="text-sm text-accent-strong underline decoration-border underline-offset-4">{p.title[locale]}</Link></li>)}</ul></div>)}</div>;
  const messages: Record<string, [string, string]> = {
    "not-found-view": [tr ? "Aradığınız sayfa bulunamadı." : "The page you requested could not be found.", "404"],
    "error-view": [tr ? "Bir şey planlandığı gibi gitmedi." : "Something did not go as planned.", tr ? "Tekrar dene" : "Try again"],
    "articles-no-results": [tr ? "Bu filtrelerle eşleşen yazı yok." : "No articles match these filters.", tr ? "Filtreleri temizle" : "Clear filters"],
  };
  const selected = messages[page.id] ?? [tr ? "Henüz burada içerik yok." : "There is no content here yet.", tr ? "Merkeze dön" : "Return to center"];
  return <div className="rounded-sm border border-dashed border-border bg-surface p-10 text-center sm:p-16"><p className="text-xs uppercase tracking-[0.18em] text-accent-soft">{selected[1]}</p><h2 className="mt-3 text-3xl text-ivory">{selected[0]}</h2><Link href={getPrototypeBase(locale)} className="mt-6 inline-flex min-h-11 items-center text-accent-strong underline decoration-border underline-offset-4">{ui[locale].center}</Link></div>;
}

export default async function PrototypePageView({ page, locale }: { page: PrototypePage; locale: Locale }) {
  const content = homeContent[locale];
  const otherLocale: Locale = locale === "tr" ? "en" : "tr";
  const languageHrefs = { [locale]: getPrototypeHref(page, locale), [otherLocale]: getPrototypeHref(page, otherLocale) } as Record<Locale, string>;
  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <Header locale={locale} anchors={content.anchors} content={content.header} homeHref={getPrototypeBase(locale)} anchorPrefix={locale === "tr" ? "/" : "/en"} languageHrefs={languageHrefs} />
      <main>
        <div className="border-b border-border bg-surface-soft">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs sm:px-6 lg:px-10">
            <p className="text-muted">{ui[locale].notice}</p>
            <Link href={getPrototypeBase(locale)} className="inline-flex min-h-11 items-center font-semibold text-accent-strong underline decoration-border underline-offset-4">← {ui[locale].center}</Link>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <header className="border-b border-border py-10 sm:py-14">
            <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-soft">{ui[locale].prototype}</span><StatusBadge locale={locale} status={page.status} /></div>
            <h1 className="mt-4 max-w-4xl text-4xl leading-tight text-ivory sm:text-6xl">{page.title[locale]}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">{page.description[locale]}</p>
          </header>
          {page.kind === "center" && <DecisionCenter locale={locale} />}
          {page.kind === "home" && <PrototypeHome locale={locale} />}
          {page.kind === "listing" && <section className="py-10 sm:py-14"><ListingView page={page} locale={locale} /></section>}
          {page.kind === "detail" && <section className="py-10 sm:py-14"><DetailView page={page} locale={locale} /></section>}
          {page.kind === "tool" && <section className="py-10 sm:py-14"><ToolView page={page} locale={locale} /></section>}
          {page.kind === "search" && <section className="py-10 sm:py-14"><PrototypeSearch locale={locale} /></section>}
          {page.kind === "form" && <section className="py-10 sm:py-14"><FormView page={page} locale={locale} /></section>}
          {page.kind === "state" && <section className="py-10 sm:py-14"><StateView page={page} locale={locale} /></section>}
        </div>
      </main>
      <Footer id={content.anchors.contact} content={content.footer} />
    </div>
  );
}
