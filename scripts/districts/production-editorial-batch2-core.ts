import { districts } from "../../src/content/districts/district-registry";
import { projectPublishedDistrictGuide } from "../../src/content/districts/district-guide-projection";
import {
  ownedFields,
  fingerprint,
  importVersion,
  makeDraft,
  researchFingerprint,
  type ResearchBundle,
  type ResearchRecord,
} from "./import-core";
import {
  productionImportError,
  type ProductionImportDocument,
  type ProductionImportRepository,
} from "./production-import-core";

export const batch2EditorialSourceCommit =
  "1bb2aacb85310cb54ff887e80174aa0a08377b08";
export const batch2BaselineCommit =
  "18e4cdf4f5875b47d3523f864bc615a6d82be77c";
export const batch2ImportVersion = 4;
export const batch2ExcludedDistrict = "esenler" as const;

export const batch2TargetSlugs = districts
  .map((district) => district.slug)
  .filter((slug) => slug !== batch2ExcludedDistrict);

type Batch2TargetSlug = Exclude<
  (typeof districts)[number]["slug"],
  typeof batch2ExcludedDistrict
>;

// Generated from the validated research + editorial bundle at
// batch2BaselineCommit. These values bind Batch 2 to the exact managed
// Production state that preceded the editorial completion work.
export const batch2BaselineSourceFingerprints = {
  arnavutkoy: "c6c4cdf18e51489f04e956451b8fa3861ea8e5ed094d29bd0a4861da32925415",
  avcilar: "4374aa98b99ff9ebe2253462666883f925eff43ab5da996997d9d0f8806ee6b0",
  bagcilar: "03671783b768f84303777bdd6fee8c6f3fff65ac18cdffaf1ba51569e43dfbdd",
  bahcelievler: "426cc9a084001c225fdbfb6fef4457ddb7f8bd5bcf4ad0ce94518d77d1484a1a",
  bakirkoy: "6746becb3e9a511b5dbca6ab668aabeb818863383f0a46d6ff42291549db4c6e",
  basaksehir: "ed5d58231391dd903f3cc78ffaf9b7c3654a105962151005261a5982e5bb6647",
  bayrampasa: "b73f3ca341e90061e27668a294af6155e4ac05783921a58c9beb631d8c7e7a43",
  besiktas: "efcbca80bfa409bc06559863134c6e88df43c247c40c14283ba76b01fde44e2c",
  beylikduzu: "d8d2185de01c3ea7d073143cf61a44ec55d000de10379a39744920b9f15c4491",
  beyoglu: "da8914195194df36d01b9780533faf279c7372a6cd3b2e970cb158e3385766df",
  buyukcekmece: "7e23ad76c1a606d99ee9a8397321b5a3189773867dac1ea6013c14a71ec08a16",
  catalca: "a8d621e16ce3b11b4fe18d533191c5cae4490a351f2cbed66baa529aea6f26f8",
  esenyurt: "8797563932222cc8dbd0d0577d98f8dfdf707a5814448455026930b55c04b5cc",
  eyupsultan: "b00d8866ee907df829d0b5192f7b719b9c098a1de399e8e50686c81667d03bba",
  fatih: "9bc07843efd31c6ebf5823f65d5452664263b32700610e7c17dcf2965565933f",
  gaziosmanpasa: "03518136817ddbf67e787e88bd016449122d81c02eb2ddf6130b451ec8ef3dca",
  gungoren: "10d1f4238148ca486df98434cae0b2b02129a28037dac999734fb58491ccc85c",
  kagithane: "36619e8bcd7ed5a86d22426f32a241954389d2dda7cb1bfd5d31d3b1d85e57a6",
  kucukcekmece: "473f39fd0c0b8214ef75edbccc3361717e4f04a94790956384e5e3e02f723485",
  sariyer: "70e61f42e2e1cf35475b8daa62d66599b825c8a0239f7f57c09c63073b81c014",
  silivri: "6018f7abc4ff7f83558f9886196a14cac4c420ef782b11aa0fbfb5750ac8b516",
  sultangazi: "91e67173263123af8f6b8e28461dd75f827a4fac26a133801d33366563e206a2",
  sisli: "6ebc08ae685fee3924df083cf46f49cf5617c9368530dc92634b7c5e95a79e9c",
  zeytinburnu: "cdf8815cc068778a065bb771b2359da332cf9a2b32bda9d11576216c8e1a881a",
  adalar: "ba17035573a61a4622ad0a5e1ec7eb165cec0c900e71fbe7bb6fd2d74999898f",
  atasehir: "213a0c3ccac0fdd0d879c2ca49d3132843e9007e393cf25839e59bbb22b13c27",
  beykoz: "7fe7e826ee903a2ad919fa445856887251e282197489ad73d562983f62617851",
  cekmekoy: "c70b6c6623f286fdc9b8a98f355916042ffb5b683c5366a362a8a2236798ce8c",
  kadikoy: "6a9f9ec3599074d8558102b80830705660a68852e32d34d32fd8494be37610e8",
  kartal: "79781e2b6436edbd13b0500300565b9fb3e6774a16b5d8a1280283561c06d460",
  maltepe: "3fcd1fa3159980b7a7fcf1b7251a3b371f52349f94e3b33e68462ff5d0ce93da",
  pendik: "aa0ae9b3ec3caac2830a14ead7e18141c7c28d5820ab64aef8d8a4e395f8bec4",
  sancaktepe: "948693bd7900390b0925038bcb69b28126d2a4d0007c6de939726b1a19d7389b",
  sultanbeyli: "741c781075ef6b64cc1540a09b2bcb9bc9a5d2438d121aff6a7ddc56cfee62d3",
  sile: "19debcff3d2be59a501cb19601ba635b03e57b193aad56f2b9ab4901d942ba83",
  tuzla: "d4279ec3bfe23577c479b61bfeaf8c4f10a75b3da64c3c8ce3b938af6e42800b",
  umraniye: "96aaa3173b085c6a42853dd390489c8366eefe49322e30811d1d88ef3121e846",
  uskudar: "6133452fe508f094b5c59c2639d4dc05be572be0cd41d4fb7162bbc43ca0e880",
} as const satisfies Record<Batch2TargetSlug, string>;

