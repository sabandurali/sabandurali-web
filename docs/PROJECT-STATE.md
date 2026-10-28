# Şaban Durali Web — Project State

Last verified handoff: 2026-10-04

## A. Project identity

- Project and repository: `sabandurali-web` (`sabandurali/sabandurali-web`)
- Brand: Şaban Durali
- Main domain: `sabandurali.com`
- Canonical production URL: `https://www.sabandurali.com`
- Positioning: Gayrimenkul • Danışmanlık • Araştırma • Teknoloji
- Monogram: SD
- Design character: dark navy/near-black foundations, copper/bronze accents, and light paper tones. The implementation uses a navy/ink base (`#101D32`, `#07101C`, `#081220`) and a copper/gold accent family led by `#C9A24A`.

Do not put account identifiers, credentials, tokens, or other secret values in repository documentation.

## B. Current verified Git baseline

The final application baseline for the Istanbul district quality milestone is:

- Commit: `d60a5d6cd5b9ffa440c06b7ec551ecf1e92a3f33`
- Message: `improve: finalize Esenler district guide`

This commit is the final application baseline after the 39-district quality tour. It is a historical code/content baseline, not a promise that it will remain the repository's latest commit.

The current documentation HEAD is the later docs-only commit containing this handoff. Always distinguish **application baseline** from **current documentation HEAD**, and check `git log` before starting work.

## C. Tech stack

Versions are recorded only in `package.json` (ranges, `engines`), `package-lock.json` (the exact installed versions) and `.nvmrc`. This section names the parts and major versions without copying exact versions:

- Node.js 24 (`engines` and `.nvmrc`) with npm 11
- Next.js 16 (App Router, Turbopack) with the matching `eslint-config-next`
- React and React DOM 19
- Payload CMS 3: `payload`, `@payloadcms/next`, `@payloadcms/ui`, `@payloadcms/richtext-lexical`, `@payloadcms/db-postgres`, `@payloadcms/db-sqlite` and `@payloadcms/storage-vercel-blob`, all pinned exactly and upgraded together
- PostgreSQL in production, hosted on Neon (`pg`); SQLite for local Payload development
- Vercel deployment and Vercel Blob media storage
- TypeScript 5 (strict), Tailwind CSS 4, Sharp for image processing
- Tooling: ESLint, Prettier, `tsx` (node:test runner and scripts), `@electric-sql/pglite` (migration replay) and Playwright (local e2e checks with the installed Chrome)
- CI: GitHub Actions (`.github/workflows/ci.yml`) and Dependabot; GitHub repository hosting

## D. Production architecture

- The Next.js App Router frontend and Payload CMS live in one application.
- Payload admin and API routes are hosted by the Next.js application.
- Local development defaults to SQLite and local media.
- Production Payload uses PostgreSQL/Neon when `PAYLOAD_DATABASE=postgres` and Vercel Blob when `PAYLOAD_STORAGE=vercel-blob`.
- PostgreSQL schema push is disabled. Production schema changes require reviewed migrations.
- Blob storage applies only to the `media` collection and retains Payload validation, MIME restrictions, and the 10 MiB application limit.
- Production builds fail closed if a Payload-backed public source is selected without the required persistent database, storage, and secret configuration.

Public content source selection is controlled independently by:

- `PAGE_PUBLIC_SOURCE`
- `NAVIGATION_PUBLIC_SOURCE`
- `ARTICLE_PUBLIC_SOURCE`
- `BOOK_PUBLIC_SOURCE`
- `PHOTO_PUBLIC_SOURCE`

Each supports `static` or `payload`; unset values default to `static`. District guide retrieval is tied to `PAGE_PUBLIC_SOURCE=payload`. The exact production values are **environment-controlled — verify in Vercel before changing**. Never infer the live source mode from local defaults.

## E. Public site and routes

Important current routes include:

