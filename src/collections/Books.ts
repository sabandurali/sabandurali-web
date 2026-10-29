import {
  ValidationError,
  type CollectionAfterReadHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type FilterOptions,
  type PayloadRequest,
  type Where,
} from "payload";
import {
  BOOK_CATEGORIES,
  BOOK_CATEGORY_LABELS,
  BOOK_REVIEW_TRANSLATION_STATUSES,
  READING_STATUSES,
  REVIEW_STATUSES,
} from "@/content/books/constants";
import { createBookReviewSlug, normalizeIsbn } from "@/content/books/helpers";
import { SLUG_RULE_MESSAGE } from "@/content/shared/slug";
import { getBookPublicationIssues } from "@/collections/bookPublication";
import {
  imageMediaFilter,
  validateOptionalSiteCanonical,
} from "@/collections/validation";
import { getRelationshipID, getText, isRecord } from "@/content/guards";
import {
  adminOnly,
  adminOrEditor,
  editorialFieldRead,
  isPublicApiReader,
  publishedBookReviewOrAdminOrEditor,
} from "@/lib/payloadAccess";
import { createRevalidationHooks } from "@/lib/revalidation";

const revalidation = createRevalidationHooks("books");

function throwBookValidationError(
  req: PayloadRequest,
  errors: Array<{ message: string; path: string }>,
  id: string | null,
): never {
  throw new ValidationError(
    {
      collection: "books",
      errors,
      id: id ?? undefined,
      req,
    },
    req.t,
  );
}

/** Other reviews whose `translation` points at `targetID`. */
async function findBooksTranslatedAs(
  req: PayloadRequest,
  targetID: string,
  excludeID: string | null,
): Promise<string[]> {
  const result = await req.payload.find({
    collection: "books",
    depth: 0,
    limit: 2,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        { translation: { equals: targetID } },
        ...(excludeID === null ? [] : [{ id: { not_equals: excludeID } }]),
      ],
    },
  });

  return result.docs.map((doc) => String(doc.id));
}

const excludeCurrentBook: FilterOptions = ({ id }) =>
  id === undefined ? true : { id: { not_equals: id } };

function normalizeNestedSlugs(value: unknown, sourceField: string): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((entry) => {
    if (!isRecord(entry)) return entry;

    const currentSlug = getText(entry.slug);
    const source = getText(entry[sourceField]);

    return {
      ...entry,
      slug: createBookReviewSlug(currentSlug ?? source ?? ""),
    };
  });
}