// Generated from the exact owned-field output at batch2BaselineCommit. The
// source fingerprint alone proves which input was used; this second binding
// also proves that the current managed record still has the expected content.
export const batch2BaselineContentFingerprints = {
  arnavutkoy: "c82aa9833451bd2ffe2a00d5c57d3899661af1e10f52526027f07c52d95e452b",
  avcilar: "1a8de06046fb18da254cb7c479d8a76c75793cafa4406c8bd9663bc4db438d4c",
  bagcilar: "b591196a1deea54f95d342583eb74cf43ca2d5a1de6d9e48fb03e85142eba54e",
  bahcelievler: "173de209354cc4a3f44a0c3f3016444e8d1c2da6f368faafe1b6ab8fdfd4cc1f",
  bakirkoy: "4ff734a3da91a530c2270da4816902ba990a8e9a882db13c131402eaf4af31ff",
  basaksehir: "926bc49b8e370653123db392e376e1c7fca2b0ed8325132ab3972a77dfb8d4db",
  bayrampasa: "a4dce3301517cfa36ea1fbdcb76ea5f554f12d2a4983ad6136a461e80ea9ddb0",
  besiktas: "8d13157b2be181cab96fb86034b888fc95b65dd19ece86e0446611d4e4a0398f",
  beylikduzu: "ca546d19f5c2b3d4e1a7a8346cd0fc6cbaee60c89ec9b8b23143b3f167673bbd",
  beyoglu: "d513717ebb9a9f83b775b8e6210de4aabd6229eafd8ba32c69582f8bba029a57",
  buyukcekmece: "0bb0220888595e8ec1e34280f08fff27c82f02a3c6d8449a8e446258b2621edf",
  catalca: "f46719433dda1e61360f403953c4793832bf880e341b29154ea3ad3549331744",
  esenyurt: "790c4896e53f4d49549cbac6dff8903075e31e55632fafdf7b5773c150d9c59f",
  eyupsultan: "0576578358085906f5cfff22f3c173c15ab84c59679cee1c147ee8c9a516e85c",
  fatih: "1627653cf160cde3a333d6bc53d645e7c9d98890b990f813f86cf0fb999c8ffe",
  gaziosmanpasa: "94af469554b6eb450949931ec4a31f4c597c6e598838ee19a312f3405172e324",
  gungoren: "194b864da2e2854b2aacc953489b07e426dc6f489c1bf3d1f63da6590ae63d15",
  kagithane: "73f8e8b1dc755d62f09373593bb2e18bfec3d0f2e2927464b8ebadc1081152b9",
  kucukcekmece: "24d56de9e7b89e04dfd0bffb6c9d8250b8f36c91cc2422723309875a6714ba8f",
  sariyer: "02f3bc28d0096ed1bf8af046ba9c95546dd1dbf2ec6f53c55a07d3f562e67ab4",
  silivri: "ba7f78db9f2f567468b26d2f65c7afb2970b59af4f99a731473451191feaf2ea",
  sultangazi: "27512d60061f9d182deb7b4004a2c334c67c7c70f8fbc8eea92e5fb9c85121a3",
  sisli: "29b316abfc82537c7817db1d5cf1ad9eafb13526cc1600e40a2ebcee2cf53c36",
  zeytinburnu: "8f6ea2715c89dbfca0164ba209f3f832e2ce47bc4c5391ce4ccd86759e1bb291",
  adalar: "8b45b3d825543d6df5806be16a1eb94baa14673927516f25d579364a760cd7ee",
  atasehir: "ae2a839671b296aa7337039edb235cde8548a637bc039ec9702e6dcc10392aeb",
  beykoz: "34ec916cbfedae6a4b060bae8e4844877c89d71bc4e58c8e76d16553a501d479",
  cekmekoy: "a5a3131a944f00c3050baeb149cad235a84c6d5ddf9bdd136f6b33007c1f22e8",
  kadikoy: "df5800b401c790f5f694d98a0f658c2e58be8ed6a1f24b2db06a220c6753b52c",
  kartal: "90ddcc756635741d75fbe704ca37f868ba85e722c72942cb96d716b6ddc72435",
  maltepe: "ef1cea84cf235457aeebc65691459d04473c821d379ff46f3a0bc0360f451849",
  pendik: "b6d03c0e9dd9527bcdd7aa2aa3398616a27775bf8d3c5d7715d7339f4ab15f0d",
  sancaktepe: "2224675f4d5fadb8e9ce188c3594753e85e351f8a23b69df148ff269edc6829a",
  sultanbeyli: "09275d05b0ca8c3d7c13e6e86cdb7d3fbb48fd3c75f5b7050c37ccbca780b27c",
  sile: "5f6b103cb541cbed261d7ba475d70af1f8c904719df20313d210789f078f0790",
  tuzla: "e43a010ba4ca23a6dfcf77f3b9baa284fad75835f675321352565ecfa021af9c",
  umraniye: "480b618acc8e145e0c8b95810b65e22980e5f62bd5fbf935f857d869b287e919",
  uskudar: "fa362942d5fca0ef13fa81a1f2abdcb91437bfd4d87e260182e05c886e78fb7a",
} as const satisfies Record<Batch2TargetSlug, string>;

