/**
 * Workspace sections whose entry lives on another page. `next.config.ts`
 * serves these as permanent redirects, which run before the filesystem, so
 * the request never reaches the ISR `[section]` route.
 *
 * Why not `permanentRedirect()` in the page: Next 16 renders the redirect,
 * sets `location` on the response and also stores it in the cache entry's
 * headers, then appends the cached headers to the same response. The first,
 * uncached (x-nextjs-cache: MISS) 308 therefore carried two Location lines
 * (`node_modules/next/dist/build/templates/app-page-runtime.js`, the
 * `cachedData.headers` loop), and it also shipped a full HTML body.
 *
 * This module has no imports: `next.config.ts` and the Node e2e scripts
 * (native type stripping, no `@/` alias) load it directly.
 * `workspace-redirects.test.ts` keeps it equal to the workspace entries
 * whose `href` is not their own section path.
 */
export type WorkspaceSectionRedirect = {
  readonly source: string;
  readonly destination: string;
};

export const workspaceSectionRedirects: readonly WorkspaceSectionRedirect[] = [
  {
    source: "/gayrimenkul-ve-istanbul/ilce-rehberi",
    destination: "/istanbul/ilceler",
  },
  {
    source: "/kitaplar-ve-ogrenme/kitap-incelemeleri",
    destination: "/kitaplar",
  },
  { source: "/fotograf/galeriler", destination: "/fotograflar" },
];

/** The redirects in the shape `next.config.ts` `redirects()` returns. */
export function getWorkspaceSectionRedirects(): Array<{
  source: string;
  destination: string;
  permanent: true;
}> {
  return workspaceSectionRedirects.map(({ source, destination }) => ({
    source,
    destination,
    permanent: true,
  }));
}
