import type { CollectionSlug, Payload, ServerProps, Where } from "payload";
import { getText, isRecord } from "@/content/guards";
import { formatAdminDateTime } from "../public-links/public-record";
import {
  findExpiringDistrictData,
  findMediaGaps,
  findMissingEnglish,
  type DashboardItem,
} from "./dashboard-data";

/** Collections with drafts, the field that names a record, and a label. */
const EDITORIAL_COLLECTIONS = [
  { label: "Makale", slug: "articles", titleField: "title" },
  { label: "Kitap incelemesi", slug: "books", titleField: "title" },
  { label: "Sayfa", slug: "pages", titleField: "title" },
  { label: "Fotoğraf", slug: "photos", titleField: "title" },
  { label: "İlçe rehberi", slug: "district-guides", titleField: "district" },
] as const satisfies ReadonlyArray<{
  label: string;
  slug: CollectionSlug;
  titleField: string;
}>;

type EditorialCollection = (typeof EDITORIAL_COLLECTIONS)[number];

const LIST_LIMIT = 5;
/** Enough for the whole archive today; the totals say if more exist. */
const SCAN_LIMIT = 500;

export type Row = DashboardItem & {
  collection: CollectionSlug;
  detail?: string;
  kind?: string;
};

export type Section = { rows: Row[]; total: number } | { error: true };

export type DashboardAccess = {
  payload: Payload;
  user: ServerProps["user"];
};

function getID(doc: unknown): string | null {
  if (!isRecord(doc)) return null;
  return typeof doc.id === "string" || typeof doc.id === "number"
    ? String(doc.id)
    : null;
}

async function safely(load: () => Promise<Section>): Promise<Section> {
  try {
    return await load();
  } catch {
    return { error: true };
  }
}

async function findEditorialRows(
  { payload, user }: DashboardAccess,
  where: (collection: EditorialCollection) => Where,
  detail: (doc: Record<string, unknown>) => string | undefined,
): Promise<Section> {
  const results = await Promise.all(
    EDITORIAL_COLLECTIONS.map(async (collection) => {
      const result = await payload.find({
        collection: collection.slug,
        depth: 0,
        draft: false,
        limit: LIST_LIMIT,
        locale: "tr",
        overrideAccess: false,
        sort: "-updatedAt",
        user,
        where: where(collection),
      });
      const rows = result.docs.flatMap((doc): Row[] => {
        const id = getID(doc);
        if (id === null || !isRecord(doc)) return [];
        return [
          {
            collection: collection.slug,
            detail: detail(doc),
            id,
            kind: collection.label,
            title: getText(doc[collection.titleField]) ?? "(başlıksız)",
          },
        ];
      });
      return { rows, total: result.totalDocs };
    }),
  );
  return {
    rows: results.flatMap((result) => result.rows),
    total: results.reduce((sum, result) => sum + result.total, 0),
  };
}

/**
 * Every list of the editor dashboard, read with the signed-in user's access
 * (`overrideAccess: false`). A list that cannot be read becomes `{ error }`.
 */
export async function loadDashboard(access: DashboardAccess, now: Date) {
  const { payload, user } = access;
  const nowIso = now.toISOString();

  const drafts = safely(() =>
    findEditorialRows(
      access,
      () => ({ _status: { equals: "draft" } }),
      () => undefined,
    ),
  );
  const scheduled = safely(() =>
    findEditorialRows(
      access,
      (): Where => ({
        and: [
          { _status: { equals: "published" } },
          { publishedAt: { greater_than: nowIso } },
        ],
      }),
      (doc) =>
        typeof doc.publishedAt === "string"
          ? (formatAdminDateTime(doc.publishedAt) ?? undefined)
          : undefined,
    ),
  );
  const missingEnglish = safely(async () => {
    const lists = await Promise.all(
      (["articles", "photos"] as const).map(async (collection) => {
        const result = await payload.find({
          collection,
          depth: 0,
          draft: false,
          limit: SCAN_LIMIT,
          locale: "all",
          overrideAccess: false,
          pagination: false,
          user,
          where: { _status: { equals: "published" } },
        });
        return findMissingEnglish(collection, result.docs).map((item): Row => ({
          ...item,
          collection,
          kind: collection === "articles" ? "Makale" : "Fotoğraf",
        }));
      }),
    );
    const rows = lists.flat();
    return { rows: rows.slice(0, LIST_LIMIT * 2), total: rows.length };
  });
  const media = safely(async () => {
    const result = await payload.find({
      collection: "media",
      depth: 0,
      limit: SCAN_LIMIT,
      overrideAccess: false,
      pagination: false,
      sort: "-updatedAt",
      user,
    });
    const gaps = findMediaGaps(result.docs).map((gap): Row => ({
      collection: "media",
      detail: [
        gap.missingAlt ? "alternatif metin yok" : null,
        gap.missingCredit ? "kaynak / telif boş" : null,
      ]
        .filter((part) => part !== null)
        .join(", "),
      id: gap.id,
      title: gap.title,
    }));
    return { rows: gaps.slice(0, LIST_LIMIT * 2), total: gaps.length };
  });
  const districts = safely(async () => {
    const result = await payload.find({
      collection: "district-guides",
      depth: 0,
      draft: false,
      limit: SCAN_LIMIT,
      locale: "tr",
      overrideAccess: false,
      pagination: false,
      user,
      where: { _status: { equals: "published" } },
    });
    const items = findExpiringDistrictData(result.docs, now.getTime()).map(
      (item): Row => ({
        collection: "district-guides",
        detail: `Değişecek bölümler: ${item.fields.join(", ")}`,
        id: item.id,
        title: item.title,
      }),
    );
    return { rows: items, total: items.length };
  });

  return {
    districts: await districts,
    drafts: await drafts,
    media: await media,
    missingEnglish: await missingEnglish,
    scheduled: await scheduled,
  };
}