type Batch2BaselineFingerprints = Readonly<
  Record<string, { content: string; source: string }>
>;

const productionBaselineFingerprints: Batch2BaselineFingerprints =
  Object.fromEntries(
    batch2TargetSlugs.map((slug) => [
      slug,
      {
        content: (batch2BaselineContentFingerprints as Record<string, string>)[
          slug
        ],
        source: (batch2BaselineSourceFingerprints as Record<string, string>)[
          slug
        ],
      },
    ]),
  );

export type Batch2PlanCount = {
  create: number;
  update: number;
  skip: number;
  conflict: number;
};

export type Batch2PlanEntry = {
  action: keyof Batch2PlanCount;
  district: string;
  existing?: ProductionImportDocument;
  reason: string;
  row: ResearchRecord;
};

export type Batch2Plan = {
  count: Batch2PlanCount;
  entries: Batch2PlanEntry[];
};

export type Batch2PlanExpectation = "initial" | "applied";

export type Batch2ConfigurationStatus =
  | "MISSING"
  | "PRESENT_INVALID"
  | "PRESENT_VALID";

export const batch2ConfigurationVariables = [
  "PAYLOAD_DATABASE",
  "DATABASE_URL",
  "PAYLOAD_SECRET",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "PRODUCTION_DISTRICT_BATCH2_DRY_RUN_APPROVED_SHA",
] as const;

