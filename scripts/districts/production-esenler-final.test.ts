import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projectPublishedDistrictGuide } from "../../src/content/districts/district-guide-projection";
import { attachEditorial, type EditorialBundle } from "./editorial";
import {
  fingerprint,
  makeDraft,
  type ResearchBundle,
} from "./import-core";
import {
  applyEsenlerFinal,
  assertEsenlerFinalPlan,
  buildEsenlerFinalPlan,
  canonicalHash,
  esenlerApprovedManualBaseline,
  esenlerFinalImportBatch,
  esenlerFinalImportVersion,
  isEsenlerFinalSelfManaged,
} from "./production-esenler-final-core";
import type {
  ProductionImportDocument,
  ProductionImportRepository,
} from "./production-import-core";

const deploymentSha = "a".repeat(40);
const baselineCommit = "f1732046b0534cef1bb68c5be5bc5b57c0aa6cbc";
const baselineResearchNotes = `{
  "methodology": "39 ilçe PDF havuzundaki başlıklar başlangıç olarak kullanıldı; metin yeniden yazıldı. Yalnız aşağıdaki kaynaklarla desteklenen sınırlı tarih/coğrafya bilgileri onaylandı. Mahalle dizinlerinde gözlenen liste esas alındı; gözlem tarihi kaynak yayın tarihi değildir. Çelişki ve doğrulama açığı olan alanlar kamuya açılmadı. Sayısal piyasa ve proje verileri bu incelemenin onay kapsamı dışındadır.",
  "checkedAt": "2026-09-09T18:50:26.627856+00:00",
  "excluded": {
    "facts": "Nüfus, nüfus yılı, yüzölçümü, yoğunluk ve sayısal sıralamalar onaylanmadı; kamuya aktarılmadı.",
    "transportation": "PDF hat, istasyon, süre ve açılış iddiaları güncel işletmeci kaydıyla tek tek doğrulanmadı; gizli.",
    "marketData": "m² satış fiyatı, kira, amortisman, getiri ve değer artışı tahminleri onaylanmadı; needsVerification.",
    "planningDevelopments": "Proje yüzdesi, teslim/açılış takvimi, imar ve dönüşüm durumları tarihli karar dosyasıyla doğrulanmadı; boş.",
    "housingTexture": "İlçe genelinde yapı güvenliği, kalite ve fiyat segmenti genellemeleri çıkarıldı; bina/parsel incelemesi yerine geçmez.",
    "regionalAssessment": "Yatırım üstünlüğü ve değerlenme öngörüleri çıkarıldı.",
    "life": "Güncel tesis hizmetleri ve yaşam kalitesi genellemeleri teyit edilmedi; boş.",
    "placesGuide": "Güncel ziyaret erişimi ve öneri rotaları doğrulanmadı; boş.",
    "distinctiveFeatures": "En büyük/ilk/en güvenli gibi üstünlük iddiaları ve yinelenen tanıtım dili çıkarıldı.",
    "researchTopics": "PDF araştırma önerileri yayımlanmış analiz gibi sunulmadı; Articles ilişkisi korunuyor.",
    "history": "Kaynak seçimi dışındaki eski çağ tarihleri, etimoloji rivayetleri ve önemli desteksiz iddialar aktarılmadı.",
    "newsPhotos": "Yalnız mevcut Articles/Photos ilişkileri; yeni/sentetik kayıt üretilmedi.",
    "specificReview": "PDF ve belediyenin eski muhtarlık sayfası 17 kayıt; 13.01.2026 tarihli duyuru ve İBB 19 kayıt. Şehitler ve Yeşil Vadi eklendi."
  },
  "reviewSha256": "34eb3805e4a0a51dda7c8c5d8e4e9762270c7d2294377211496e1fd8dcf11205",
  "rawResearch": "data/districts/research.json; public dışı araştırma havuzu"
}`;

function bundle(editorialText?: string): ResearchBundle {
  const research = JSON.parse(
    readFileSync("data/districts/research.json", "utf8"),
  ) as ResearchBundle;
  const editorial = JSON.parse(
    editorialText ?? readFileSync("data/districts/editorial.json", "utf8"),
  ) as EditorialBundle;
  return attachEditorial(research, editorial);
}

function initialDocuments(): ProductionImportDocument[] {
  const current = bundle();
  const baselineEditorial = execFileSync(
    "git",
    ["show", `${baselineCommit}:data/districts/editorial.json`],
    { encoding: "utf8" },
  );
  const previous = bundle(baselineEditorial);
  return current.districts.map((row, index) => {
    const sourceRow =
      row.district === "esenler"
        ? previous.districts.find((candidate) => candidate.district === "esenler")!
        : row;
    const document = makeDraft(sourceRow) as ProductionImportDocument;
    document.id = `district-${index}`;
    document.district = row.district;
    document._status = "published";
    document.createdAt = "2026-01-01T00:00:00.000Z";
    document.publishedAt = "2026-01-02T00:00:00.000Z";
    if (row.district === "esenler") {
      document.id = esenlerApprovedManualBaseline.documentId;
      document.createdAt = esenlerApprovedManualBaseline.createdAt;
      document.publishedAt = esenlerApprovedManualBaseline.publishedAt;
      document.researchNotes = baselineResearchNotes;
      document.importProvenance = structuredClone(
        esenlerApprovedManualBaseline.provenance,
      );
      assert.equal(
        fingerprint(document),
        esenlerApprovedManualBaseline.contentFingerprint,
      );
      assert.equal(
        canonicalHash(document.importProvenance),
        esenlerApprovedManualBaseline.provenanceCanonicalHash,
      );
    }
    return document;
  });
}

function target(documents: ProductionImportDocument[]) {
  return documents.find((document) => document.district === "esenler")!;
}

