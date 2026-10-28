# sabandurali-web

Personal research and knowledge platform of Şaban Durali:
[www.sabandurali.com](https://www.sabandurali.com). Turkish is the primary
language and English the second. The site covers real estate and Istanbul's
39 district guides, research, technology, books, photography and articles, and
is edited through an embedded Payload CMS.

## Stack

| Area      | Technology                                                                                     |
| --------- | ---------------------------------------------------------------------------------------------- |
| Runtime   | Node.js 24 (`>=24.22.1 <25`, see `.nvmrc`), npm 11                                             |
| Framework | Next.js 16.4.2 (App Router, Turbopack), React 19.2.9, strict TypeScript 5                      |
| Styling   | Tailwind CSS 4                                                                                 |
| CMS       | Payload 3.92.1 in the same app: admin at `/admin`, REST API at `/api`, Lexical rich text       |
| Database  | SQLite locally (`.data/payload.db`), PostgreSQL on Neon in production                          |
| Media     | `public/media` locally, Vercel Blob in production; images processed with Sharp 0.35.5          |
| Hosting   | Vercel through the GitHub integration                                                          |
| Quality   | ESLint 9, Prettier 3.9.10, `node:test` via tsx, PGlite migration replay, GitHub Actions, Dependabot |

`package.json` and `package-lock.json` are the source of truth for versions.
Payload packages are pinned exactly and must be upgraded together.

## Quick start

```sh
nvm use                       # Node 24 from .nvmrc (24.22.1 or newer)
npm ci
cp .env.example .env.local    # first setup only; never overwrite an existing .env.local
# then set a local-only PAYLOAD_SECRET in .env.local
mkdir -p .data public/media
npm run dev -- --hostname 127.0.0.1
```

Open the site at <http://127.0.0.1:3000> and the CMS at
<http://127.0.0.1:3000/admin>. `.env.example` already holds working local
defaults: SQLite, local media and static public content. The full setup guide,
including how to generate the secret, is
[docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) (Turkish).

## Commands

| Command                              | Purpose                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                        | Local development server (SQLite, local media, schema push in development only)                                              |
| `npm run build` / `npm start`        | Production build and server                                                                                                   |
| `npm run typecheck`                  | `tsc --noEmit`                                                                                                                |
| `npm run lint`                       | ESLint; warnings fail                                                                                                         |
| `npm run format` / `format:check`    | Prettier write / verify                                                                                                       |
| `npm test`                           | All `*.test.ts` and `*.test.mjs` suites, the district content acceptance check and a replay of every migration into in-memory PGlite |
| `npm run check`                      | typecheck, lint, format:check, test and build: must pass before every pull request                                           |
| `npm run generate:types`             | Regenerate `src/payload-types.ts` after a collection or field change                                                          |
| `npm run generate:importmap`         | Regenerate the admin import map after adding a custom admin component                                                         |
| `npm run generate:admin-guide`       | Regenerate `YONETIM-PANELI-KULLANIM-KILAVUZU.md` from `src/components/admin/help/admin-help-guide.ts`                          |
| `npm run e2e:headers -- <local-url>` | Security header check against a local production server                                                                      |
| `npm run e2e:districts:cms`          | District guide CMS rules on a temporary SQLite database it imports and removes itself (or pass an isolated `/tmp/istanbul-39-*` database) |
| `npm run e2e:districts:routes`       | Playwright acceptance of the 39 district pages with the local Chrome against a local server at `DISTRICT_TEST_URL`            |
| `npm run e2e:content-trust`          | Metadata, share image and route regression check against a local server at `DISTRICT_TEST_URL`; JSON to `DISTRICT_TEST_OUTPUT` |
| `npm run report:districts:content`   | Run the content acceptance check and write its JSON result to the ignored `reports/istanbul-39/content-acceptance.json`        |

Scripts whose names contain `production`, `migrate`, `:apply`, `:dry-run` or
`:verify`, plus `vercel:build`, touch the production database or prepare
changes for it. Run them only for an operation the owner approved, as described
in [CLAUDE.md](CLAUDE.md) and [docs/PROJECT-STATE.md](docs/PROJECT-STATE.md) §K.

## Architecture

- **Routes.** `src/app/(tr)` serves Turkish without a prefix, `src/app/(en)/en`
  serves English, and `src/app/(payload)` hosts the admin and the REST API. Each
  route group owns its root layout; `global-not-found.tsx` handles unmatched
  URLs.
- **Content layer.** Each content type in `src/content/<type>/` chooses between
  static data and Payload through `<TYPE>_PUBLIC_SOURCE`. Payload repositories
  read with the Local API (`overrideAccess: false`, no drafts), pure mappers
  turn documents into public types, and components only consume those types.
- **CMS.** Collections live in `src/collections`, the `Navigation` global in
  `src/globals`, access rules in `src/lib/payloadAccess.ts`, delete guards in
  `src/lib/payloadDeleteGuards.ts` and fail-closed infrastructure checks in
  `src/lib/payloadInfrastructure.ts`.
- **Districts.** `src/content/districts/` (registry, content policy, public
  projection) and `data/districts/` follow the fixed district contract in
  [docs/PROJECT-STATE.md](docs/PROJECT-STATE.md) §H. The projection never
  exposes research, provenance or market data that the content policy rejects.
- **Security headers.** `src/lib/securityHeaders.ts` defines the CSP,
  HSTS, frame, MIME sniffing, referrer and permissions headers sent on every
  route.

[CLAUDE.md](CLAUDE.md) holds the full architecture notes, the project rules
and the definition of done.

## Deployment and production safety

- Vercel deploys `main` to production and every other pushed branch to a
  Preview, except the branches disabled in `vercel.json`.
- The build command is `npm run vercel:build` (`scripts/vercel-build.mjs`).
  A Production build runs only from `main`. It requires PostgreSQL, Vercel
  Blob and the server secrets, checks the database fingerprint and stops when
  migrations are pending unless an approval bound to the commit SHA, the exact
  pending migration names and a point-in-time recovery confirmation for the
  same commit is set ([docs/PROJECT-STATE.md](docs/PROJECT-STATE.md) §K).
  Previews and local builds never migrate and refuse to build against the
  Production database.
- PostgreSQL schema push is disabled in production. Every collection, field or
  index change needs a generated, reviewed migration in `src/migrations/`
  (`npm run payload:migrate:create`). `npm test` replays all migrations, but
  applying them to production is the owner's decision.
- A production build that selects a Payload source without persistent
  database, storage and secrets fails instead of falling back to local data.
- Production imports follow the rules in
  [docs/PROJECT-STATE.md](docs/PROJECT-STATE.md) §K: dry-run first, exact
  counts, verified point-in-time recovery, SHA-bound approval and read-only
  verification afterwards.
- On a fresh production database, the first administrator is created through
  `/admin`. Never commit credentials, tokens or `.env*` files other than
  `.env.example`.

## Contributing

1. Create a branch from `main`; never commit to `main` directly or force-push.
2. Keep commits focused and use Conventional Commit messages.
3. Run `npm run check`; it must pass locally and in CI
   (`.github/workflows/ci.yml`).
4. Open a pull request and wait for the CI checks. Pushing a branch creates a
   Vercel Preview deployment.

The Prettier formatting commit is listed in `.git-blame-ignore-revs`; run
`git config blame.ignoreRevsFile .git-blame-ignore-revs` once for a clean
local `git blame`.

## Further documentation

- [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md): local setup (Turkish)
- [docs/PROJECT-STATE.md](docs/PROJECT-STATE.md): project handoff, district
  contract and production rules
- [docs/NEXT-STEPS.md](docs/NEXT-STEPS.md): open work
- [YONETIM-PANELI-KULLANIM-KILAVUZU.md](YONETIM-PANELI-KULLANIM-KILAVUZU.md):
  admin guide (Turkish), generated from the `/admin/help` source
  `src/components/admin/help/admin-help-guide.ts`
- [CLAUDE.md](CLAUDE.md): rules for AI-assisted work in this repository
