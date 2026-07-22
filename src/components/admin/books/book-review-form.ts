import { normalizeIsbn } from "@/content/books/helpers";
import type {
  BookCategory,
  BookReview,
  ReadingStatus,
  ReviewStatus,
} from "@/content/books/types";

export type BookReviewFormState = {
  title: string;
  slug: string;
  originalTitle: string;
  authorName: string;
  authorSlug: string;
  translator: string;
  publisher: string;
  publicationYear: string;
  pageCount: string;
  isbn10: string;
  isbn13: string;
  category: BookCategory | "";
  readingStatus: ReadingStatus;
  reviewStatus: ReviewStatus;
  startedAt: string;
  completedAt: string;
  coverImageSrc: string;
  coverImageAlt: string;
  summary: string;
  keyIdeaOneTitle: string;
  keyIdeaOneDescription: string;
  keyIdeaTwoTitle: string;
  keyIdeaTwoDescription: string;
  keyIdeaThreeTitle: string;
  keyIdeaThreeDescription: string;
  strengths: string;
  weaknesses: string;
  whoShouldRead: string;
  whoShouldNotRead: string;
  personalEvaluation: string;
  applicationNoteTitle: string;
  applicationNoteDescription: string;
  applicationNoteAction: string;
  quoteText: string;
  quotePage: string;
  quoteNote: string;
  rating: string;
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  seoIndex: boolean;
  seoFollow: boolean;
};

export const INITIAL_BOOK_REVIEW_FORM_STATE: BookReviewFormState = {
  title: "",
  slug: "",
  originalTitle: "",
  authorName: "",
  authorSlug: "",
  translator: "",
  publisher: "",
  publicationYear: "",
  pageCount: "",
  isbn10: "",
  isbn13: "",
  category: "",
  readingStatus: "planned",
  reviewStatus: "draft",
  startedAt: "",
  completedAt: "",
  coverImageSrc: "",
  coverImageAlt: "",
  summary: "",
  keyIdeaOneTitle: "",
  keyIdeaOneDescription: "",
  keyIdeaTwoTitle: "",
  keyIdeaTwoDescription: "",
  keyIdeaThreeTitle: "",
  keyIdeaThreeDescription: "",
  strengths: "",
  weaknesses: "",
  whoShouldRead: "",
  whoShouldNotRead: "",
  personalEvaluation: "",
  applicationNoteTitle: "",
  applicationNoteDescription: "",
  applicationNoteAction: "",
  quoteText: "",
  quotePage: "",
  quoteNote: "",
  rating: "",
  seoTitle: "",
  seoDescription: "",
  canonical: "",
  seoIndex: false,
  seoFollow: false,
};

type BookReviewMapperOptions = {
  createId?: () => string;
  now?: Date;
};

function emptyToNull(value: string): string | null {
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateInput(value: string): string | null {
  const normalized = value.trim();

  if (normalized === "") {
    return null;
  }

  const date = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function mapBookReviewFormStateToBookReview(
  state: BookReviewFormState,
  options: BookReviewMapperOptions = {},
): BookReview {
  const createId = options.createId ?? (() => crypto.randomUUID());
  const now = options.now ?? new Date();
  const timestamp = now.toISOString();
  const prototypeId = createId();
  const authorName = state.authorName.trim();
  const authorSlug = state.authorSlug.trim();
  const coverImageSrc = state.coverImageSrc.trim();
  const canonical = state.canonical.trim();
  const isbn10 = normalizeIsbn(state.isbn10);
  const isbn13 = normalizeIsbn(state.isbn13);
  const keyIdeaInputs = [
    [state.keyIdeaOneTitle, state.keyIdeaOneDescription],
    [state.keyIdeaTwoTitle, state.keyIdeaTwoDescription],
    [state.keyIdeaThreeTitle, state.keyIdeaThreeDescription],
  ] as const;
  const keyIdeas = keyIdeaInputs
    .map(([title, description], index) => ({
      id: `prototype-key-idea-${prototypeId}-${index + 1}`,
      title: title.trim(),
      description: description.trim(),
      order: index + 1,
    }))
    .filter((idea) => idea.title !== "" || idea.description !== "");
  const applicationNoteTitle = state.applicationNoteTitle.trim();
  const applicationNoteDescription = state.applicationNoteDescription.trim();
  const applicationNoteAction = state.applicationNoteAction.trim();
  const quoteText = state.quoteText.trim();
  const quoteNote = state.quoteNote.trim();
  const quotePage = parseOptionalNumber(state.quotePage);
  const hasApplicationNote =
    applicationNoteTitle !== "" ||
    applicationNoteDescription !== "" ||
    applicationNoteAction !== "";
  const hasQuote = quoteText !== "" || quoteNote !== "" || quotePage !== null;

  return {
    id: `prototype-book-review-${prototypeId}`,
    title: state.title.trim(),
    slug: state.slug.trim(),
    language: "tr",
    translationGroupId: null,
    translationStatus: "none",
    originalTitle: emptyToNull(state.originalTitle),
    authors:
      authorName === ""
        ? []
        : [
            {
              id: `prototype-book-author-${prototypeId}`,
              name: authorName,
              slug: authorSlug,
            },
          ],
    translator: emptyToNull(state.translator),
    publisher: emptyToNull(state.publisher),
    originalPublisher: null,
    publicationYear: parseOptionalNumber(state.publicationYear),
    originalPublicationYear: null,
    edition: null,
    isbn10: isbn10 === "" ? null : isbn10,
    isbn13: isbn13 === "" ? null : isbn13,
    pageCount: parseOptionalNumber(state.pageCount),
    coverImage:
      coverImageSrc === ""
        ? null
        : {
            src: coverImageSrc,
            alt: state.coverImageAlt.trim(),
            width: 1200,
            height: 1800,
          },
    category: state.category === "" ? null : state.category,
    tags: [],
    readingStatus: state.readingStatus,
    reviewStatus: state.reviewStatus,
    startedAt: parseDateInput(state.startedAt),
    completedAt: parseDateInput(state.completedAt),
    summary: state.summary.trim(),
    keyIdeas,
    strengths: splitLines(state.strengths),
    weaknesses: splitLines(state.weaknesses),
    whoShouldRead: splitLines(state.whoShouldRead),
    whoShouldNotRead: splitLines(state.whoShouldNotRead),
    applicationNotes: hasApplicationNote
      ? [
          {
            id: `prototype-application-note-${prototypeId}`,
            title: applicationNoteTitle,
            description: applicationNoteDescription,
            action: applicationNoteAction,
            order: 1,
          },
        ]
      : [],
    personalEvaluation: state.personalEvaluation.trim(),
    rating: parseOptionalNumber(state.rating),
    quotes: hasQuote
      ? [
          {
            id: `prototype-quote-${prototypeId}`,
            text: quoteText,
            ...(quotePage === null ? {} : { page: quotePage }),
            ...(quoteNote === "" ? {} : { note: quoteNote }),
            order: 1,
          },
        ]
      : [],
    relatedBookIds: [],
    authorId: null,
    editorId: null,
    featured: false,
    showOnHomepage: false,
    seo: {
      title: state.seoTitle.trim(),
      description: state.seoDescription.trim(),
      ...(canonical === "" ? {} : { canonical }),
      index: state.seoIndex,
      follow: state.seoFollow,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    publishedAt: state.reviewStatus === "published" ? timestamp : null,
  };
}