- Turkish home: `/`
- English home: `/en`
- Turkish articles: `/makaleler` and `/makaleler/[slug]`
- English articles: `/en/articles` and `/en/articles/[slug]`
- Turkish books: `/kitaplar` and `/kitaplar/[slug]`
- English books: `/en/books` and `/en/books/[slug]`
- Turkish photography: `/fotograflar` and `/fotograflar/[slug]`
- English photography: `/en/photography` and `/en/photography/[slug]`
- Contact: `/iletisim` and `/en/contact`
- Privacy: `/kvkk-aydinlatma-metni` and `/en/privacy-notice`
- Istanbul district directory: `/istanbul/ilceler`
- District guides: `/istanbul/ilceler/[district]`
- District news: `/istanbul/ilceler/[district]/haberler`
- Turkish standard CMS page route: `/[slug]`

The site also contains Turkish workspace, about, biography, feedback-linked navigation, research, real-estate, technology, photography, sales/negotiation, and learning surfaces. Verify the current `src/app` tree before adding or documenting routes; there is no general `/en/[slug]` route at this baseline.

## F. Admin and CMS

- Payload admin route: `/admin`
- Payload API route: `/api/[...slug]`
- Admin help route: `/admin/help`
- The help navigation link and custom view are configured in `src/payload.config.ts`.
- Help content is embedded in `src/components/admin/help/admin-help-guide.ts` and rendered as Markdown by `AdminHelpView.tsx`. That file is the single source: `YONETIM-PANELI-KULLANIM-KILAVUZU.md` is generated from it with `npm run generate:admin-guide`, and `scripts/admin-help/guide.test.ts` fails when the two differ or when the guide names a route that `src/app` does not have. The guide covers `DistrictGuides` in its section 8.
- The help view requires an authenticated user with admin access and `user.role === "admin"`; editors are redirected to the unauthorized route.
- `DistrictGuides` is a registered Payload collection alongside Users, Media, Categories, Articles, Books, Pages, PhotoCollections, Tags, and Photos. Navigation is a Payload global.

Do not merge the old Day 22 standalone-guide branch. Its Markdown guide is already semantically embedded in current main, and the current admin implementation is newer.

## G. Istanbul 39 districts — final state

The project milestone closed with the 39/39 district quality tour complete. The final production acceptance recorded at that milestone was:

- 39/39 HTTP 200
- 39/39 H1 plus the exact 14-section district presentation
- Broken images: 0
- Horizontal overflow: 0
- Private/raw leak: 0
- Migration during the final quality pass: 0
- Unexpected schema changes: 0

These are **final production acceptance at project milestone** results, not a perpetual live-state guarantee. Re-verify live state before future production changes.

No district rewrite is required by default. The district layer is in maintenance mode unless a concrete defect, newly verified fact, expired source, or deliberate design change is identified.

## H. District content contract

The public district page has an exact 14-section presentation. Sections 11 and 12 render only when published research articles or news for the district exist; the other twelve always render, in this order (`npm run e2e:districts:routes` checks the section ids):

1. Bir bakışta
2. İlçenin hikâyesi
3. İlçeyi okumak
4. Gündelik yaşam ve ulaşım
5. Mahalleler
6. Konut ve yapılaşma
7. Dönüşüm ve şehircilik
8. Görülecek ve fotoğraflanacak yerler
9. İlçeden kareler
10. İlçeyi özel kılanlar
11. Araştırmalar ve analizler
12. İlçeden haberler
13. Kaynaklar ve metodoloji
14. Son güncelleme

Content rules:

- Facts require supported, dated sources.
- Neighborhood lists must be verified.
- Sources must be public, attributable, section-scoped, and pass the content policy.
- Transportation claims require current support.
- `planningDevelopments` appears only when official, dated, current, and explicitly verified.
- Historical photos appear only when rights-safe and correctly attributed.
- `marketData` remains private unless it has a recent, supported market source and passes the freshness rules.
- Unverified/private research and import provenance must never leak through the public projection.

Editorial goal: **“İlçeyi geziyor hissi; rapor okuyor hissi değil.”**

