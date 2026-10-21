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
type RelationshipUsage = {
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

function relationshipValueMatches(
  value: unknown,
  targetCollection: string,
  targetID: number | string,
): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) =>
      relationshipValueMatches(entry, targetCollection, targetID),
    );
  }

  if (isMatchingID(value, targetID)) return true;
  if (!isRecord(value)) return false;

  if ("relationTo" in value && value.relationTo !== targetCollection) {
    return false;
  }

  if (
    "value" in value &&
    relationshipValueMatches(value.value, targetCollection, targetID)
  ) {
    return true;
  }

  return "id" in value && isMatchingID(value.id, targetID);
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
    relationshipValueMatches(value.value, "media", mediaID)
  ) {
    return true;
  }

  return Object.values(value).some((entry) =>
    lexicalValueReferencesMedia(entry, mediaID),
  );
}

function relationTargetsCollection(
  relationTo: unknown,
  targetCollection: string,
): boolean {
  return Array.isArray(relationTo)
    ? relationTo.includes(targetCollection)
    : relationTo === targetCollection;
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

function fieldsCanReferenceCollection(
  fields: Field[],
  targetCollection: string,
): boolean {
  return fields.some((field) => {
    if (
      (field.type === "relationship" || field.type === "upload") &&
      relationTargetsCollection(field.relationTo, targetCollection)
    ) {
      return true;
    }

    if (field.type === "richText") return targetCollection === "media";

    if (
      field.type === "array" ||
      field.type === "collapsible" ||
      field.type === "group" ||
      field.type === "row"
    ) {
      return fieldsCanReferenceCollection(field.fields, targetCollection);
    }

    if (field.type === "blocks") {
      return field.blocks.some((block) =>
        fieldsCanReferenceCollection(block.fields, targetCollection),
      );
    }

    if (field.type === "tabs") {
      return field.tabs.some((tab) =>
        fieldsCanReferenceCollection(tab.fields, targetCollection),
      );
    }

    return false;
  });
}

function fieldsReferenceCollection(
  fields: Field[],
  data: unknown,
  targetCollection: string,
  targetID: number | string,
): boolean {
  if (!isRecord(data)) return false;

  return fields.some((field) => {
    if (
      (field.type === "relationship" || field.type === "upload") &&
      relationTargetsCollection(field.relationTo, targetCollection)
    ) {
      return fieldValues(field, data).some((value) =>
        relationshipValueMatches(value, targetCollection, targetID),
      );
    }

    if (field.type === "richText" && targetCollection === "media") {
      return fieldValues(field, data).some((value) =>
        lexicalValueReferencesMedia(value, targetID),
      );
    }

    if (field.type === "array") {
      return fieldValues(field, data).some(
        (value) =>
          Array.isArray(value) &&
          value.some((entry) =>
              fieldsReferenceCollection(
                field.fields,
                entry,
                targetCollection,
                targetID,
              ),
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
                fieldsReferenceCollection(
                  block.fields,
                  entry,
                  targetCollection,
                  targetID,
                )
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
        fieldsReferenceCollection(
          field.fields,
          value,
          targetCollection,
          targetID,
        ),
      );
    }

    if (field.type === "tabs") {
      return field.tabs.some((tab) => {
        const tabValues =
          "name" in tab && typeof tab.name === "string"
            ? [data[tab.name]]
            : [data];

        return tabValues.some((value) =>
          fieldsReferenceCollection(
            tab.fields,
            value,
            targetCollection,
            targetID,
          ),
        );
      });
    }

    return false;
  });
}

async function findCollectionRelationshipUsage(
  req: PayloadRequest,
  targetCollection: string,
  targetID: number | string,
): Promise<RelationshipUsage | null> {
  for (const collection of req.payload.config.collections) {
    if (
      collection.slug === targetCollection ||
      !fieldsCanReferenceCollection(collection.fields, targetCollection)
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
        fieldsReferenceCollection(
          collection.fields,
          document,
          targetCollection,
          targetID,
        ),
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
          fieldsReferenceCollection(
            collection.fields,
            document.version,
            targetCollection,
            targetID,
        ),
      )
    ) {
      return { entity: collection.slug, source: "version" };
    }
  }

  return null;
}

async function findGlobalRelationshipUsage(
  req: PayloadRequest,
  targetCollection: string,
  targetID: number | string,
): Promise<RelationshipUsage | null> {
  for (const global of req.payload.config.globals) {
    if (!fieldsCanReferenceCollection(global.fields, targetCollection)) continue;

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

    if (
      fieldsReferenceCollection(
        global.fields,
        currentDocument,
        targetCollection,
        targetID,
      )
    ) {
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
          fieldsReferenceCollection(
            global.fields,
            document.version,
            targetCollection,
            targetID,
          ),
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
      (await findCollectionRelationshipUsage(req, "media", id)) ??
      (await findGlobalRelationshipUsage(req, "media", id));

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

function preventDeletingReferencedRelationship(
  targetCollection: "photo-collections" | "tags",
  label: string,
): CollectionBeforeDeleteHook {
  return async ({ id, req }) => {
    const usage =
      (await findCollectionRelationshipUsage(req, targetCollection, id)) ??
      (await findGlobalRelationshipUsage(req, targetCollection, id));

    if (usage === null) return;

    const sourceDescription =
      usage.source === "version" ? "geçmiş bir içerik sürümünde" : "mevcut içerikte";

    throw new APIError(
      `Bu ${label} ${sourceDescription} (${usage.entity}) kullanılıyor. Önce ilişkiyi kaldırın ve gerekiyorsa ilgili sürüm geçmişini temizleyin.`,
      409,
    );
  };
}

export const preventDeletingReferencedPhotoCollection =
  preventDeletingReferencedRelationship("photo-collections", "fotoğraf koleksiyonu");

export const preventDeletingReferencedTag =
  preventDeletingReferencedRelationship("tags", "etiket");