type Batch2ConfigurationVariable =
  (typeof batch2ConfigurationVariables)[number];

function requiredValueStatus(
  value: string | undefined,
): Batch2ConfigurationStatus {
  return value?.trim() ? "PRESENT_VALID" : "MISSING";
}

function exactValueStatus(
  value: string | undefined,
  expected: string,
): Batch2ConfigurationStatus {
  if (!value?.trim()) return "MISSING";
  return value === expected ? "PRESENT_VALID" : "PRESENT_INVALID";
}

export function batch2ConfigurationStatus(
  env: Readonly<Record<string, string | undefined>>,
): Record<Batch2ConfigurationVariable, Batch2ConfigurationStatus> {
  return {
    PAYLOAD_DATABASE: exactValueStatus(env.PAYLOAD_DATABASE, "postgres"),
    DATABASE_URL: requiredValueStatus(env.DATABASE_URL),
    PAYLOAD_SECRET: requiredValueStatus(env.PAYLOAD_SECRET),
    VERCEL: exactValueStatus(env.VERCEL, "1"),
    VERCEL_ENV: exactValueStatus(env.VERCEL_ENV, "production"),
    VERCEL_GIT_COMMIT_REF: exactValueStatus(
      env.VERCEL_GIT_COMMIT_REF,
      "main",
    ),
    VERCEL_GIT_COMMIT_SHA: requiredValueStatus(env.VERCEL_GIT_COMMIT_SHA),
    PRODUCTION_DISTRICT_BATCH2_DRY_RUN_APPROVED_SHA: exactValueStatus(
      env.PRODUCTION_DISTRICT_BATCH2_DRY_RUN_APPROVED_SHA,
      env.VERCEL_GIT_COMMIT_SHA || "__missing_commit_sha__",
    ),
  };
}

export function assertBatch2Environment(
  env: Readonly<Record<string, string | undefined>>,
  apply: boolean,
): void {
  const status = batch2ConfigurationStatus(env);
  const invalid = batch2ConfigurationVariables.find(
    (name) => status[name] !== "PRESENT_VALID",
  );
  if (invalid) {
    throw productionImportError(
      invalid === "PAYLOAD_DATABASE" ||
        invalid === "DATABASE_URL" ||
        invalid === "PAYLOAD_SECRET"
        ? "configuration_failed"
        : "approval_failed",
      "Production Editorial Batch 2 requires an exact SHA-bound Production environment.",
    );
  }
  if (
    apply &&
    env.PRODUCTION_DISTRICT_BATCH2_IMPORT_APPROVED !== "true"
  ) {
    throw productionImportError(
      "approval_failed",
      "Production Editorial Batch 2 import approval is required.",
    );
  }
  if (
    apply &&
    env.PRODUCTION_DISTRICT_BATCH2_PITR_CONFIRMED !== "true"
  ) {
    throw productionImportError(
      "approval_failed",
      "Production Editorial Batch 2 PITR confirmation is required.",
    );
  }
}

function publishedAt(document: ProductionImportDocument): string | null {
  return typeof document.publishedAt === "string" &&
    Number.isFinite(Date.parse(document.publishedAt))
    ? document.publishedAt
    : null;
}

function provenance(
  document: ProductionImportDocument,
): Record<string, unknown> | null {
  return document.importProvenance &&
    typeof document.importProvenance === "object" &&
    !Array.isArray(document.importProvenance)
    ? (document.importProvenance as Record<string, unknown>)
    : null;
}

function isSelfManaged(document: ProductionImportDocument): boolean {
  const managed = provenance(document);
  return (
    typeof managed?.fingerprint === "string" &&
    managed.fingerprint === fingerprint(document)
  );
}

function targetOwnedFingerprint(
  row: ResearchRecord,
  existing: ProductionImportDocument,
): string {
  return fingerprint({
    ...existing,
    ...makePublishedEditorialUpdate(row, existing, false),
  });
}