The district experience combines Sini Kadıköy readability, Apple-like whitespace and restraint, and the SD identity. Preserve hierarchy, breathing room, source clarity, and a grounded local sense of place.

## I. Paper tones and design

`DistrictEditorialGuidePage.tsx` maintains a district-specific light paper-tone map. These backgrounds sit inside the broader navy/copper/ink brand system rather than replacing it.

Esenler's paper tone is fixed at:

```text
#F4F0E8
```

Preserve it unless a deliberate, approved design-system change covers all district tones.

## J. Esenler special history

Final verified Esenler facts:

- Population: `419878` (stored/displayed editorially as `419.878`)
- Population year: `2025`
- Area: `18.43 km²`
- Neighborhood count: `19`

Neighborhoods:

1. 15 Temmuz
2. Atışalanı
3. Birlik
4. Çifte Havuzlar
5. Davutpaşa
6. Fatih
7. Fevzi Çakmak
8. Kazım Karabekir
9. Kemer
10. Menderes
11. Mimar Sinan
12. Namık Kemal
13. Nine Hatun
14. Oruçreis
15. Şehitler
16. Tuna
17. Turgut Reis
18. Yavuz Selim
19. Yeşil Vadi

The final production importer is dedicated to Esenler. Before that importer, the production record was manual/unmanaged. The write was allowed only from an exact, user-approved manual baseline; there is no trust-on-first-use or runtime baseline-adoption path. The importer protects all 38 non-target districts, updates only Esenler, performs post-write verification, and leaves Esenler in an exact self-managed state.

Final provenance contract:

- Version: `6`
- Batch: `esenler-final-editorial-quality-2026`
- Application source commit: `d60a5d6cd5b9ffa440c06b7ec551ecf1e92a3f33`

The safety model matters more than internal hashes: exact approved baseline, deployment-bound source commit, one-target membership, conflict refusal, transaction boundaries, and read-only post-apply verification.

## K. Production import safety rules — DO NOT WEAKEN

1. Run a dry-run before every production write.
2. Require the exact membership and plan counts.
3. If any conflict exists, do not apply.
4. Do not apply until point-in-time recovery (PITR) is verified.
5. Approval must be bound to the deployed SHA.
6. Preserve non-target fingerprints and records.
7. Transactions must fail closed.
8. Perform read-only verification after apply.
9. The ideal post-apply district state is `0 update / 39 skip / 0 conflict`.
10. Never auto-adopt a runtime baseline.
11. Never weaken a gate merely to reach an expected count.
12. Never edit the production database manually.

Production imports must preserve document identity, creation/publication metadata where required, publication state, non-target content, and private-field boundaries.

The applied district importers, their cores and tests are kept for audit in `scripts/districts/archive/` (see its README). They have no npm scripts any more; running one is a production operation under the rules above.

### K.1 Production build gate

`npm run vercel:build` (`scripts/vercel-build.mjs`) is the Vercel build command. It fails closed:

