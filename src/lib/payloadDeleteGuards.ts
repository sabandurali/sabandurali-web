import {
  APIError,
  type CollectionBeforeDeleteHook,
  type PayloadRequest,
  type Where,
} from "payload";

type ReferencingCollection = "articles" | "books" | "pages";

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
    const [usedByArticle, usedByBook, usedByPage] = await Promise.all([
      hasMatchingDocument(req, "articles", {
        featuredImage: {
          equals: id,
        },
      }),
      hasMatchingDocument(req, "books", {
        or: [
          { coverImage: { equals: id } },
          { "seo.openGraphImage": { equals: id } },
        ],
      }),
      hasMatchingDocument(req, "pages", {
        or: [
          { "seo.socialImage": { equals: id } },
          { "layout.image": { equals: id } },
        ],
      }),
    ]);

    if (usedByArticle || usedByBook || usedByPage) {
      throw new APIError(
        "Bu medya en az bir içerikte kullanılıyor. Önce içerik ilişkisini kaldırın.",
        409,
      );
    }
  };
