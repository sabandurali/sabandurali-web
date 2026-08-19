"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale } from "@/content/homeContent";
import { prototypeSearchRecords } from "@/content/sitePrototypeContent";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-sm border border-border bg-background px-4 text-ivory placeholder:text-muted-dark";

const formatNumber = (value: number, locale: Locale, maximumFractionDigits = 2) =>
  new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    maximumFractionDigits,
  }).format(value);

export function PrototypeSearch({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === "tr" ? "tr" : "en");
  const results = useMemo(
    () =>
      prototypeSearchRecords.filter((record) => {
        if (normalizedQuery === "") return true;
        return `${record.title[locale]} ${record.description[locale]} ${record.group}`
          .toLocaleLowerCase(locale === "tr" ? "tr" : "en")
          .includes(normalizedQuery);
      }),
    [locale, normalizedQuery],
  );

  return (
    <section aria-labelledby="prototype-search-heading" className="space-y-6">
      <div>
        <label id="prototype-search-heading" htmlFor="prototype-search" className="text-sm font-semibold text-ivory">
          {locale === "tr" ? "Prototipte ara" : "Search the prototype"}
        </label>
        <input
          id="prototype-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={locale === "tr" ? "Örn. araçlar, kitaplar, İstanbul" : "E.g. tools, books, Istanbul"}
          className={fieldClass}
        />
      </div>
      <p aria-live="polite" className="text-sm text-muted">
        {locale === "tr" ? `${results.length} prototip kaydı` : `${results.length} prototype records`}
      </p>
      {results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((record) => (
            <Link
              key={record.id}
              href={record.href[locale]}
              className="rounded-sm border border-border bg-surface p-5 transition-colors hover:border-accent hover:bg-surface-soft motion-reduce:transition-none"
            >
              <span className="text-xs uppercase tracking-[0.16em] text-accent-soft">{record.group}</span>
              <h2 className="mt-2 text-xl text-ivory">{record.title[locale]}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{record.description[locale]}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-sm border border-dashed border-border p-8 text-center">
          <h2 className="text-xl text-ivory">{locale === "tr" ? "Sonuç bulunamadı" : "No results found"}</h2>
          <p className="mt-2 text-sm text-muted">
            {locale === "tr" ? "Başka bir terim deneyin veya aramayı temizleyin." : "Try another term or clear the search."}
          </p>
        </div>
      )}
    </section>
  );
}

type CalculatorKind = "rent" | "roi" | "loan";

export function PrototypeCalculator({ locale, kind }: { locale: Locale; kind: CalculatorKind }) {
  const [first, setFirst] = useState("1000000");
  const [second, setSecond] = useState(kind === "loan" ? "2" : "120000");
  const [third, setThird] = useState(kind === "loan" ? "120" : "80000");
  const [result, setResult] = useState<string | null>(null);
  const tr = locale === "tr";

  const calculate = () => {
    const a = Number(first);
    const b = Number(second);
    const c = Number(third);
    if (![a, b, c].every(Number.isFinite) || a <= 0) {
      setResult(tr ? "Geçerli örnek değerler girin." : "Enter valid sample values.");
      return;
    }
    if (kind === "rent") {
      setResult(`${formatNumber((b / a) * 100, locale)}%`);
      return;
    }
    if (kind === "roi") {
      setResult(`${formatNumber(((b - c) / a) * 100, locale)}%`);
      return;
    }
    const months = Math.max(1, Math.round(c));
    const monthlyRate = b / 100;
    const payment = monthlyRate === 0
      ? a / months
      : (a * monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1);
    setResult(`${formatNumber(payment, locale, 0)} ${tr ? "TL / ay" : "TRY / month"}`);
  };

  const labels = kind === "rent"
    ? [tr ? "Örnek satın alma bedeli (TL)" : "Sample purchase price (TRY)", tr ? "Örnek yıllık kira (TL)" : "Sample annual rent (TRY)", tr ? "Örnek yıllık gider (TL, bu basit brüt hesapta kullanılmaz)" : "Sample annual cost (TRY, unused in this simple gross calculation)"]
    : kind === "roi"
      ? [tr ? "Örnek toplam yatırım (TL)" : "Sample total investment (TRY)", tr ? "Örnek toplam getiri (TL)" : "Sample total return (TRY)", tr ? "Örnek toplam gider (TL)" : "Sample total cost (TRY)"]
      : [tr ? "Örnek kredi tutarı (TL)" : "Sample loan amount (TRY)", tr ? "Örnek aylık faiz (%)" : "Sample monthly interest (%)", tr ? "Örnek vade (ay)" : "Sample term (months)"];

  return (
    <div className="rounded-sm border border-border bg-surface p-5 sm:p-7">
      <p className="mb-5 rounded-sm bg-background p-3 text-xs leading-5 text-accent-soft">
        {tr ? "Yalnızca arayüz değerlendirmesi için basitleştirilmiş örnek hesaplamadır; finansal tavsiye değildir." : "A simplified sample calculation for interface review only; it is not financial advice."}
      </p>
      <div className="grid gap-5 md:grid-cols-3">
        {[first, second, third].map((value, index) => (
          <label key={labels[index]} className="text-sm text-muted">
            {labels[index]}
            <input
              inputMode="decimal"
              value={value}
              onChange={(event) => [setFirst, setSecond, setThird][index](event.target.value)}
              className={fieldClass}
            />
          </label>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" onClick={calculate} className="min-h-12 rounded-sm bg-accent px-6 font-semibold text-ink hover:bg-accent-strong">
          {tr ? "Örnek sonucu göster" : "Show sample result"}
        </button>
        <output aria-live="polite" className="text-lg font-semibold text-ivory">
          {result ?? (tr ? "Sonuç henüz hesaplanmadı." : "No result calculated yet.")}
        </output>
      </div>
    </div>
  );
}