export function makePublishedEditorialUpdate(
  row: ResearchRecord,
  existing: ProductionImportDocument,
  includeProvenance = true,
): Record<string, unknown> {
  if (!row.editorial) {
    throw productionImportError(
      "input_failed",
      "Production Editorial Batch 2 requires attached editorial content.",
    );
  }
  const existingPublishedAt = publishedAt(existing);
  if (existing._status !== "published" || !existingPublishedAt) {
    throw productionImportError(
      "planning_failed",
      "Production Editorial Batch 2 can update published records only.",
    );
  }
  const source = makeDraft(row) as Record<string, unknown>;
  const update = Object.fromEntries(
    ownedFields.map((field) => [field, structuredClone(source[field])]),
  ) as Record<string, unknown>;
  update._status = "published";
  update.publishedAt = existingPublishedAt;
  if (includeProvenance) {
    const expectedFingerprint = fingerprint({ ...existing, ...update });
    update.importProvenance = {
      version: batch2ImportVersion,
      batch: "editorial-production-batch-2",
      sourceCommit: batch2EditorialSourceCommit,
      sourceFingerprint: researchFingerprint(row),
      ...row.document,
      fingerprint: expectedFingerprint,
    };
  }
  return update;
}

function assertCompleteInput(bundle: ResearchBundle): void {
  const expected = new Set(districts.map((district) => district.slug));
  const actual = new Set(bundle.districts.map((row) => row.district));
  if (
    bundle.districts.length !== districts.length ||
    actual.size !== expected.size ||
    [...expected].some((slug) => !actual.has(slug))
  ) {
    throw productionImportError(
      "input_failed",
      "Production Editorial Batch 2 requires the exact 39-district registry.",
    );
  }
  for (const row of bundle.districts) {
    if (!row.editorial) {
      throw productionImportError(
        "input_failed",
        "Production Editorial Batch 2 requires validated editorial rows.",
      );
    }
  }
}

function buildBatch2PlanAgainstBaseline(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
  baselineFingerprints: Batch2BaselineFingerprints,
): Batch2Plan {
  assertCompleteInput(bundle);
  const registry = new Set(districts.map((district) => district.slug));
  const byDistrict = new Map<string, ProductionImportDocument>();
  for (const document of existingDocuments) {
    if (
      typeof document.district !== "string" ||
      !registry.has(document.district as (typeof districts)[number]["slug"]) ||
      byDistrict.has(document.district)
    ) {
      throw productionImportError(
        "planning_failed",
        "Production Editorial Batch 2 found an unknown or duplicate district record.",
      );
    }
    byDistrict.set(document.district, document);
  }
  const count: Batch2PlanCount = {
    create: 0,
    update: 0,
    skip: 0,
    conflict: 0,
  };
  const entries = bundle.districts.map((row): Batch2PlanEntry => {
    const existing = byDistrict.get(row.district);
    let action: keyof Batch2PlanCount;
    let reason: string;
    if (!existing) {
      action = "create";
      reason = "missing production district";
    } else if (row.district === batch2ExcludedDistrict) {
      if (existing._status === "published" && publishedAt(existing)) {
        action = "skip";
        reason = "Esenler is explicitly excluded from Batch 2";
      } else {
        action = "conflict";
        reason = "Esenler protected record is not currently published";
      }
    } else if (
      existing._status !== "published" ||
      !publishedAt(existing) ||
      !isSelfManaged(existing)
    ) {
      action = "conflict";
      reason = "target is unpublished, unmanaged, or manually edited";
    } else {
      const managed = provenance(existing)!;
      const currentSourceFingerprint = researchFingerprint(row);
      const expectedTargetFingerprint = targetOwnedFingerprint(row, existing);
      if (
        managed.sourceFingerprint === currentSourceFingerprint &&
        fingerprint(existing) === expectedTargetFingerprint
      ) {
        action = "skip";
        reason = "Batch 2 content already applied";
      } else if (
        managed.version === importVersion &&
        managed.sourceFingerprint === baselineFingerprints[row.district]?.source &&
        fingerprint(existing) === baselineFingerprints[row.district]?.content
      ) {
        action = "update";
        reason = "exact managed Batch 2 baseline";
      } else {
        action = "conflict";
        reason = "source fingerprint does not match the approved baseline";
      }
    }
    count[action]++;
    return { action, district: row.district, existing, reason, row };
  });
  return { count, entries };
}