export const normalizeAndValidateBook: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data) return data;

  const title = getText(data.title);
  const previousSlug = getText(originalDoc?.slug);
  const requestedSlug = getText(data.slug);
  const slug = createBookReviewSlug(
    requestedSlug ??
      (operation === "update" ? previousSlug : null) ??
      title ??
      "",
  );
  const language = getText(data.language) ?? getText(originalDoc?.language);
  const currentID = getText(data.id) ?? getText(originalDoc?.id);

  data.slug = slug;
  data.authors = normalizeNestedSlugs(data.authors, "name");
  data.tags = normalizeNestedSlugs(data.tags, "labelTr");

  for (const field of ["isbn10", "isbn13"] as const) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;

    const value = getText(data[field]);
    data[field] = value === null ? null : normalizeIsbn(value);
  }

  if (slug !== "" && language !== null) {
    const where: Where = {
      and: [
        { slug: { equals: slug } },
        { language: { equals: language } },
        ...(currentID === null ? [] : [{ id: { not_equals: currentID } }]),
      ],
    };
    const duplicate = await req.payload.find({
      collection: "books",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where,
    });

    if (duplicate.docs.length > 0) {
      throw new ValidationError(
        {
          collection: "books",
          errors: [
            {
              message:
                "Bu dilde aynı slug değerine sahip başka bir kitap incelemesi var.",
              path: "slug",
            },
          ],
          id: currentID ?? undefined,
          req,
        },
        req.t,
      );
    }
  }

  const isbnValues = [getText(data.isbn10), getText(data.isbn13)].filter(
    (value): value is string => value !== null,
  );

  if (isbnValues.length > 0) {
    const duplicate = await req.payload.find({
      collection: "books",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        and: [
          {
            or: isbnValues.flatMap((isbn): Where[] => [
              { isbn10: { equals: isbn } },
              { isbn13: { equals: isbn } },
            ]),
          },
          ...(currentID === null ? [] : [{ id: { not_equals: currentID } }]),
        ],
      },
    });

    if (duplicate.docs.length > 0) {
      throw new ValidationError(
        {
          collection: "books",
          errors: [
            {
              message: "Bu ISBN değerine sahip başka bir kitap incelemesi var.",
              path: data.isbn13 ? "isbn13" : "isbn10",
            },
          ],
          id: currentID ?? undefined,
          req,
        },
        req.t,
      );
    }
  }

  const translationID = getRelationshipID(data.translation);

  if (translationID !== null) {
    if (translationID === currentID) {
      throw new ValidationError(
        {
          collection: "books",
          errors: [
            {
              message: "Bir kayıt kendi çevirisi olarak seçilemez.",
              path: "translation",
            },
          ],
          id: currentID ?? undefined,
          req,
        },
        req.t,
      );
    }

    const translation = await req.payload.findByID({
      collection: "books",
      depth: 0,
      id: translationID,
      overrideAccess: true,
      req,
    });

    if (language !== null && getText(translation.language) === language) {
      throw new ValidationError(
        {
          collection: "books",
          errors: [
            {
              message:
                "Çeviri kaydı mevcut kayıttan farklı bir dilde olmalıdır.",
              path: "translation",
            },
          ],
          id: currentID ?? undefined,
          req,
        },
        req.t,
      );
    }

    // Translations are 1:1 pairs. Otherwise the reverse lookup that builds
    // hreflang links finds several candidates and picks one at random.
    const targetsOwnTranslation = getRelationshipID(translation.translation);

    if (targetsOwnTranslation !== null && targetsOwnTranslation !== currentID) {
      throwBookValidationError(
        req,
        [
          {
            message:
              "Seçilen kayıt başka bir incelemeye çeviri olarak bağlı. Önce o bağlantıyı kaldırın.",
            path: "translation",
          },
        ],
        currentID,
      );
    }

    if (
      (await findBooksTranslatedAs(req, translationID, currentID)).length > 0
    ) {
      throwBookValidationError(
        req,
        [
          {
            message:
              "Seçilen kayıt başka bir incelemenin çevirisi olarak zaten seçili.",
            path: "translation",
          },
        ],
        currentID,
      );
    }

    if (currentID !== null) {
      const linkedFrom = await findBooksTranslatedAs(
        req,
        currentID,
        translationID,
      );

      if (linkedFrom.length > 0) {
        throwBookValidationError(
          req,
          [
            {
              message:
                "Bu inceleme başka bir kaydın çevirisi olarak bağlı. Çeviri olarak o kaydı seçin veya önce o bağlantıyı kaldırın.",
              path: "translation",
            },
          ],
          currentID,
        );
      }
    }
  }

  return data;
};

/**
 * Publishing runs the same rules as the public site (see
 * `bookPublication.ts`), so a review that looks published in the admin is
 * also visible on the site, or the editor sees why not.
 */
export const validateBookPublication: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data;

  const merged: Record<string, unknown> = {
    ...(isRecord(originalDoc) ? originalDoc : {}),
    ...data,
  };

  if (merged._status !== "published") return data;

  const coverID = getRelationshipID(merged.coverImage);
  const coverMedia =
    coverID === null
      ? null
      : await req.payload.findByID({
          collection: "media",
          depth: 0,
          disableErrors: true,
          id: coverID,
          overrideAccess: true,
          req,
        });
  const issues = getBookPublicationIssues(merged, coverMedia);

  if (issues.length > 0) {
    throwBookValidationError(
      req,
      issues.map((issue) => ({ ...issue })),
      getText(merged.id),
    );
  }

  return data;
};

