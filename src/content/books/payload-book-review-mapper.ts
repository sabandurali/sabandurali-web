import { getSafePayloadMediaPath } from "@/content/media-paths";
import { validateBookReview } from "@/content/books/schema";
import type {
  BookApplicationNote,
  BookAuthor,
  BookCoverImage,
  BookKeyIdea,
  BookQuote,
  BookReview,
  BookReviewLanguage,
  BookTag,
} from "@/content/books/types";
import { reportContentIssue } from "@/content/content-log";
import {
  getFiniteNumber,
  getRelationshipID,
  getText,
  isRecord,
} from "@/content/guards";
import { mapMediaImage } from "@/content/media";
import type { Book as PayloadBook } from "@/payload-types";

function mapCoverImage(
  value: PayloadBook["coverImage"],
  localizedAlt: unknown,
  title: string,
  language: BookReviewLanguage,
): BookCoverImage | null {
  const image = mapMediaImage(value, {
    alt: localizedAlt,
    fallbackAlt: title,
    locale: language,
  });

  // Book covers need intrinsic dimensions for the layout.
  if (image === null || image.width === null || image.height === null) {
    return null;
  }

  return {
    src: image.src,
    alt: image.alt,
    ...(image.altLanguage === language
      ? {}
      : { altLanguage: image.altLanguage }),
    ...(image.caption === null ? {} : { caption: image.caption }),
    ...(image.credit === null
      ? {}
      : {
          source: image.credit,
          copyrightOwner: image.credit,
          credit: image.credit,
        }),
    width: image.width,
    height: image.height,
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
    const name = getText(value.name);
    const slug = getText(value.slug);

    if (name === null || slug === null) return [];

    return [
      {
        id: getText(value.id) ?? `${bookID}-author-${index + 1}`,
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
    const alias = getText(entry.value);
    return alias === null ? [] : [alias];
  });
}

function mapTags(values: PayloadBook["tags"], bookID: string): BookTag[] {
  if (!Array.isArray(values)) return [];

  return values.flatMap((value, index) => {
    const slug = getText(value.slug);
    const labelTr = getText(value.labelTr);
    const labelEn = getText(value.labelEn);

    if (slug === null || labelTr === null || labelEn === null) return [];

    return [
      {
        id: getText(value.id) ?? `${bookID}-tag-${index + 1}`,
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
    const title = getText(value.title);
    const description = getText(value.description);
    const order = getFiniteNumber(value.order);

    if (title === null || description === null || order === null) return [];

    return [
      {
        id: getText(value.id) ?? `${bookID}-idea-${index + 1}`,
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
    const value = getText(entry.value);
    return value === null ? [] : [value];
  });
}

function mapApplicationNotes(
  values: PayloadBook["applicationNotes"],
  bookID: string,
): BookApplicationNote[] {
  if (!Array.isArray(values)) return [];

  return values.flatMap((value, index) => {
    const title = getText(value.title);
    const description = getText(value.description);
    const action = getText(value.action);
    const order = getFiniteNumber(value.order);

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
        id: getText(value.id) ?? `${bookID}-note-${index + 1}`,
        title,
        description,
        action,
        order,
      },
    ];
  });
}

function mapQuotes(values: PayloadBook["quotes"], bookID: string): BookQuote[] {
  if (!Array.isArray(values)) return [];

  return values.flatMap((value, index) => {
    const text = getText(value.text);
    const order = getFiniteNumber(value.order);

    if (text === null || order === null) return [];

    const page = getFiniteNumber(value.page);
    const note = getText(value.note);

    return [
      {
        id: getText(value.id) ?? `${bookID}-quote-${index + 1}`,
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

function reportInvalidBookReview(bookID: string, reason: string): void {
  reportContentIssue({ scope: "books", id: bookID, reason });
}

export function mapPayloadBookReview(
  value: PayloadBook,
  now: Date = new Date(),
  relatedTranslationID?: string | null,
): BookReview | null {
  const id = getText(value.id);
  const title = getText(value.title);
  const slug = getText(value.slug);
  const summary = getText(value.summary);
  const personalEvaluation = getText(value.personalEvaluation);
  const seoTitle = getText(value.seo?.title);
  const seoDescription = getText(value.seo?.description);

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
    value.language,
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
    getText(translationDocument.updatedAt) === null
      ? {}
      : {
          translationSourceUpdatedAt:
            getText(translationDocument.updatedAt) ?? undefined,
        }),
    originalTitle: getText(value.originalTitle),
    authors: mapAuthors(value.authors, id),
    translator: getText(value.translator),
    publisher: getText(value.publisher),
    originalPublisher: getText(value.originalPublisher),
    publicationYear: getFiniteNumber(value.publicationYear),
    originalPublicationYear: getFiniteNumber(value.originalPublicationYear),
    edition: getText(value.edition),
    isbn10: getText(value.isbn10),
    isbn13: getText(value.isbn13),
    pageCount: getFiniteNumber(value.pageCount),
    coverImage,
    category: value.category ?? null,
    tags: mapTags(value.tags, id),
    readingStatus: value.readingStatus,
    reviewStatus: value.reviewStatus,
    startedAt: getText(value.startedAt),
    completedAt: getText(value.completedAt),
    summary,
    keyIdeas: mapKeyIdeas(value.keyIdeas, id),
    strengths: mapTextList(value.strengths),
    weaknesses: mapTextList(value.weaknesses),
    whoShouldRead: mapTextList(value.whoShouldRead),
    whoShouldNotRead: mapTextList(value.whoShouldNotRead),
    applicationNotes: mapApplicationNotes(value.applicationNotes, id),
    personalEvaluation,
    rating: getFiniteNumber(value.rating),
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
      ...(getText(value.seo.canonical) === null
        ? {}
        : { canonical: getText(value.seo.canonical) ?? undefined }),
      index: value.seo.index === true,
      follow: value.seo.follow === true,
      ...(getText(value.seo.openGraphTitle) === null
        ? {}
        : {
            openGraphTitle: getText(value.seo.openGraphTitle) ?? undefined,
          }),
      ...(getText(value.seo.openGraphDescription) === null
        ? {}
        : {
            openGraphDescription:
              getText(value.seo.openGraphDescription) ?? undefined,
          }),
      ...(mapMediaPath(value.seo.openGraphImage) === undefined
        ? {}
        : { openGraphImage: mapMediaPath(value.seo.openGraphImage) }),
    },
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    publishedAt: getText(value.publishedAt),
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
