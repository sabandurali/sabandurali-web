import {
  ValidationError,
  type CollectionBeforeValidateHook,
  type FieldHook,
  type TextField,
  type TypeWithID,
  type Where,
} from "payload";

type SlugDocument = TypeWithID & Record<string, unknown>;
type SlugSiblingData = Record<string, unknown>;

const turkishCharacters: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function normalizeSlug(input: string): string {
  return input
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (character) => turkishCharacters[character])
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[\u0027\u2019\u02BC]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type LocalizedSlugFieldOptions = {
  collection: "articles" | "categories";
  sourceField: string;
};

export function createLocalizedSlugHook({
  collection,
  sourceField,
}: LocalizedSlugFieldOptions): CollectionBeforeValidateHook<SlugDocument> {
  return async ({ data, operation, originalDoc, req }) => {
    if (!data) return data;

    const incomingSlug = data.slug;
    const previousSlug = originalDoc?.slug;
    const sourceValue = data[sourceField];
    let normalizedValue = "";

    if (typeof incomingSlug === "string" && incomingSlug.trim()) {
      normalizedValue = normalizeSlug(incomingSlug);
    } else if (
      operation === "update" &&
      typeof previousSlug === "string" &&
      previousSlug.trim()
    ) {
      normalizedValue = previousSlug;
    } else if (typeof sourceValue === "string") {
      normalizedValue = normalizeSlug(sourceValue);
    }

    if (normalizedValue === "") return data;

    data.slug = normalizedValue;

    const currentID = data.id ?? originalDoc?.id;
    const where: Where = {
      and: [
        { slug: { equals: normalizedValue } },
        ...(currentID === undefined
          ? []
          : [{ id: { not_equals: currentID } }]),
      ],
    };
    const duplicate = await req.payload.find({
      collection,
      depth: 0,
      fallbackLocale: false,
      limit: 1,
      locale: req.locale,
      overrideAccess: true,
      pagination: false,
      req,
      where,
    });

    if (duplicate.docs.length > 0) {
      throw new ValidationError(
        {
          collection,
          errors: [
            {
              message: "Bu dilde aynı slug değerine sahip başka bir kayıt var.",
              path: "slug",
            },
          ],
          id: currentID,
          req,
        },
        req.t,
      );
    }

    return data;
  };
}

export function createLocalizedSlugField({
  sourceField,
}: LocalizedSlugFieldOptions): TextField {
  const populateSlug: FieldHook<
    SlugDocument,
    string | null | undefined,
    SlugSiblingData
  > = ({ operation, previousValue, siblingData, value }) => {
    if (typeof value === "string" && value.trim()) {
      return normalizeSlug(value);
    }

    if (
      operation === "update" &&
      typeof previousValue === "string" &&
      previousValue.trim()
    ) {
      return previousValue;
    }

    const sourceValue = siblingData[sourceField];

    if (typeof sourceValue === "string") {
      return normalizeSlug(sourceValue);
    }

    return value;
  };

  return {
    name: "slug",
    type: "text",
    admin: {
      description:
        "Başlıktan otomatik oluşur; gerekirse elle düzenlenebilir ve başlık değiştiğinde korunur.",
    },
    hooks: {
      beforeValidate: [populateSlug],
    },
    index: true,
    localized: true,
    required: true,
    unique: true,
    validate: (value) => {
      const normalizedValue =
        typeof value === "string" ? normalizeSlug(value) : "";

      if (normalizedValue === "") {
        return "Slug boş olamaz ve en az bir harf veya sayı içermelidir.";
      }

      return true;
    },
  };
}
