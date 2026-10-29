import {
  describeError,
  reportContentIssue,
  type ContentScope,
} from "@/content/content-log";

/**
 * Loads one supporting section of a page. A failing query must not take the
 * whole page down: the section gets its fallback, its name is added to
 * `unavailable` (so the page can say "temporarily unavailable" instead of
 * "nothing published") and the error is logged as one `[content]` line.
 * The page's main content is never loaded through this: it stays
 * fail-closed.
 */
export async function settleSection<T, N extends string>({
  scope,
  id,
  name,
  load,
  fallback,
  unavailable,
}: {
  scope: ContentScope;
  /** The page, for the log line: a district slug or a locale. */
  id: string;
  name: N;
  load: () => Promise<T>;
  fallback: T;
  unavailable: Set<N>;
}): Promise<T> {
  try {
    return await load();
  } catch (error) {
    unavailable.add(name);
    reportContentIssue(
      {
        scope,
        id,
        reason: `${name} could not be loaded; the section is shown as unavailable`,
        detail: describeError(error),
      },
      "error",
    );
    return fallback;
  }
}