- A Production build (`VERCEL_ENV=production`) must run on Vercel (`VERCEL=1`), from `main` (`VERCEL_GIT_COMMIT_REF=main`) and for a full 40-character `VERCEL_GIT_COMMIT_SHA`. Any other ref (for example `vercel deploy --prod` from a feature branch, a promoted Preview or a changed Production Branch setting) stops before the database is read. Keep the Vercel Production Branch locked to `main` and limit who can deploy to Production from the CLI.
- Production requires PostgreSQL, Vercel Blob, `DATABASE_URL`, `PAYLOAD_SECRET` and `BLOB_READ_WRITE_TOKEN`, checks the database fingerprint, and reads the applied migrations in a read-only transaction. An applied migration that the registry does not know, or applied migrations that are not a prefix of the registry, stop the build.
- The registry is what `payload migrate` applies: Payload runs every `.ts`/`.js` file in `src/migrations/` except `index.ts`, in file-name order, and does not read the index. `src/migrations/index.ts` (which the CI migration replay reads) must list exactly the same migrations in the same order; a migration file missing from the index, an index entry without a file, another order or a helper module in that folder stops the build with `migration_registry_invalid`, and `npm test` fails on it first. `npm run payload:migrate:create` keeps both in step.
- Previews and local builds never migrate. No Preview branch is designated for migrations any more, and a non-Production build whose `DATABASE_URL` resolves to the Production database refuses to build. The check compares host, port and database name; it also recognises the Production host in another letter case, with a trailing dot, and the Neon pooled or direct twin of the endpoint (`ep-…-pooler.…` and `ep-….…`). Any other alias of the same database (a custom DNS name or an IP address) is not recognised, so keep the Production `DATABASE_URL` scoped to the Production environment in Vercel. The Production check itself stays exact.
- The build-time district dry-run (`PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA`) is retired: if that variable is set, the build stops before reading anything. Remove it from the Production environment.
- The boolean `PRODUCTION_MIGRATION_APPROVED` and `PRODUCTION_PITR_CONFIRMED` no longer approve a migration; the build logs that it ignores them. Remove them from Vercel. (`PRODUCTION_PITR_CONFIRMED` is still read by the archived original importer, never by the build.)

### K.2 Approving a Production migration

A migration is approved for one commit and one exact set of migrations:

1. Merge the reviewed pull request (CI replays every migration in PGlite). The Production build of the merge commit stops with `Pending migrations detected; approval required.` and lists the pending migration names. Nothing is migrated.
2. Verify point-in-time recovery for the Production Neon branch: the restore window covers the current time and a restore target can be chosen. Note the time you checked.
3. Set three Production environment variables in Vercel, all for that deployment only:
   - `PRODUCTION_MIGRATION_APPROVED_SHA` — the full commit SHA of the deployment (`VERCEL_GIT_COMMIT_SHA`, 40 lowercase hex characters, no whitespace).
   - `PRODUCTION_MIGRATION_APPROVED_NAMES` — the pending migration names exactly as the failed build listed them, in order, separated by commas.
   - `PRODUCTION_MIGRATION_PITR_CONFIRMED_SHA` — the same commit SHA, set only after step 2. It is separate from every import PITR variable.
4. Redeploy that same deployment (a redeploy keeps the commit SHA). The gate checks the three values against the commit and the pending list, runs `payload:migrate`, reads the state again and builds only when nothing is pending.
5. Remove the three variables right after the deployment. They cannot approve another commit or another migration set, but they must not linger.
6. Check the live site and record the deployment, commit and migration names in the release notes.

A missing value, a SHA of another commit, a different or reordered name list, a migration that does not reach the registry head and an unreadable state all stop the build with an explicit reason.

### K.3 Failure reasons

Build failures name a category and, when there is one, a standard error code (PostgreSQL SQLSTATE or a Node.js/TLS code). Connection strings, hosts, users, passwords and driver messages are never printed. `Migration state could not be verified (<category>[, <code>]); stopping.`:

| Category | Meaning |
| --- | --- |
| `database_url_invalid`, `database_identity_incomplete` | `DATABASE_URL` is not a complete PostgreSQL URL |
| `database_identity_mismatch` | `DATABASE_URL` is not the Production database fingerprint (see K.4) |
| `connection_failed`, `tls_failed` | Network, DNS, timeout or TLS failure |
| `authentication_failed` | Wrong database credentials (`28P01`, `28000`) |
| `database_not_found` | The database name does not exist (`3D000`) |
| `connected_database_mismatch` | The server reports another database than the URL |
| `migration_table_missing` | `payload_migrations` does not exist |
| `migration_registry_invalid` | The migration files and `src/migrations/index.ts` disagree, or the list is empty or has duplicates |
| `migration_state_inconsistent` | The applied migrations do not match the committed registry |
| `query_failed`, `unknown_failed` | Any other database or unexpected error |

### K.4 Rotating the database fingerprint after a restore

