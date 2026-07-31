import {
  APIError,
  type CollectionBeforeDeleteHook,
  type CollectionSlug,
  type Field,
  type GlobalSlug,
  type PayloadRequest,
  type Where,
} from "payload";

type ReferencingCollection = "articles" | "books" | "pages";
type RecordValue = Record<string, unknown>;
type MediaUsage = {
  entity: string;
  source: "current" | "version";
};

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null;
}

function isMatchingID(value: unknown, mediaID: number | string): boolean {
  return (
    (typeof value === "number" || typeof value === "string") &&
    String(value) === String(mediaID)
  );
}

function mediaRelationMatches(
  value: unknown,
  mediaID: number | string,
): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => mediaRelationMatches(entry, mediaID));
  }

  if (isMatchingID(value, mediaID)) return true;
  if (!isRecord(value)) return false;

  if ("relationTo" in value && value.relationTo !== "media") {
    return false;
  }

  if ("value" in value && mediaRelationMatches(value.value, mediaID)) {
    return true;
  }

  return "id" in value && isMatchingID(value.id, mediaID);
}

function lexicalValueReferencesMedia(
  value: unknown,
  mediaID: number | string,
): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) =>
      lexicalValueReferencesMedia(entry, mediaID),
    );
  }

  if (!isRecord(value)) return false;

  if (
    (value.type === "upload" || value.type === "relationship") &&
    value.relationTo === "media" &&
    mediaRelationMatches(value.value, mediaID)
  ) {
    return true;
  }

  return Object.values(value).some((entry) =>
    lexicalValueReferencesMedia(entry, mediaID),
  );
}

function relationTargetsMedia(relationTo: unknown): boolean {
  return Array.isArray(relationTo)
    ? relationTo.includes("media")
    : relationTo === "media";
}

function fieldValues(field: Field, data: RecordValue): unknown[] {
  if (!("name" in field) || typeof field.name !== "string") {
    return [data];
  }

  const value = data[field.name];

  if (
    "localized" in field &&
    field.localized === true &&
    isRecord(value) &&
    !("id" in value) &&
    !("relationTo" in value) &&
    !("type" in value) &&
    !("value" in value)
  ) {
    return Object.values(value);
  }

  return [value];
}

function fieldsCanReferenceMedia(fields: Field[]): boolean {
  return fields.some((field) => {
    if (
      (field.type === "relationship" || field.type === "upload") &&
      relationTargetsMedia(field.relationTo)
    ) {
      return true;
    }

    if (field.type === "richText") return true;

    if (
      field.type === "array" ||
      field.type === "collapsible" ||
      field.type === "group" ||
      field.type === "row"
    ) {
      return fieldsCanReferenceMedia(field.fields);
    }

    if (field.type === "blocks") {
      return field.blocks.some((block) =>
        fieldsCanReferenceMedia(block.fields),
      );
    }

    if (field.type === "tabs") {
      return field.tabs.some((tab) =>
        fieldsCanReferenceMedia(tab.fields),
      );
    }

    return false;
  });
}

function fieldsReferenceMedia(
  fields: Field[],
  data: unknown,
  mediaID: number | string,
): boolean {
  if (!isRecord(data)) return false;

  return fields.some((field) => {
    if (
      (field.type === "relationship" || field.type === "upload") &&
      relationTargetsMedia(field.relationTo)
    ) {
      return fieldValues(field, data).some((value) =>
        mediaRelationMatches(value, mediaID),
      );
    }

    if (field.type === "richText") {
      return fieldValues(field, data).some((value) =>
        lexicalValueReferencesMedia(value, mediaID),
      );
    }

    if (field.type === "array") {
      return fieldValues(field, data).some(
        (value) =>
          Array.isArray(value) &&
          value.some((entry) =>
            fieldsReferenceMedia(field.fields, entry, mediaID),
          ),
      );
    }

    if (field.type === "blocks") {
      return fieldValues(field, data).some(
        (value) =>
          Array.isArray(value) &&
          value.some((entry) => {
            if (!isRecord(entry) || typeof entry.blockType !== "string") {
              return false;
            }

            const block = field.blocks.find(
              (candidate) => candidate.slug === entry.blockType,
            );

            return (
              block !== undefined &&
              fieldsReferenceMedia(block.fields, entry, mediaID)
            );
          }),
      );
    }

    if (
      field.type === "collapsible" ||
      field.type === "group" ||
      field.type === "row"
    ) {
      return fieldValues(field, data).some((value) =>
        fieldsReferenceMedia(field.fields, value, mediaID),
      );
    }

    if (field.type === "tabs") {
      return field.tabs.some((tab) => {
        const tabValues =
          "name" in tab && typeof tab.name === "string"
            ? [data[tab.name]]
            : [data];

        return tabValues.some((value) =>
          fieldsReferenceMedia(tab.fields, value, mediaID),
        );
      });
    }

    return false;
  });
}

