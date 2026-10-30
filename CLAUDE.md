@AGENTS.md

# sabandurali-web

Personal research and knowledge platform of Şaban Durali — https://www.sabandurali.com.
Turkish first, English second. The owner writes in Turkish: answer in Turkish, keep code,
identifiers and commit messages in English.

## Stack

- Next.js 16 App Router (Turbopack) · React 19 · strict TypeScript · Tailwind CSS 4
- Payload CMS 3 inside the same app: admin at `/admin`, REST at `/api/*` (no GraphQL route)
- Database: SQLite locally (`.data/payload.db`), PostgreSQL on Neon in production
- Media: `public/media` locally, Vercel Blob in production
- Hosting: Vercel through Git. `main` is production; every other pushed branch gets a Preview deployment
  (except the branches disabled in `vercel.json`)

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server (SQLite + local media) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over the tracked sources |
| `npm test` | `node:test` suites (`scripts/**` and `src/**`, `*.test.ts` via tsx and `*.test.mjs` via node), the district content acceptance check and a PGlite replay of every migration |
| `npm run check` | typecheck + lint + format:check + test + build — must pass before every commit you hand over |
| `npm run format` / `format:check` | Prettier write / verify |
| `npm run generate:admin-guide` | Regenerate `YONETIM-PANELI-KULLANIM-KILAVUZU.md` after editing `admin-help-guide.ts` (a test fails when they differ) |
| `npm run generate:types` / `generate:importmap` | Regenerate `src/payload-types.ts` / the admin import map after a schema or admin component change |
| `npm run e2e:headers -- <url>` | Security header check against a local production server |
| `npm run e2e:districts:cms` | District guide CMS rules on a temporary SQLite database |
| `npm run e2e:districts:routes` / `e2e:content-trust` | Playwright (routes) and fetch (content trust) checks against a local server at `DISTRICT_TEST_URL` (output in `DISTRICT_TEST_OUTPUT`) |
| `npm run report:districts:freshness` | Which reviewed district content is withheld today or within 30 days (wall clock; scheduled workflow, not part of `npm test`) |
| `npm run e2e:a11y` | Definition of Done on every public route type: axe WCAG 2.2 AA, no horizontal scroll at 390/820/1440 px, skip link, focus indicator, header menu by keyboard, reduced motion; local server at `A11Y_TEST_URL` (output in `A11Y_TEST_OUTPUT`) |

CI runs `e2e:content-trust`, `e2e:headers`, `e2e:districts:routes` and `e2e:a11y` after the build against `next start` on
`127.0.0.1:3101`. Locally: `npm run build && npm run start -- --hostname 127.0.0.1 --port 3101`, then the same
scripts with `DISTRICT_TEST_URL=http://127.0.0.1:3101` (`e2e:a11y` defaults to that origin), in any order (the legacy workspace redirects come from
`next.config.ts`, so they are never an ISR cache entry).

The CI environment for local builds and tests (no `.env.local` needed) is the one in
`.github/workflows/ci.yml`: `PAYLOAD_DATABASE=sqlite PAYLOAD_STORAGE=local DATABASE_URL=file:./.data/ci.db`,
a dummy `PAYLOAD_SECRET` and every `*_PUBLIC_SOURCE=static`.

Never run a script whose name contains `production`, `:apply` or `migrate` unless the owner asked for that
exact operation in the current conversation. `*:dry-run` and `*:verify` scripts read production — they also
need the owner's request.

## Architecture

- Routes: `src/app/(tr)` Turkish (no prefix, default), `src/app/(en)/en` English, `src/app/(payload)` admin and
  API. Each route group owns its root layout; `global-not-found.tsx` handles unmatched URLs.
- Content layer, one folder per type in `src/content/<type>/`:
  `*-data-source.ts` (chooses `static` or `payload` from `<TYPE>_PUBLIC_SOURCE`) →
  `payload-*-repository.ts` (Payload Local API, always `overrideAccess: false` and `draft: false`) →
  `payload-*-mapper.ts` (pure, tested) → `public-types.ts`. Components only consume public types.
  Two types differ on purpose: `districts` has no mapper, the repository calls the allowlist projection
  `district-guide-projection.ts` (input typed `unknown`); `books` maps to the internal `BookReview` model
  (validated with `schema.ts`) and projects it to `PublicBookReview` or, for lists, `PublicBookReviewSummary`
  at the repository boundary, so no caller sees editorial fields.
  The one exception is the `Navigation` global: it is closed to anonymous reads so the REST API never exposes
  it, so its repository reads the published version with `overrideAccess: true` and the mapper passes on only
  published, active and safe links. `src/content/content-access.test.ts` keeps it the only exception.