The Production database identity (sha256 of `host:port/database`) is a reviewed constant, `productionDatabaseFingerprint` in `scripts/vercel-build.mjs`. A point-in-time restore onto a new endpoint, or a new database name, changes it, and every Production build then stops with `database_identity_mismatch`. To rotate it:

1. Confirm the new endpoint is the intended Production database.
2. Compute its fingerprint without printing the URL: `read -rs DATABASE_URL; export DATABASE_URL; node scripts/database-fingerprint.mjs; unset DATABASE_URL` (paste the value from Vercel; the script prints only the fingerprint).
3. Change `productionDatabaseFingerprint` in a reviewed pull request, merge it, and let the Production build verify the migration state against the restored database.

## L. Historical photos

Publication-safe rights are restricted to item-level evidence such as:

- Public Domain
- CC0
- CC BY
- CC BY-SA
- Explicit “No known restrictions on publication”

Do not use AI-generated, stock, random, non-commercial-only, no-derivatives, or ambiguously licensed images as historical evidence. Recheck the source page, rights statement, attribution, and current availability immediately before publication.

Historical imports set `featured: false`. Hero selection prefers an explicitly featured image and otherwise the first non-historical photo, so an imported historical image must remain gallery-only and must not automatically become the district hero.

## M. Local machine safety and backups

- The local Payload database is `.data/payload.db` (SQLite, Git-ignored). It is the owner's local working copy; do not delete it casually.
- Backup locations, checksums and any local file that holds production values are recorded in the owner's private operational notes, never in this public repository. Do not commit such files and never print their values into chat, logs, commands or documentation.
- `.env*` files other than `.env.example`, `.data/` and `.private-backups/` are Git-ignored and must stay so.
- `.vercel` contains regenerable linkage metadata and can be recreated with `vercel link`.

## N. Old branches

### `origin/codex/project-day-17-production-infra` and `origin/codex/project-day-19-photography`

- Both are merged and stale (August 2026). Their own copy of `scripts/vercel-build.mjs` still runs `payload:migrate` for its Preview build without a database identity or approval check.
- The gate on `main` no longer designates any Preview branch, but a push or a Redeploy of these branches builds their old script, and the `vercel.json` of `main` does not apply to their commits.
- Delete both remote branches (owner action; it needs push rights). Until then, do not push to them or redeploy their Previews.

### `origin/codex/project-day-20-full-site-prototype`

- Do not merge it.
- Its durable product decisions are archived in `docs/archive/PROJECT-DAY-20-PROTOTYPE-DECISIONS.md`.
- The user may choose to delete the remote branch later.

### `origin/codex/project-day-22-admin-help`

- It is obsolete compared with current main.
- Do not merge it.
- It may be deleted after handoff.
- Its standalone guide is already semantically embedded in current main.

## O. Files to read first

Start with these current paths:

1. `docs/PROJECT-STATE.md`
2. `docs/NEXT-STEPS.md`
3. `package.json`
4. `src/config/site.ts`
5. `src/payload.config.ts`
6. `src/lib/payloadInfrastructure.ts`
7. `data/districts/editorial.json`
8. `src/content/districts/district-registry.ts`
9. `src/content/districts/district-content-policy.ts`
10. `src/content/districts/district-guide-data-source.ts`
11. `src/content/districts/district-guide-projection.ts`
12. `src/components/districts/DistrictEditorialGuidePage.tsx`
13. `scripts/districts/`
14. `src/components/admin/help/`
15. `docs/archive/PROJECT-DAY-20-PROTOTYPE-DECISIONS.md`

Read only the task-relevant files after this orientation; verify current code and live state instead of treating this handoff as timeless.

## P. Non-negotiable rules

- Never commit secrets.
- Never invent district facts.
- Never weaken production gates.
- Never overwrite conflicts.
- Never change production before dry-run plus verified PITR.
- Preserve verified photos, source records, rights, and attribution.
- The user wants: think/design first, then develop.
- The site remains an active project; development is not abandoned.
- Do not rush new features.
- Get explicit user approval before production DB or CMS writes.