export function buildBatch2Plan(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
): Batch2Plan {
  return buildBatch2PlanAgainstBaseline(
    existingDocuments,
    bundle,
    productionBaselineFingerprints,
  );
}

export function buildBatch2PlanForTest(
  existingDocuments: ProductionImportDocument[],
  bundle: ResearchBundle,
): Batch2Plan {
  return buildBatch2PlanAgainstBaseline(
    existingDocuments,
    bundle,
    Object.fromEntries(
      existingDocuments
        .filter(
          (document) =>
            typeof document.district === "string" &&
            document.district !== batch2ExcludedDistrict,
        )
        .map((document) => [
          document.district as string,
          {
            content: fingerprint(document),
            source: String(provenance(document)?.sourceFingerprint ?? ""),
          },
        ]),
    ),
  );
}

function sameMembers(actual: string[], expected: readonly string[]): boolean {
  return (
    actual.length === expected.length &&
    new Set(actual).size === actual.length &&
    actual.every((value) => expected.includes(value))
  );
}

export function assertBatch2Plan(
  plan: Batch2Plan,
  expectation: Batch2PlanExpectation,
): void {
  const updates = plan.entries
    .filter((entry) => entry.action === "update")
    .map((entry) => entry.district);
  const skips = plan.entries
    .filter((entry) => entry.action === "skip")
    .map((entry) => entry.district);
  const exactInitial =
    plan.count.update === 38 &&
    plan.count.skip === 1 &&
    plan.count.create === 0 &&
    plan.count.conflict === 0 &&
    sameMembers(updates, batch2TargetSlugs) &&
    sameMembers(skips, [batch2ExcludedDistrict]);
  const exactApplied =
    plan.count.update === 0 &&
    plan.count.skip === 39 &&
    plan.count.create === 0 &&
    plan.count.conflict === 0 &&
    sameMembers(skips, districts.map((district) => district.slug));
  if (
    (expectation === "initial" && !exactInitial) ||
    (expectation === "applied" && !exactApplied)
  ) {
    throw productionImportError(
      "planning_failed",
      `Production Editorial Batch 2 does not match the exact ${expectation} gate.`,
      plan.count,
    );
  }
  if (
    plan.entries.some(
      (entry) =>
        entry.district === batch2ExcludedDistrict &&
        entry.action !== "skip",
    )
  ) {
    throw productionImportError(
      "planning_failed",
      "Production Editorial Batch 2 attempted to modify Esenler.",
      plan.count,
    );
  }
}

export async function readBatch2Plan(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  expectation: Batch2PlanExpectation,
): Promise<Batch2Plan> {
  return readBatch2PlanWithBuilder(
    bundle,
    repository,
    expectation,
    buildBatch2Plan,
  );
}

export async function readBatch2PlanForTest(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  expectation: Batch2PlanExpectation,
): Promise<Batch2Plan> {
  return readBatch2PlanWithBuilder(
    bundle,
    repository,
    expectation,
    buildBatch2PlanForTest,
  );
}

async function readBatch2PlanWithBuilder(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  expectation: Batch2PlanExpectation,
  buildPlan: typeof buildBatch2Plan,
): Promise<Batch2Plan> {
  let documents: ProductionImportDocument[];
  try {
    documents = await repository.readDistricts();
  } catch {
    throw productionImportError(
      "query_failed",
      "Production Editorial Batch 2 district read failed.",
    );
  }
  const plan = buildPlan(documents, bundle);
  assertBatch2Plan(plan, expectation);
  return plan;
}