- Payload: collections in `src/collections`, the `Navigation` global in `src/globals`, access rules in
  `src/lib/payloadAccess.ts`, delete guards in `src/lib/payloadDeleteGuards.ts`, fail-closed infrastructure
  checks in `src/lib/payloadInfrastructure.ts`, cache revalidation in `src/lib/revalidation.ts`.
- Districts: `src/content/districts/` (registry, content policy, public projection) and
  `data/districts/editorial.json`. The public guide follows the fixed section contract in
  `docs/PROJECT-STATE.md` §H, and the projection must never expose research, provenance or market data
  that the content policy rejects.
- Design system "İstanbul Atlası": tokens in `src/app/globals.css` (`@theme`), fonts in
  `src/app/fonts.ts`, primitives in `src/components/ui/`. Read `docs/DESIGN-SYSTEM.md` before UI work.

## Non-negotiable rules

1. **Secrets.** Never open or print `.env.local`, `.env.production*`, anything in `.private-backups/` or
   `.data/`, and never stage them. `ml-env/` is an unrelated Python venv — ignore it.
2. **Production.** No production database or CMS writes, migrations, environment-variable changes or
   production deploys without the owner's explicit approval in the current conversation. The production
   import rules in `docs/PROJECT-STATE.md` §K are mandatory: dry-run first, exact counts, PITR verified,
   SHA-bound approval, read-only verification afterwards. Never weaken a gate to make a count match.
3. **Facts.** Never invent district facts, statistics, articles, testimonials or image credits. Every
   number and date on a district page needs a dated source that passes `district-content-policy.ts`.
   Missing content gets an explicit empty state, never filler.
4. **Schema.** Postgres `push` is disabled in production. Any collection, field or index change needs a
   generated, reviewed migration in `src/migrations/`. Never apply migrations to production yourself.
5. **Access.** Public reads keep `overrideAccess: false` (the `Navigation` global above is the only exception). New private fields get field-level `access.read`
   and must stay out of the public projection. The anonymous REST API is part of the public surface.
6. **Git.** Work on a branch, keep commits focused, and open a pull request. Never push to `main` and never
   force-push. Pushing a branch creates a Preview deployment — ask before the first push of a branch.
7. **Next.js 16** differs from your training data: check `node_modules/next/dist/docs/` before using or
   "fixing" a framework API (see `AGENTS.md`).

## Definition of done

- `npm run check` passes locally and in CI (`.github/workflows/ci.yml`).
- New or changed logic has `node:test` coverage (`*.test.ts` next to the module or under `scripts/`).
  Access rules, mappers, the sitemap and delete guards are always covered.
- UI meets WCAG 2.2 AA: text contrast ≥ 4.5:1 (≥ 3:1 at 24 px+), a visible focus ring on every background,
  full keyboard navigation, a skip link, and `prefers-reduced-motion` respected. It works at 390, 820 and
  1440 px with no horizontal scroll and renders Turkish glyphs (ı İ ş ğ ç ö ü) correctly.
- Every image shows its credit and licence when the source requires attribution.
- No `any`, no unchecked `as` casts and no non-null `!` on CMS data. Dates are formatted in
  `Europe/Istanbul`.
- Metadata: canonical, hreflang pairs, Open Graph and Twitter tags on every indexable page; JSON-LD stays
  valid.

## Further reading

- `docs/PROJECT-STATE.md` — durable handoff, district contract, production rules
- `docs/LOCAL-DEVELOPMENT.md` — local setup
- `docs/DESIGN-SYSTEM.md` — "İstanbul Atlası" design system
- `YONETIM-PANELI-KULLANIM-KILAVUZU.md` — admin guide (its source of truth is
  `src/components/admin/help/admin-help-guide.ts`)
