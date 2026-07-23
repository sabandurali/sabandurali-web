import { getSafePayloadMediaPath } from "@/content/articles/article-images";
import { validateBookReview } from "@/content/books/schema";
import type {
  BookApplicationNote,
  BookAuthor,
  BookCoverImage,
  BookKeyIdea,
  BookQuote,
  BookReview,
  BookTag,
} from "@/content/books/types";
import type {
  Book as PayloadBook,
  Media as PayloadMedia,
} from "@/payload-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRequiredText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function getOptionalText(value: unknown): string | null {
  return getRequiredText(value);
}

function getRelationshipID(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (isRecord(value) && typeof value.id === "string") return value.id;
  return null;
}

function getOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getPositiveDimension(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
    ? value
    : null;
}

function mapCoverImage(
  value: PayloadBook["coverImage"],
  localizedAlt: unknown,
  title: string,
): BookCoverImage | null {
  if (!isRecord(value)) return null;

  const media = value as PayloadMedia;
  const mimeType = getRequiredText(media.mimeType);
  const src = getSafePayloadMediaPath(media.url);
  const width = getPositiveDimension(media.width);
  const height = getPositiveDimension(media.height);

  if (
    mimeType === null ||
    !mimeType.startsWith("image/") ||
    src === null ||
    width === null ||
    height === null
  ) {
    return null;
  }

  return {
    src,
    alt:
      getRequiredText(localizedAlt) ??
      getRequiredText(media.alt) ??
      title,
    ...(getOptionalText(media.description) === null
      ? {}
      : { caption: getOptionalText(media.description) ?? undefined }),
    ...(getOptionalText(media.sourceCopyright) === null
      ? {}
      : {
          source: getOptionalText(media.sourceCopyright) ?? undefined,
          copyrightOwner:
            getOptionalText(media.sourceCopyright) ?? undefined,
        }),
    width,
    height,
  };
}

function mapMediaPath(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  return getSafePayloadMediaPath(value.url) ?? undefined;
}

function mapAuthors(
  values: PayloadBook["authors"],
  bookID: string,
): BookAuthor[] {
  if (!Array.isArray(values)) return [];

  return values.flatMap((value, index) => {
    const name = getRequiredText(value.name);
    const slug = getRequiredText(value.slug);

    if (name === null || slug === null) return [];

    return [
      {
        id: getRequiredText(value.id) ?? `${bookID}-author-${index + 1}`,
        name,
        slug,
      },
    ];
  });
}

function mapAliases(
  value: NonNullable<PayloadBook["tags"]>[number]["aliases"],
): string[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    const alias = getRequiredText(entry.value);
    return alias === null ? [] : [alias];
  });
}

function mapTags(
  values: PayloadBook["tags"],
  bookID: string,
): BookTag[] {
  if (!Array.isArray(values)) return [];

  return values.flatMap((value, index) => {
    const slug = getRequiredText(value.slug);
    const labelTr = getRequiredText(value.labelTr);
    const labelEn = getRequiredText(value.labelEn);

    if (slug === null || labelTr === null || labelEn === null) return [];

    return [
      {
        id: getRequiredText(value.id) ?? `${bookID}-tag-${index + 1}`,
        slug,
        labelTr,
        labelEn,
        aliases: mapAliases(value.aliases),
      },
    ];
  });
}

function mapKeyIdeas(
  values: PayloadBook["keyIdeas"],
  bookID: string,
): BookKeyIdea[] {
  if (!Array.isArray(values)) return [];

  return values.flatMap((value, index) => {
    const title = getRequiredText(value.title);
    const description = getRequiredText(value.description);
    const order = getOptionalNumber(value.order);

    if (title === null || description === null || order === null) return [];

    return [
      {
        id: getRequiredText(value.id) ?? `${bookID}-idea-${index + 1}`,
        title,
        description,
        order,
      },
    ];
  });
}

function mapTextList(
  values:
    | PayloadBook["strengths"]
    | PayloadBook["weaknesses"]
    | PayloadBook["whoShouldRead"]
    | PayloadBook["whoShouldNotRead"],
): string[] {
  if (!Array.isArray(values)) return [];

  return values.flatMap((entry) => {
    const value = getRequiredText(entry.value);
    return value === null ? [] : [value];
  });
}

function mapApplicationNotes(
  values: PayloadBook["applicationNotes"],
  bookID: string,
): BookApplicationNote[] {
  if (!Array.isArray(values)) return [];

  return values.flatMap((value, index) => {
    const title = getRequiredText(value.title);
    const description = getRequiredText(value.description);
    const action = getRequiredText(value.action);
    const order = getOptionalNumber(value.order);

    if (
      title === null ||
      description === null ||
      action === null ||
      order === null
    ) {
      return [];
    }

    return [
      {
        id: getRequiredText(value.id) ?? `${bookID}-note-${index + 1}`,
        title,
        description,
        action,
        order,
      },
    ];
  });
}

function mapQuotes(
  values: PayloadBook["quotes"],
  bookID: string,
): BookQuote[] {
  if (!Array.isArray(values)) return [];

  return values.flatMap((value, index) => {
    const text = getRequiredText(value.text);
    const order = getOptionalNumber(value.order);

    if (text === null || order === null) return [];

    const page = getOptionalNumber(value.page);
    const note = getOptionalText(value.note);

    return [
      {
        id: getRequiredText(value.id) ?? `${bookID}-quote-${index + 1}`,
        text,
        ...(page === null ? {} : { page }),
        ...(note === null ? {} : { note }),
        order,
      },
    ];
  });
}

