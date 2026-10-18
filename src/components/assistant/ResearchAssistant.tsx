"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ResearchAnswer } from "@/lib/assistant/types";
import styles from "./assistant.module.css";

type Props = {
  districts: { slug: string; name: string; side: string }[];
  snapshot: { guides: number; sourceRecords: number; retrievedAt: string };
  mode: "local" | "claude";
};
const examples = [
  {
    label: "İki yaka, iki ilçe",
    question:
      "Kadıköy ile Beşiktaş’ı ulaşım ve gündelik yaşam açısından karşılaştır.",
    districts: ["kadikoy", "besiktas"],
  },
  {
    label: "Kent belleğinin izinde",
    question: "Fatih’in tarihî mirası ve gezi rotaları neler?",
    districts: ["fatih"],
  },
  {
    label: "Kıyıda gündelik yaşam",
    question: "Üsküdar’ın kıyı yaşamını ve ulaşımını anlat.",
    districts: ["uskudar"],
  },
];
function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Istanbul",
      }).format(new Date(value))
    : "Belirtilmemiş";
}
export default function ResearchAssistant({
  districts,
  snapshot,
  mode,
}: Props) {
  const [first, setFirst] = useState("kadikoy");
  const [second, setSecond] = useState("besiktas");
  const [compare, setCompare] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ResearchAnswer | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setAnswer(null);
    try {
      const response = await fetch("/api/research-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          districts: compare ? [first, second] : [first],
        }),
        signal: AbortSignal.timeout(25000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Yanıt alınamadı.");
      setAnswer(data);
      requestAnimationFrame(() =>
        resultRef.current?.focus({ preventScroll: false }),
      );
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "İstek zaman aşımına uğradı. Yeniden deneyin.",
      );
    } finally {
      setBusy(false);
    }
  }
  function example(index: number) {
    const value = examples[index];
    setQuestion(value.question);
    setFirst(value.districts[0]);
    setCompare(value.districts.length === 2);
    setSecond(value.districts[1] ?? "besiktas");
    setAnswer(null);
    setError("");
  }
  return (
    <div className={styles.shell}>
      <a href="#research" className={styles.skip}>
        Araştırmaya geç
      </a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/brand/sd-monogram-light.png"
            alt=""
            width={46}
            height={46}
          />
          <span>
            ŞABAN DURALI<small>ARAŞTIRMA • TEKNOLOJİ</small>
          </span>
        </Link>
        <nav aria-label="Demo navigasyonu">
          <Link href="/en/istanbul-research-assistant">
            About the product ↗
          </Link>
          <span className={styles.prototype}>ÜRÜN PROTOTİPİ</span>
        </nav>
      </header>
      <main>
        <section className={styles.hero} aria-labelledby="title">
          <div>
            <p className={styles.eyebrow}>İSTANBUL’U KAYNAĞINDAN KEŞFET</p>
            <h1 id="title">
              Bir şehir.
              <br />
              <em>39 farklı hikâye.</em>
            </h1>
            <p className={styles.intro}>
              İstanbul Araştırma Asistanı ile ilçeleri tanıyın,
              <br className={styles.desktopBreak} /> iki ilçeyi karşılaştırın,
              bilginin kaynağına ulaşın.
            </p>
          </div>
          <div className={styles.city} aria-hidden="true">
            <svg viewBox="0 0 480 235" fill="none">
              <path
                d="M240 0C165 50 315 80 220 135S240 205 180 235"
                stroke="#c9a24a"
                strokeWidth="48"
                opacity=".08"
              />
              <path
                d="M240 0C165 50 315 80 220 135S240 205 180 235"
                stroke="#c9a24a"
                strokeWidth="1"
                strokeDasharray="3 7"
              />
              <path
                d="M35 140L80 132L110 148L153 136M285 83L322 67L365 85L435 65M275 164L320 150L353 171L430 155"
                stroke="#c9a24a"
                opacity=".3"
              />
              <circle cx="180" cy="101" r="5" fill="#c9a24a" />
              <circle cx="296" cy="144" r="5" fill="#c9a24a" />
              <path
                d="M180 101L296 144"
                stroke="#c9a24a"
                strokeDasharray="4 5"
              />
              <text x="95" y="87" fill="#e6d6b3" fontSize="13">
                AVRUPA
              </text>
              <text x="312" y="137" fill="#e6d6b3" fontSize="13">
                ANADOLU
              </text>
              <text
                x="300"
                y="215"
                fill="#b4bdc8"
                fontSize="11"
                letterSpacing="3"
              >
                İSTANBUL / 41° N
              </text>
            </svg>
          </div>
        </section>
        <div className={styles.stats}>
          <span>
            <strong>{snapshot.guides}</strong> yayımlanmış rehber
          </span>
          <span>
            <strong>{snapshot.sourceRecords}</strong> kaynak kaydı
          </span>
          <span>
            <i />{" "}
            {mode === "local"
              ? "Ücretsiz kaynak temelli demo"
              : "Claude ile kontrollü kaynak seçimi"}
          </span>
        </div>
        <div className={styles.workspace}>
          <aside className={styles.sidebar}>
            <p className={styles.eyebrow}>BAŞLANGIÇ NOKTALARI</p>
            <h2>
              Merakınızla <br />
              başlayın.
            </h2>
            <p>Bir örnek seçin ya da kendi sorunuzu yazın.</p>
            <div className={styles.examples}>
              {examples.map((e, i) => (
                <button
                  type="button"
                  key={e.label}
                  onClick={() => example(i)}
                  disabled={busy}
                >
                  <span>0{i + 1}</span>
                  <div>
                    <strong>{e.label}</strong>
                    <small>{e.question}</small>
                  </div>
                  <b aria-hidden="true">↗</b>
                </button>
              ))}
            </div>
            <div className={styles.method}>
              <span aria-hidden="true">◎</span>
              <strong>Önce kaynak, sonra yanıt.</strong>
              <p>
                Rehber alıntıları, güncelleme tarihleri ve ilgili kurum
                bağlantıları bir arada. Bilgi yoksa tahmin de yok.
              </p>
              <a href="#method">Nasıl çalışır? ↓</a>
            </div>
          </aside>
          <div className={styles.mainColumn}>
            <section
              className={styles.composer}
              id="research"
              aria-labelledby="research-title"
            >
              <div className={styles.cardHeading}>
                <h2 id="research-title">İstanbul Araştırma Asistanı</h2>
                <span className={styles.badge}>
                  {mode === "local" ? "ÜCRETSİZ DEMO" : "CLAUDE PİLOT"}
                </span>
              </div>
              <div
                className={styles.switcher}
                role="group"
                aria-label="Araştırma türü"
              >
                <button
                  type="button"
                  aria-pressed={!compare}
                  onClick={() => {
                    setCompare(false);
                    setAnswer(null);
                  }}
                  disabled={busy}
                >
                  Bir ilçeyi keşfet
                </button>
                <button
                  type="button"
                  aria-pressed={compare}
                  onClick={() => {
                    setCompare(true);
                    setAnswer(null);
                  }}
                  disabled={busy}
                >
                  İki ilçeyi karşılaştır
                </button>
              </div>
              <form onSubmit={submit}>
                <div className={styles.selects}>
                  <label>
                    {compare ? "Birinci ilçe" : "İlçe"}
                    <select
                      value={first}
                      disabled={busy}
                      onChange={(e) => setFirst(e.target.value)}
                    >
                      {districts.map((d) => (
                        <option key={d.slug} value={d.slug}>
                          {d.name} ·{" "}
                          {d.side === "avrupa" ? "Avrupa" : "Anadolu"}
                        </option>
                      ))}
                    </select>
                  </label>
                  {compare ? (
                    <label>
                      İkinci ilçe
                      <select
                        value={second}
                        disabled={busy}
                        onChange={(e) => setSecond(e.target.value)}
                      >
                        {districts.map((d) => (
                          <option key={d.slug} value={d.slug}>
                            {d.name} ·{" "}
                            {d.side === "avrupa" ? "Avrupa" : "Anadolu"}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
                <label className={styles.question}>
                  Neyi merak ediyorsunuz?
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Örneğin: Kadıköy’de ulaşım ve kıyı yaşamı nasıl?"
                    minLength={4}
                    maxLength={600}
                    required
                    rows={3}
                    disabled={busy}
                    aria-describedby="privacy"
                  />
                </label>
                <div className={styles.formBottom}>
                  <span>{question.length}/600 · Kişisel bilgi yazmayın</span>
                  <button
                    className={styles.submit}
                    type="submit"
                    disabled={
                      busy ||
                      question.trim().length < 4 ||
                      (compare && first === second)
                    }
                  >
                    {busy ? "Kaynaklar inceleniyor…" : "Kaynaklarla araştır"}{" "}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
                {compare && first === second ? (
                  <p role="alert">Karşılaştırmak için iki farklı ilçe seçin.</p>
                ) : null}
                <p className={styles.privacy} id="privacy">
                  {mode === "local"
                    ? "Bu mod yapay zekâ yanıtı üretmez; Claude API çağrısı ve API ücreti yoktur."
                    : "Onaylı ücretli pilot: sorunuz ve kamuya açık alıntılar Anthropic’e gönderilir. Sağlayıcının veri işleme koşulları geçerlidir."}{" "}
                  Sorgular uygulama tarafından kaydedilmez.
                </p>
              </form>
            </section>
            <div role="status" aria-live="polite" className={styles.status}>
              {busy ? "Kaynaklı yanıt hazırlanıyor." : ""}
            </div>
            {error ? (
              <div role="alert" className={styles.error}>
                {error}
              </div>
            ) : null}
            {answer ? (
              <section
                ref={resultRef}
                tabIndex={-1}
                className={styles.answer}
                aria-labelledby="answer-title"
              >
                <p className={styles.eyebrow}>ARAŞTIRMA NOTU</p>
                <h2 id="answer-title">{answer.question}</h2>
                <p className={styles.answerNotice}>{answer.message}</p>
                {answer.usage ? (
                  <p className={styles.sourceNote}>
                    {answer.usage.model} · {answer.usage.inputTokens} giriş / {answer.usage.outputTokens} çıkış token’ı ·
                    tahmini çağrı bedeli ${answer.usage.estimatedCostUsd.toFixed(6)}.
                    Bu tutar fatura veya hesap genelinde harcama limiti değildir.
                  </p>
                ) : null}
                <div className={styles.results}>
                  {Array.from(
                    new Set(answer.passages.map((p) => p.district)),
                  ).map((slug) => (
                    <article key={slug} className={styles.districtResult}>
                      <h3>
                        {
                          answer.passages.find((p) => p.district === slug)
                            ?.districtName
                        }
                      </h3>
                      {answer.passages
                        .filter((p) => p.district === slug)
                        .map((p) => (
                          <section key={p.id}>
                            <h4>{p.title}</h4>
                            <blockquote>{p.text}</blockquote>
                            <a
                              href={p.guideUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.guideLink}
                            >
                              Yayımlanmış rehber ↗
                            </a>
                            <small className={styles.date}>
                              Rehber güncellemesi: {date(p.updatedAt)}
                            </small>
                            <details>
                              <summary>
                                İlgili kaynaklar ({p.sources.length})
                              </summary>
                              <p className={styles.sourceNote}>
                                Bölüme editoryal olarak ilişkilendirilmiş
                                kaynaklardır; her cümle için ayrı doğrulama
                                yapılmış değildir.
                              </p>
                              <ul>
                                {p.sources.map((s) => (
                                  <li key={s.id}>
                                    <a
                                      href={s.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {s.title} ↗
                                    </a>
                                    <span>{s.publisher}</span>
                                    <small>
                                      Kaynak tarihi: {date(s.dataDate)}
                                      <br />
                                      Editoryal kontrol: {date(s.checkedAt)}
                                    </small>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </section>
                        ))}
                    </article>
                  ))}
                </div>
              </section>
            ) : (
              <section className={styles.empty}>
                <span aria-hidden="true">↗</span>
                <div>
                  <h3>Yanıtın ötesine geçin.</h3>
                  <p>
                    Her araştırmada özgün rehberi ve ilgili kaynakları açarak
                    bilginin izini sürebilirsiniz.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
        <section id="method" className={styles.methodology}>
          <p className={styles.eyebrow}>ŞEFFAF ARAŞTIRMA</p>
          <div>
            <h2>
              Ne biliyoruz,
              <br />
              ne bilmiyoruz?
            </h2>
            <p>
              Bu prototip, {date(snapshot.retrievedAt)} tarihinde herkese açık
              yayımlanmış rehberlerden alınan sınırlı bir içerik kopyasını
              kullanır. Canlı veritabanına bağlanmaz. Kaynak kontrol tarihleri
              rehberin editoryal kayıtlarıdır; bağlantılar bu oturumda yeniden
              teyit edilmiş sayılmaz.
            </p>
            <p>
              Canlı fiyat, nüfus, yatırım getirisi veya bina güvenliği
              değerlendirmesi sunmaz. En fazla iki ilçe ve 600 karakterlik soru
              kabul eder. Sunucu süreci başına dakikada 20 istek sınırı
              vardır. Karşılaştırma, ilgili alıntıları yan yana gösterir;
              ilçeleri puanlamaz. Claude pilotu yalnız açık onaylı yerel
              oturumda çalışır; çevrimiçi demo Claude çağrısı yapmaz. Pilotun
              süreç içi kullanım sayacı, hesap genelinde kesin harcama sınırı değildir.
            </p>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>
          Şaban Durali <b> / </b> İstanbul Araştırma Asistanı
        </span>
        <a href="mailto:saban@sabandurali.com">saban@sabandurali.com ↗</a>
        <span>Araştırma prototipi · 2026</span>
      </footer>
    </div>
  );
}