async function findCollectionMediaUsage(
  req: PayloadRequest,
  mediaID: number | string,
): Promise<MediaUsage | null> {
  for (const collection of req.payload.config.collections) {
    if (
      collection.slug === "media" ||
      !fieldsCanReferenceMedia(collection.fields)
    ) {
      continue;
    }

    const collectionSlug = collection.slug as CollectionSlug;
    const currentDocuments = await req.payload.find({
      collection: collectionSlug,
      depth: 0,
      draft: true,
      fallbackLocale: false,
      locale: "all",
      overrideAccess: true,
      pagination: false,
      req,
    });

    if (
      currentDocuments.docs.some((document) =>
        fieldsReferenceMedia(collection.fields, document, mediaID),
      )
    ) {
      return { entity: collection.slug, source: "current" };
    }

    if (!collection.versions) continue;

    const versions = await req.payload.findVersions({
      collection: collectionSlug,
      depth: 0,
      fallbackLocale: false,
      locale: "all",
      overrideAccess: true,
      pagination: false,
      req,
    });

    if (
      versions.docs.some((document) =>
        fieldsReferenceMedia(
          collection.fields,
          document.version,
          mediaID,
        ),
      )
    ) {
      return { entity: collection.slug, source: "version" };
    }
  }

  return null;
}

async function findGlobalMediaUsage(
  req: PayloadRequest,
  mediaID: number | string,
): Promise<MediaUsage | null> {
  for (const global of req.payload.config.globals) {
    if (!fieldsCanReferenceMedia(global.fields)) continue;

    const globalSlug = global.slug as GlobalSlug;
    const currentDocument = await req.payload.findGlobal({
      slug: globalSlug,
      depth: 0,
      draft: true,
      fallbackLocale: false,
      locale: "all",
      overrideAccess: true,
      req,
    });

    if (fieldsReferenceMedia(global.fields, currentDocument, mediaID)) {
      return { entity: global.slug, source: "current" };
    }

    if (!global.versions) continue;

    const versions = await req.payload.findGlobalVersions({
      slug: globalSlug,
      depth: 0,
      fallbackLocale: false,
      locale: "all",
      overrideAccess: true,
      pagination: false,
      req,
    });

    if (
      versions.docs.some((document) =>
        fieldsReferenceMedia(global.fields, document.version, mediaID),
      )
    ) {
      return { entity: global.slug, source: "version" };
    }
  }

  return null;
}

async function hasMatchingDocument(
  req: PayloadRequest,
  collection: ReferencingCollection,
  where: Where,
): Promise<boolean> {
  const result = await req.payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where,
  });

  return result.docs.length > 0;
}

export const preventDeletingHomePage: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  const page = await req.payload.findByID({
    collection: "pages",
    depth: 0,
    id,
    overrideAccess: true,
    req,
  });

  if (page.pageType === "home") {
    throw new APIError(
      "Ana Sayfa kaydı silinemez. İçeriği düzenleyin veya yayın durumunu yönetin.",
      409,
    );
  }
};

export const preventDeletingLastAdmin: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  const user = await req.payload.findByID({
    collection: "users",
    depth: 0,
    id,
    overrideAccess: true,
    req,
  });

  if (user.role !== "admin") return;

  const otherAdmins = await req.payload.find({
    collection: "users",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        { role: { equals: "admin" } },
        { id: { not_equals: id } },
      ],
    },
  });

  if (otherAdmins.docs.length === 0) {
    throw new APIError(
      "Sistemdeki son yönetici hesabı silinemez.",
      409,
    );
  }
};

export const preventDeletingReferencedCategory: CollectionBeforeDeleteHook =
  async ({ id, req }) => {
    const isUsed = await hasMatchingDocument(req, "articles", {
      categories: {
        contains: id,
      },
    });

    if (isUsed) {
      throw new APIError(
        "Bu kategori en az bir makalede kullanılıyor. Önce makale ilişkilerini kaldırın.",
        409,
      );
    }
  };

export const preventDeletingReferencedMedia: CollectionBeforeDeleteHook =
  async ({ id, req }) => {
    const usage =
      (await findCollectionMediaUsage(req, id)) ??
      (await findGlobalMediaUsage(req, id));

    if (usage !== null) {
      const sourceDescription =
        usage.source === "version"
          ? "geçmiş bir içerik sürümünde"
          : "mevcut içerikte";

      throw new APIError(
        `Bu medya ${sourceDescription} (${usage.entity}) kullanılıyor. Önce ilişkiyi kaldırın ve gerekiyorsa ilgili sürüm geçmişini temizleyin.`,
        409,
      );
    }
  };
