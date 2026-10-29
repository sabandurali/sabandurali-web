import assert from "node:assert/strict";
import test from "node:test";
import {
  createLocalizedSlugField,
  createLocalizedSlugHook,
  normalizeSlug,
} from "./localizedSlug";
import { createBookReviewSlug } from "@/content/books/helpers";
import { SLUG_RULE_MESSAGE, createSlug, isSlug } from "@/content/shared/slug";

test("slugs transliterate Turkish letters and drop punctuation", () => {
  assert.equal(
    normalizeSlug("İstanbul’da Gayrimenkul — 2026!"),
    "istanbulda-gayrimenkul-2026",
  );
  assert.equal(
    normalizeSlug("ÇAĞLAYAN Şişli Ümraniye Göztepe"),
    "caglayan-sisli-umraniye-goztepe",
  );
  assert.equal(normalizeSlug("  --Kadıköy's   Moda--  "), "kadikoys-moda");
  assert.equal(normalizeSlug("Café Crème"), "cafe-creme");
  assert.equal(normalizeSlug("!!!"), "");
});

type SlugHook = ReturnType<typeof createLocalizedSlugHook>;
type HookArgs = Parameters<SlugHook>[0];

function hookArgs(
  data: Record<string, unknown>,
  options: {
    operation?: "create" | "update";
    originalDoc?: Record<string, unknown>;
    duplicates?: unknown[];
    queries?: unknown[];
  } = {},
): HookArgs {
  // A minimal request: the hook only uses payload.find, locale and t.
  const req = {
    locale: "tr",
    t: (key: string) => key,
    payload: {
      find: async (query: unknown) => {
        options.queries?.push(query);
        return { docs: options.duplicates ?? [] };
      },
    },
  };

  return {
    data,
    operation: options.operation ?? "create",
    originalDoc: options.originalDoc,
    req,
  } as unknown as HookArgs;
}

test("the collection hook normalizes the slug and checks uniqueness per locale", async () => {
  const hook = createLocalizedSlugHook({
    collection: "articles",
    sourceField: "title",
  });
  const queries: unknown[] = [];
  const data = await hook(hookArgs({ title: "Moda Sahili" }, { queries }));

  assert.equal(data?.slug, "moda-sahili");
  assert.equal(queries.length, 1);
  const query = queries[0] as Record<string, unknown>;
  assert.equal(query.collection, "articles");
  assert.equal(query.locale, "tr");
  assert.equal(query.fallbackLocale, false);
  assert.deepEqual(query.where, {
    and: [{ slug: { equals: "moda-sahili" } }],
  });

  const updateQueries: unknown[] = [];
  await hook(
    hookArgs(
      { slug: "Moda Sahili" },
      {
        operation: "update",
        originalDoc: { id: "a1" },
        queries: updateQueries,
      },
    ),
  );
  assert.deepEqual((updateQueries[0] as Record<string, unknown>).where, {
    and: [{ slug: { equals: "moda-sahili" } }, { id: { not_equals: "a1" } }],
  });
});

test("an existing slug is kept on update and duplicates are rejected", async () => {
  const hook = createLocalizedSlugHook({
    collection: "photos",
    sourceField: "title",
  });
  const kept = await hook(
    hookArgs(
      { id: "p1", title: "Yeni başlık" },
      { operation: "update", originalDoc: { id: "p1", slug: "eski-baslik" } },
    ),
  );

  assert.equal(kept?.slug, "eski-baslik");
  await assert.rejects(
    hook(hookArgs({ title: "Galata" }, { duplicates: [{ id: "other" }] })),
    (error: unknown) =>
      error instanceof Error && error.name === "ValidationError",
  );
});

test("the slug field validates and populates from the source field", () => {
  const field = createLocalizedSlugField({
    collection: "tags",
    sourceField: "title",
  });
  // The TextField validator type also covers hasMany text fields.
  const validate = field.validate as
    ((value: unknown, options: never) => unknown) | undefined;
  const populate = field.hooks?.beforeValidate?.[0];

  assert.equal(field.localized, true);
  assert.equal(field.unique, true);
  assert.ok(validate && populate);
  assert.equal(validate("Kule", {} as never), true);
  assert.match(String(validate("  !! ", {} as never)), /Slug boş olamaz/);
  assert.equal(
    populate({
      value: undefined,
      operation: "create",
      siblingData: { title: "Kız Kulesi" },
    } as never),
    "kiz-kulesi",
  );
  assert.equal(
    populate({
      value: "",
      operation: "update",
      previousValue: "kiz-kulesi",
      siblingData: { title: "Başka" },
    } as never),
    "kiz-kulesi",
  );
});

test("every content type uses one slug rule that only yields a-z, 0-9 and single hyphens", () => {
  // Articles, pages, photos, collections, categories and tags
  // (normalizeSlug) and book reviews (createBookReviewSlug) share one rule.
  assert.equal(normalizeSlug, createSlug);
  assert.equal(createBookReviewSlug, createSlug);

  const cases: Array<[string, string]> = [
    ["Straße & Ötesi", "strasse-otesi"],
    ["a_b c", "a-b-c"],
    ["Kentsel/Dönüşüm", "kentsel-donusum"],
    ["Москва", ""],
    ["Kraków Łódź", "krakow-lodz"],
    ["İSTANBUL’UN ILIK SULARI", "istanbulun-ilik-sulari"],
    ["Ağaçlı ʼ Çiftlik", "agacli-ciftlik"],
    ["1.5 milyon", "1-5-milyon"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(createSlug(input), expected, input);
    // Idempotent, and inside the contract revalidation relies on.
    assert.equal(createSlug(expected), expected, input);
    if (expected !== "") assert.ok(isSlug(expected), input);
  }
  for (const value of ["москва", "straße", "a--b", "-a", "A", "ab-"]) {
    assert.equal(isSlug(value), false, value);
  }
  assert.ok(SLUG_RULE_MESSAGE.includes("a-z"));
});