test("exact approved manual baseline plans one Esenler update and 38 skips", () => {
  const plan = buildEsenlerFinalPlan(initialDocuments(), bundle(), deploymentSha);
  assert.deepEqual(plan.count, { create: 0, update: 1, skip: 38, conflict: 0 });
  assertEsenlerFinalPlan(plan, "initial");
  assert.deepEqual(
    plan.entries.filter((entry) => entry.action === "update").map((entry) => entry.district),
    ["esenler"],
  );
});

for (const [name, mutate] of [
  ["content fingerprint", (d: ProductionImportDocument) => { d.summary = `${d.summary}x`; }],
  ["stored provenance fingerprint", (d: ProductionImportDocument) => {
    (d.importProvenance as Record<string, unknown>).fingerprint = "0".repeat(64);
  }],
  ["publishedAt", (d: ProductionImportDocument) => { d.publishedAt = "2026-09-20T11:37:45.328Z"; }],
  ["document ID", (d: ProductionImportDocument) => { d.id = "changed"; }],
  ["provenance canonical hash", (d: ProductionImportDocument) => {
    (d.importProvenance as Record<string, unknown>).version = 4;
  }],
  ["unpublished Esenler", (d: ProductionImportDocument) => { d._status = "draft"; }],
] as const) {
  test(`${name} drift conflicts`, () => {
    const documents = initialDocuments();
    mutate(target(documents));
    const plan = buildEsenlerFinalPlan(documents, bundle(), deploymentSha);
    assert.equal(plan.count.conflict, 1);
    assert.throws(() => assertEsenlerFinalPlan(plan, "initial"));
  });
}

test("missing Esenler is create and fails the exact gate", () => {
  const documents = initialDocuments().filter((document) => document.district !== "esenler");
  const plan = buildEsenlerFinalPlan(documents, bundle(), deploymentSha);
  assert.equal(plan.count.create, 1);
  assert.throws(() => assertEsenlerFinalPlan(plan, "initial"));
});

test("an unpublished non-target conflicts", () => {
  const documents = initialDocuments();
  documents.find((document) => document.district !== "esenler")!._status = "draft";
  const plan = buildEsenlerFinalPlan(documents, bundle(), deploymentSha);
  assert.equal(plan.count.conflict, 1);
});

function memoryRepository(documents: ProductionImportDocument[]): {
  repository: ProductionImportRepository;
  writes: Array<number | string>;
} {
  let state = structuredClone(documents);
  const writes: Array<number | string> = [];
  const transaction = {
    async findDistricts() {
      return structuredClone(state);
    },
    async updateDistrict(id: number | string, data: Record<string, unknown>) {
      writes.push(id);
      const index = state.findIndex((document) => document.id === id);
      state[index] = { ...state[index], ...structuredClone(data) };
      return structuredClone(state[index]);
    },
  };
  return {
    writes,
    repository: {
      async readDistricts() {
        return structuredClone(state);
      },
      async transaction(operation) {
        const snapshot = structuredClone(state);
        try {
          return await operation(transaction);
        } catch (error) {
          state = snapshot;
          throw error;
        }
      },
    },
  };
}

test("apply writes only Esenler and produces an exact self-managed final state", async () => {
  const documents = initialDocuments();
  const nonTargetFingerprints = new Map(
    documents.filter((d) => d.district !== "esenler").map((d) => [d.district, fingerprint(d)]),
  );
  const { repository, writes } = memoryRepository(documents);
  await applyEsenlerFinal(bundle(), repository, deploymentSha);
  assert.deepEqual(new Set(writes), new Set([esenlerApprovedManualBaseline.documentId]));
  const after = await repository.readDistricts();
  for (const document of after)
    if (document.district !== "esenler")
      assert.equal(fingerprint(document), nonTargetFingerprints.get(document.district));
  const esenler = target(after);
  assert.equal(isEsenlerFinalSelfManaged(esenler), true);
  assert.equal((esenler.importProvenance as Record<string, unknown>).version, esenlerFinalImportVersion);
  assert.equal((esenler.importProvenance as Record<string, unknown>).batch, esenlerFinalImportBatch);
  const plan = buildEsenlerFinalPlan(after, bundle(), deploymentSha);
  assert.deepEqual(plan.count, { create: 0, update: 0, skip: 39, conflict: 0 });
  assertEsenlerFinalPlan(plan, "applied");
  const projection = projectPublishedDistrictGuide(esenler)!;
  const publicJson = JSON.stringify(projection);
  assert.equal(projection.neighborhoods.length, 19);
  assert.equal((esenler.sources as unknown[]).length, 12);
  assert.ok(projection.sources.length > 0);
  assert.equal(projection.planningDevelopments.length, 0);
  assert.ok(!publicJson.includes("importProvenance"));
  assert.ok(!publicJson.includes("researchNotes"));
});

test("a non-target write makes the transaction fail closed", async () => {
  const documents = initialDocuments();
  const base = memoryRepository(documents);
  const repository: ProductionImportRepository = {
    ...base.repository,
    async transaction(operation) {
      return base.repository.transaction(async (transaction) => {
        let reads = 0;
        return operation({
          ...transaction,
          async findDistricts() {
            const found = await transaction.findDistricts();
            reads++;
            if (reads > 1) {
              const other = found.find(
                (document) => document.district !== "esenler",
              )!;
              other.summary = `${other.summary}changed`;
            }
            return found;
          },
        });
      });
    },
  };
  await assert.rejects(() =>
    applyEsenlerFinal(bundle(), repository, deploymentSha),
  );
  assert.deepEqual(new Set(base.writes), new Set([esenlerApprovedManualBaseline.documentId]));
});