function assertAppliedDocument(
  document: ProductionImportDocument,
  before: ProductionImportDocument,
  row: ResearchRecord,
): void {
  const expected = makePublishedEditorialUpdate(row, before);
  const managed = provenance(document);
  const projection = projectPublishedDistrictGuide(document);
  if (
    document.id !== before.id ||
    document.district !== before.district ||
    document._status !== "published" ||
    document.publishedAt !== before.publishedAt ||
    document.createdAt !== before.createdAt ||
    !isSelfManaged(document) ||
    managed?.version !== batch2ImportVersion ||
    managed?.sourceFingerprint !== researchFingerprint(row) ||
    fingerprint(document) !==
      (expected.importProvenance as Record<string, unknown>).fingerprint ||
    !projection ||
    projection.neighborhoods.length !== row.editorial!.neighborhoods.length ||
    projection.sources.length === 0 ||
    projection.marketData !== null ||
    projection.planningDevelopments.length !== 0 ||
    JSON.stringify(projection).includes("researchNotes") ||
    JSON.stringify(projection).includes("importProvenance")
  ) {
    throw productionImportError(
      "transaction_failed",
      "Production Editorial Batch 2 post-write verification failed.",
    );
  }
  for (const field of [
    "summary",
    "history",
    "geography",
    "life",
    "transportation",
    "housingTexture",
    "regionalAssessment",
    "placesGuide",
    "distinctiveFeatures",
    "researchTopics",
  ] as const) {
    if (projection[field] !== row.editorial!.sections[field]) {
      throw productionImportError(
        "transaction_failed",
        "Production Editorial Batch 2 public projection mismatch.",
      );
    }
  }
}

export async function applyBatch2(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
): Promise<Batch2Plan> {
  return applyBatch2WithBuilder(bundle, repository, buildBatch2Plan);
}

export async function applyBatch2ForTest(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
): Promise<Batch2Plan> {
  return applyBatch2WithBuilder(bundle, repository, buildBatch2PlanForTest);
}

async function applyBatch2WithBuilder(
  bundle: ResearchBundle,
  repository: ProductionImportRepository,
  buildPlan: typeof buildBatch2Plan,
): Promise<Batch2Plan> {
  return repository.transaction(async (transaction) => {
    const beforeDocuments = await transaction.findDistricts();
    const plan = buildPlan(beforeDocuments, bundle);
    assertBatch2Plan(plan, "initial");
    const beforeByDistrict = new Map(
      beforeDocuments.map((document) => [document.district, document]),
    );
    const esenlerBefore = beforeByDistrict.get(batch2ExcludedDistrict)!;
    const esenlerFingerprint = fingerprint(esenlerBefore);

    for (const entry of plan.entries) {
      if (entry.action !== "update") continue;
      if (!entry.existing) {
        throw productionImportError(
          "transaction_failed",
          "Production Editorial Batch 2 update target disappeared.",
        );
      }
      const saved = await transaction.updateDistrict(
        entry.existing.id,
        makePublishedEditorialUpdate(entry.row, entry.existing),
      );
      assertAppliedDocument(saved, entry.existing, entry.row);
    }

    const afterDocuments = await transaction.findDistricts();
    if (afterDocuments.length !== districts.length) {
      throw productionImportError(
        "transaction_failed",
        "Production Editorial Batch 2 record count changed.",
      );
    }
    const afterByDistrict = new Map(
      afterDocuments.map((document) => [document.district, document]),
    );
    const esenlerAfter = afterByDistrict.get(batch2ExcludedDistrict);
    if (
      !esenlerAfter ||
      esenlerAfter.id !== esenlerBefore.id ||
      esenlerAfter._status !== esenlerBefore._status ||
      esenlerAfter.publishedAt !== esenlerBefore.publishedAt ||
      fingerprint(esenlerAfter) !== esenlerFingerprint
    ) {
      throw productionImportError(
        "transaction_failed",
        "Production Editorial Batch 2 changed Esenler.",
      );
    }
    for (const entry of plan.entries) {
      if (entry.action !== "update") continue;
      const after = afterByDistrict.get(entry.district);
      if (!after) {
        throw productionImportError(
          "transaction_failed",
          "Production Editorial Batch 2 verification target is missing.",
        );
      }
      assertAppliedDocument(
        after,
        beforeByDistrict.get(entry.district)!,
        entry.row,
      );
    }
    const appliedPlan = buildPlan(afterDocuments, bundle);
    assertBatch2Plan(appliedPlan, "applied");
    return plan;
  });
}
