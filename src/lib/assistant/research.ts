import snapshot from "../../content/assistant/public-guides.json";
import { districts } from "../../content/districts/district-registry";
import type { Passage, ResearchAnswer, ResearchInput } from "./types";

export const topics = [
  {
    section: "transportation",
    title: "Ulaşım",
    words: [
      "ulasim",
      "metro",
      "marmaray",
      "vapur",
      "iskele",
      "otobus",
      "tramvay",
      "erisim",
    ],
  },
  {
    section: "history",
    title: "Tarih ve kent belleği",
    words: ["tarih", "miras", "osmanli", "antik"],
  },
  {
    section: "life",
    title: "Gündelik yaşam",
    words: ["yasam", "kultur", "park", "sahil", "kiyi", "sosyal"],
  },
  {
    section: "geography",
    title: "Coğrafya ve konum",
    words: ["cograf", "konum", "komsu", "nerede"],
  },
  {
    section: "housingTexture",
    title: "Konut dokusu",
    words: ["konut", "yapi", "doku", "apartman", "bina"],
  },
  {
    section: "placesGuide",
    title: "Gezi ve keşif",
    words: ["gezi", "gezil", "rota", "kesif"],
  },
  {
    section: "researchTopics",
    title: "Araştırma başlıkları",
    words: ["arastirma", "inceleme"],
  },
  {
    section: "summary",
    title: "İlçeye genel bakış",
    words: ["genel", "ozet", "tani", "karsilastir", "fark"],
  },
] as const;
export const catalogue = districts
  .map((d) => ({ slug: d.slug, name: d.name, side: d.side }))
  .sort((a, b) => a.name.localeCompare(b.name, "tr"));
export const snapshotInfo = {
  retrievedAt: snapshot.retrievedAt,
  guides: snapshot.guides.length,
  sourceRecords: snapshot.guides.reduce((n, g) => n + g.sources.length, 0),
};
export function normalize(text: string) {
  return text
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}
export function parseInput(body: unknown): ResearchInput {
  if (!body || typeof body !== "object")
    throw new Error("Geçerli bir soru gönderin.");
  const value = body as Record<string, unknown>;
  if (
    typeof value.question !== "string" ||
    value.question.trim().length < 4 ||
    value.question.length > 600
  )
    throw new Error("Sorunuz 4–600 karakter arasında olmalı.");
  if (
    !Array.isArray(value.districts) ||
    value.districts.length < 1 ||
    value.districts.length > 2 ||
    new Set(value.districts).size !== value.districts.length ||
    value.districts.some(
      (s) => typeof s !== "string" || !catalogue.some((d) => d.slug === s),
    )
  )
    throw new Error("Bir ilçe veya karşılaştırmak için iki farklı ilçe seçin.");
  return {
    question: value.question.trim(),
    districts: value.districts as string[],
  };
}
export function selectPassages(input: ResearchInput): Passage[] {
  const question = normalize(input.question);
  // Live, quantitative and high-stakes claims are outside this frozen editorial corpus.
  if (
    /(fiyat|kira|getiri|yatirim|nufus|istatistik|yuzde|kac kisi|kac mahalle|km2|kilometrekare|deprem|guvenli|suc|garanti|bugun|guncel|202[7-9]|203\d)/.test(
      question,
    )
  )
    return [];
  const matched = topics.filter((t) =>
    t.words.some((word) => question.includes(word)),
  );
  if (!matched.length) return [];
  const sections = matched.slice(0, 3);
  return input.districts.flatMap((slug) => {
    const guide = snapshot.guides.find((g) => g.slug === slug)!;
    const district = catalogue.find((d) => d.slug === slug)!;
    return sections.flatMap((topic) => {
      const text = (guide.sections as Record<string, string>)[topic.section];
      const sources = guide.sources.filter(
        (s) =>
          s.sections.includes(topic.section) &&
          !s.needsVerification &&
          safeSourceUrl(s.url),
      );
      if (!text || !sources.length) return [];
      return [
        {
          id: `${slug}:${topic.section}`,
          district: slug,
          districtName: district.name,
          section: topic.section,
          title: topic.title,
          text,
          guideUrl: guide.url,
          updatedAt: guide.updatedAt,
          sources,
        },
      ];
    });
  });
}
export function safeSourceUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !/^(localhost|127\.|10\.|192\.168\.|\[)/.test(url.hostname)
    );
  } catch {
    return false;
  }
}
export function answerFromPassages(
  input: ResearchInput,
  passages: Passage[],
  mode: "local" | "claude" = "local",
): ResearchAnswer {
  return {
    mode,
    question: input.question,
    retrievedAt: snapshot.retrievedAt,
    passages,
    message: passages.length
      ? mode === "local"
        ? "Ücretsiz kaynak temelli demo • Sorunuzdaki konuya göre yayımlanmış rehberlerden birebir alıntılar seçildi. Claude çağrısı yapılmadı."
        : "Claude, ilgili rehber alıntılarını seçti. Görünen metinler kaynakla birebir eşleşir; serbest üretilmiş iddia içermez."
      : "Bu soruyu mevcut kaynak kapsamıyla güvenilir biçimde yanıtlayamıyorum. Canlı fiyat, nüfus, risk veya yatırım tahmini sunmuyorum. Ulaşım, tarih, yaşam, konum ya da konut dokusu hakkında sorabilirsiniz.",
  };
}
// Only source-backed IDs may cross the model boundary. Model-generated prose is never rendered.
export function validateSelection(
  raw: string,
  candidates: Passage[],
): Passage[] {
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== "object" ||
    !("ids" in value) ||
    !Array.isArray(value.ids) ||
    value.ids.length > 6 ||
    value.ids.some(
      (id) => typeof id !== "string" || !candidates.some((p) => p.id === id),
    )
  )
    throw new Error("Invalid model citation selection");
  const ids = value.ids as string[];
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate citations");
  const chosen = ids.map((id) => candidates.find((p) => p.id === id)!);
  for (const district of new Set(candidates.map((p) => p.district))) {
    if (chosen.length && !chosen.some((p) => p.district === district))
      throw new Error("Incomplete comparison");
  }
  return chosen;
}