/**
 * `reviewStatus` is an editorial field (`PRIVATE_BOOK_REVIEW_FIELDS`), but the
 * collection's own read access filters on it, and Payload validates that
 * filter against field access. It is dropped from the public API response
 * here instead; every row an anonymous client can read has the value
 * `published`, so the column itself reveals nothing to a `where` query.
 */
export const hideReviewStatusFromPublicApi: CollectionAfterReadHook = ({
  doc,
  overrideAccess,
  req,
}) => {
  if (overrideAccess === true || !isPublicApiReader(req) || !isRecord(doc)) {
    return doc;
  }

  return Object.fromEntries(
    Object.entries(doc).filter(([key]) => key !== "reviewStatus"),
  );
};

const textListField = (
  name: string,
  label: string,
): CollectionConfig["fields"][number] => ({
  name,
  type: "array",
  label,
  fields: [
    {
      name: "value",
      type: "text",
      label: "Metin",
      required: true,
    },
  ],
});

export const Books: CollectionConfig = {
  slug: "books",
  access: {
    create: adminOrEditor,
    // Deleting removes every version too; like articles and photos, only an
    // admin may do it. Editors unpublish instead.
    delete: adminOnly,
    read: publishedBookReviewOrAdminOrEditor,
    update: adminOrEditor,
  },
  admin: {
    defaultColumns: [
      "title",
      "language",
      "reviewStatus",
      "publishedAt",
      "updatedAt",
    ],
    group: "İçerik",
    useAsTitle: "title",
  },
  labels: {
    plural: "Kitap İncelemeleri",
    singular: "Kitap İncelemesi",
  },
  lockDocuments: false,
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Kitap",
          fields: [
            {
              name: "title",
              type: "text",
              label: "İnceleme başlığı",
              required: true,
            },
            {
              name: "slug",
              type: "text",
              admin: {
                description:
                  "Başlıktan otomatik oluşur; gerekirse elle düzenlenebilir.",
              },
              index: true,
              required: true,
              validate: (value: unknown) =>
                typeof value === "string" &&
                value === createBookReviewSlug(value) &&
                value.length > 0
                  ? true
                  : SLUG_RULE_MESSAGE,
            },
            {
              name: "language",
              type: "select",
              label: "Dil",
              defaultValue: "tr",
              index: true,
              options: [
                { label: "Türkçe", value: "tr" },
                { label: "English", value: "en" },
              ],
              required: true,
            },
            {
              name: "originalTitle",
              type: "text",
              label: "Kitabın özgün başlığı",
            },
            {
              name: "authors",
              type: "array",
              label: "Kitap yazarları",
              minRows: 1,
              fields: [
                {
                  name: "name",
                  type: "text",
                  label: "Ad",
                  required: true,
                },
                {
                  name: "slug",
                  type: "text",
                  label: "Slug",
                  required: true,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "translator",
                  type: "text",
                  label: "Çevirmen",
                },
                {
                  name: "publisher",
                  type: "text",
                  label: "Yayınevi",
                },
                {
                  name: "originalPublisher",
                  type: "text",
                  label: "Özgün yayınevi",
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "publicationYear",
                  type: "number",
                  label: "Yayın yılı",
                  max: 2200,
                  min: 1000,
                },
                {
                  name: "originalPublicationYear",
                  type: "number",
                  label: "Özgün yayın yılı",
                  max: 2200,
                  min: 1000,
                },
                {
                  name: "edition",
                  type: "text",
                  label: "Baskı",
                },
                {
                  name: "pageCount",
                  type: "number",
                  label: "Sayfa sayısı",
                  min: 1,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "isbn10",
                  type: "text",
                  label: "ISBN-10",
                  index: true,
                },
                {
                  name: "isbn13",
                  type: "text",
                  label: "ISBN-13",
                  index: true,
                },
              ],
            },
            {
              name: "coverImage",
              type: "upload",
              label: "Kapak görseli",
              relationTo: "media",
              filterOptions: imageMediaFilter,
            },
            {
              name: "coverImageAlt",
              type: "text",
              label: "Kapak alternatif metni",
              admin: {
                description:
                  "Boş bırakılırsa medya kaydındaki alternatif metin kullanılır.",
              },
            },
            {
              name: "category",
              type: "select",
              label: "Kategori",
              options: BOOK_CATEGORIES.map((value) => ({
                label: BOOK_CATEGORY_LABELS[value].tr,
                value,
              })),
            },
            {
              name: "tags",
              type: "array",
              label: "Etiketler",
              fields: [
                {
                  name: "slug",
                  type: "text",
                  label: "Slug",
                  required: true,
                },
                {
                  name: "labelTr",
                  type: "text",
                  label: "Türkçe etiket",
                  required: true,
                },
                {
                  name: "labelEn",
                  type: "text",
                  label: "English label",
                  required: true,
                },
                {
                  name: "aliases",
                  type: "array",
                  label: "Diğer adlar",
                  fields: [
                    {
                      name: "value",
                      type: "text",
                      label: "Ad",
                      required: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "İnceleme",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "readingStatus",
                  type: "select",
                  label: "Okuma durumu",
                  defaultValue: "planned",
                  options: READING_STATUSES.map((value) => ({
                    label: value,
                    value,
                  })),
                  required: true,
                },
                {
                  name: "reviewStatus",
                  type: "select",
                  label: "İnceleme durumu",
                  admin: {
                    description:
                      "Yayınlarken 'published' (sitede görünür) veya 'archived' (sitede gizli) seçin. Görünmesi için yayın tarihi gelmiş ve SEO indeksi açık olmalıdır; eksik alanlar yayın sırasında listelenir.",
                  },
                  defaultValue: "draft",
                  index: true,
                  options: REVIEW_STATUSES.map((value) => ({
                    label: value,
                    value,
                  })),
                  required: true,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "startedAt",
                  type: "date",
                  label: "Okumaya başlama",
                },
                {
                  name: "completedAt",
                  type: "date",
                  label: "Okumayı bitirme",
                },
                {
                  name: "publishedAt",
                  type: "date",
                  label: "Yayın tarihi",
                  admin: {
                    description:
                      "Gelecekteki bir tarih planlı yayını; boş değer public erişimin kapalı kalmasını sağlar.",
                  },
                  index: true,
                },
              ],
            },
            {
              name: "summary",
              type: "textarea",
              label: "Özet",
              required: true,
            },
            {
              name: "keyIdeas",
              type: "array",
              label: "Temel fikirler",
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "Başlık",
                  required: true,
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "Açıklama",
                  required: true,
                },
                {
                  name: "order",
                  type: "number",
                  label: "Sıra",
                  defaultValue: 0,
                  required: true,
                },
              ],
            },
            textListField("strengths", "Güçlü yönler"),
            textListField("weaknesses", "Zayıf yönler"),
            textListField("whoShouldRead", "Kimler okumalı?"),
            textListField("whoShouldNotRead", "Kimler okumamalı?"),
            {
              name: "applicationNotes",
              type: "array",
              label: "Uygulama notları",
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "Başlık",
                  required: true,
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "Açıklama",
                  required: true,
                },
                {
                  name: "action",
                  type: "textarea",
                  label: "Eylem",
                  required: true,
                },
                {
                  name: "order",
                  type: "number",
                  label: "Sıra",
                  defaultValue: 0,
                  required: true,
                },
              ],
            },
            {
              name: "personalEvaluation",
              type: "textarea",
              label: "Kişisel değerlendirme",
              required: true,
            },
            {
              name: "rating",
              type: "number",
              label: "Puan",
              admin: {
                step: 0.1,
              },
              max: 10,
              min: 0,
            },
            {
              name: "quotes",
              type: "array",
              label: "Alıntılar",
              fields: [
                {
                  name: "text",
                  type: "textarea",
                  label: "Metin",
                  required: true,
                },
                {
                  name: "page",
                  type: "number",
                  label: "Sayfa",
                  min: 1,
                },
                {
                  name: "note",
                  type: "textarea",
                  label: "Not",
                },
                {
                  name: "order",
                  type: "number",
                  label: "Sıra",
                  defaultValue: 0,
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: "Çeviri ve İlişkiler",
          fields: [
            {
              name: "translation",
              // The anonymous REST API would otherwise name the ID of an
              // unpublished translation. The public pages pair reviews
              // through the Local API, which keeps the field.
              access: { read: editorialFieldRead },
              type: "relationship",
              label: "Diğer dildeki kayıt",
              admin: {
                description:
                  "Bu incelemenin Türkçe veya İngilizce karşılığını seçin. Her kayıt yalnız bir çeviriyle eşleşebilir.",
              },
              filterOptions: excludeCurrentBook,
              // Translations point at each other; populating only one level
              // keeps `?depth=` from expanding the pair recursively.
              maxDepth: 1,
              relationTo: "books",
            },
            {
              name: "translationStatus",
              access: { read: editorialFieldRead },
              type: "select",
              label: "Çeviri durumu",
              defaultValue: "none",
              options: BOOK_REVIEW_TRANSLATION_STATUSES.map((value) => ({
                label: value,
                value,
              })),
              required: true,
            },
            {
              name: "relatedBooks",
              access: { read: editorialFieldRead },
              type: "relationship",
              hasMany: true,
              label: "İlgili kitap incelemeleri",
              filterOptions: excludeCurrentBook,
              maxDepth: 1,
              relationTo: "books",
            },
            {
              type: "row",
              fields: [
                {
                  name: "authorId",
                  access: { read: editorialFieldRead },
                  type: "relationship",
                  label: "İçerik yazarı",
                  relationTo: "users",
                },
                {
                  name: "editorId",
                  access: { read: editorialFieldRead },
                  type: "relationship",
                  label: "Editör",
                  relationTo: "users",
                },
              ],
            },
          ],
        },
        {
          label: "Yayın ve SEO",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "featured",
                  type: "checkbox",
                  label: "Öne çıkan",
                  defaultValue: false,
                },
                {
                  name: "showOnHomepage",
                  access: { read: editorialFieldRead },
                  type: "checkbox",
                  label: "Ana sayfada göster",
                  defaultValue: false,
                },
              ],
            },
            {
              name: "seo",
              type: "group",
              label: "SEO",
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "SEO başlığı",
                  required: true,
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "SEO açıklaması",
                  required: true,
                },
                {
                  name: "canonical",
                  type: "text",
                  label: "Canonical adresi",
                  admin: {
                    description:
                      "Boş bırakılırsa incelemenin kendi adresi kullanılır. Yalnız site içi yol (/kitaplar/...) veya https://www.sabandurali.com adresi girilebilir.",
                  },
                  validate: validateOptionalSiteCanonical,
                },
                {
                  name: "index",
                  type: "checkbox",
                  label: "Arama motorlarında indeksle",
                  defaultValue: false,
                  index: true,
                  required: true,
                },
                {
                  name: "follow",
                  type: "checkbox",
                  label: "Bağlantıları takip et",
                  defaultValue: true,
                  required: true,
                },
                {
                  name: "openGraphTitle",
                  type: "text",
                  label: "Sosyal paylaşım başlığı",
                },
                {
                  name: "openGraphDescription",
                  type: "textarea",
                  label: "Sosyal paylaşım açıklaması",
                },
                {
                  name: "openGraphImage",
                  type: "upload",
                  label: "Sosyal paylaşım görseli",
                  relationTo: "media",
                  filterOptions: imageMediaFilter,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidation.afterChange],
    afterDelete: [revalidation.afterDelete],
    afterRead: [hideReviewStatusFromPublicApi],
    beforeValidate: [normalizeAndValidateBook, validateBookPublication],
  },
  indexes: [
    {
      // Enforces in the database what `normalizeAndValidateBook` checks, so
      // two concurrent saves cannot create the same language and slug twice.
      fields: ["language", "slug"],
      unique: true,
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
};