function createTranslationGroupID(
  bookID: string,
  translationID: string | null,
): string | null {
  if (translationID === null) return null;
  return `payload-books:${[bookID, translationID].sort().join(":")}`;
}

function reportInvalidBookReview(
  bookID: string,
  reason: string,
): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[public-books] Payload book review ${bookID} was skipped: ${reason}`,
    );
  }
}

export function mapPayloadBookReview(
  value: PayloadBook,
  now: Date = new Date(),
  relatedTranslationID?: string | null,
): BookReview | null {
  const id = getRequiredText(value.id);
  const title = getRequiredText(value.title);
  const slug = getRequiredText(value.slug);
  const summary = getRequiredText(value.summary);
  const personalEvaluation = getRequiredText(value.personalEvaluation);
  const seoTitle = getRequiredText(value.seo?.title);
  const seoDescription = getRequiredText(value.seo?.description);

  if (id === null) return null;

  if (
    title === null ||
    slug === null ||
    summary === null ||
    personalEvaluation === null ||
    seoTitle === null ||
    seoDescription === null
  ) {
    reportInvalidBookReview(id, "required public fields are missing");
    return null;
  }

  const translationID =
    relatedTranslationID === undefined
      ? getRelationshipID(value.translation)
      : relatedTranslationID;
  const coverImage = mapCoverImage(
    value.coverImage,
    value.coverImageAlt,
    title,
  );
  const translationDocument = isRecord(value.translation)
    ? value.translation
    : null;
  const bookReview: BookReview = {
    id,
    title,
    slug,
    language: value.language,
    translationGroupId: createTranslationGroupID(id, translationID),
    translationStatus: value.translationStatus,
    ...(translationID === null
      ? {}
      : { translationSourceBookReviewId: translationID }),
    ...(translationDocument === null ||
    getRequiredText(translationDocument.updatedAt) === null
      ? {}
      : {
          translationSourceUpdatedAt:
            getRequiredText(translationDocument.updatedAt) ?? undefined,
        }),
    originalTitle: getOptionalText(value.originalTitle),
    authors: mapAuthors(value.authors, id),
    translator: getOptionalText(value.translator),
    publisher: getOptionalText(value.publisher),
    originalPublisher: getOptionalText(value.originalPublisher),
    publicationYear: getOptionalNumber(value.publicationYear),
    originalPublicationYear: getOptionalNumber(
      value.originalPublicationYear,
    ),
    edition: getOptionalText(value.edition),
    isbn10: getOptionalText(value.isbn10),
    isbn13: getOptionalText(value.isbn13),
    pageCount: getOptionalNumber(value.pageCount),
    coverImage,
    category: value.category ?? null,
    tags: mapTags(value.tags, id),
    readingStatus: value.readingStatus,
    reviewStatus: value.reviewStatus,
    startedAt: getOptionalText(value.startedAt),
    completedAt: getOptionalText(value.completedAt),
    summary,
    keyIdeas: mapKeyIdeas(value.keyIdeas, id),
    strengths: mapTextList(value.strengths),
    weaknesses: mapTextList(value.weaknesses),
    whoShouldRead: mapTextList(value.whoShouldRead),
    whoShouldNotRead: mapTextList(value.whoShouldNotRead),
    applicationNotes: mapApplicationNotes(value.applicationNotes, id),
    personalEvaluation,
    rating: getOptionalNumber(value.rating),
    quotes: mapQuotes(value.quotes, id),
    relatedBookIds: Array.isArray(value.relatedBooks)
      ? value.relatedBooks.flatMap((entry) => {
          const relationshipID = getRelationshipID(entry);
          return relationshipID === null ? [] : [relationshipID];
        })
      : [],
    authorId: getRelationshipID(value.authorId),
    editorId: getRelationshipID(value.editorId),
    featured: value.featured === true,
    showOnHomepage: value.showOnHomepage === true,
    seo: {
      title: seoTitle,
      description: seoDescription,
      ...(getOptionalText(value.seo.canonical) === null
        ? {}
        : { canonical: getOptionalText(value.seo.canonical) ?? undefined }),
      index: value.seo.index === true,
      follow: value.seo.follow === true,
      ...(getOptionalText(value.seo.openGraphTitle) === null
        ? {}
        : {
            openGraphTitle:
              getOptionalText(value.seo.openGraphTitle) ?? undefined,
          }),
      ...(getOptionalText(value.seo.openGraphDescription) === null
        ? {}
        : {
            openGraphDescription:
              getOptionalText(value.seo.openGraphDescription) ?? undefined,
          }),
      ...(mapMediaPath(value.seo.openGraphImage) === undefined
        ? {}
        : { openGraphImage: mapMediaPath(value.seo.openGraphImage) }),
    },
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    publishedAt: getOptionalText(value.publishedAt),
  };
  const validation = validateBookReview(bookReview);

  if (!validation.valid) {
    reportInvalidBookReview(
      id,
      validation.errors.map((error) => error.code).join(", "),
    );
    return null;
  }

  const publishedAt =
    bookReview.publishedAt === null
      ? Number.NaN
      : Date.parse(bookReview.publishedAt);

  if (
    bookReview.reviewStatus !== "published" ||
    !bookReview.seo.index ||
    !Number.isFinite(publishedAt) ||
    publishedAt > now.getTime()
  ) {
    reportInvalidBookReview(id, "public visibility conditions are not met");
    return null;
  }

  return bookReview;
}
