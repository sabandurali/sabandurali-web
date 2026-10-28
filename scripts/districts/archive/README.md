# Archived Production district importers

Everything in this folder has already been applied to Production. The 39-district
milestone closed with every guide in its final, self-managed state
(`docs/PROJECT-STATE.md` §G and §J). The files are kept unchanged for audit: they
document exactly which gates, baselines and fingerprints protected each write.

Do not copy them for new work. Every importer here repeats the same gate around a
hard-coded batch, so a fix in one copy never reaches the others. A new Production
import needs one parameterised engine with a small per-batch configuration (the
pattern of `scripts/photos/`: one engine plus a config per batch), a dry-run, exact
counts, SHA-bound approval, verified PITR and read-only verification
(`docs/PROJECT-STATE.md` §K).

## Contents

| Importer | Core | Tests | Targets | Provenance |
| --- | --- | --- | --- | --- |
| `import-production.ts` | `production-import-core.ts` | `production-import.test.ts` | 8 population updates, 31 skips | import version 3 |
| `import-production-editorial-batch2.ts` | `production-editorial-batch2-core.ts` | `production-editorial-batch2.test.ts` | 38 districts except Esenler | version 4, baseline `data/districts/production-editorial-batch2-baseline.json` |
| `import-production-arnavutkoy-editorial.ts` | `production-arnavutkoy-editorial-core.ts` | — | Arnavutköy | version 5, `arnavutkoy-editorial-quality-2026` |
| `import-production-avcilar-editorial.ts` | `production-avcilar-editorial-core.ts` | — | Avcılar | version 5, `avcilar-editorial-quality-2026` |
| `import-production-bagcilar-editorial.ts` | `production-bagcilar-editorial-core.ts` | — | Bağcılar | version 5, `bagcilar-editorial-quality-2026` |
| `import-production-bahcelievler-editorial.ts` | `production-bahcelievler-editorial-core.ts` | — | Bahçelievler | version 5, `bahcelievler-editorial-quality-2026` |
| `import-production-bakirkoy-editorial.ts` | `production-bakirkoy-editorial-core.ts` | — | Bakırköy | version 5, `bakirkoy-editorial-quality-2026` |
| `import-production-district-batch1-six.ts` | `production-district-batch1-six-core.ts` | — | 6 districts | version 5 |
| `import-production-district-batch2-eight.ts` | `production-district-batch2-eight-core.ts` | — | 8 districts | version 6 |
| `import-production-district-batch3-ten.ts` | `production-district-batch3-ten-core.ts` | — | 10 districts | version 7 |
| `import-production-district-batch4-nine.ts` | `production-district-batch4-nine-core.ts` | — | 9 districts | version 8 |
| `import-production-esenler-final.ts` | `production-esenler-final-core.ts` | `production-esenler-final.test.ts` | Esenler | version 6, `esenler-final-editorial-quality-2026` |

`check-editorial-cms.ts` is the local check of the first editorial import in a
disposable SQLite copy. Its assertions describe that first batch (population facts
for eight districts only, no planning developments), so it fails against the
current data by design.

`fixtures/esenler-final-baseline-editorial.json` is the Esenler row of
`data/districts/editorial.json` at commit `f1732046b0534cef1bb68c5be5bc5b57c0aa6cbc`,
the approved manual baseline of the Esenler importer. The test checks the row hash
and that it reproduces the approved content fingerprint, so it no longer needs the
Git history (shallow clones and source archives work).

## What changed when they moved

Only relative import paths, so the files stay runnable from this folder, and the
Esenler test reads the fixture above instead of `git show`. Their npm scripts were
removed from `package.json`. The build-time dry-run of `import-production.ts` was
retired from `scripts/vercel-build.mjs`; setting
`PRODUCTION_DISTRICT_DRY_RUN_APPROVED_SHA` now stops a Production build.

## Tests

The three test files still run in `npm test` (the `scripts/**/*.test.ts` glob) and
use only fixtures and in-memory repositories. They read the current
`data/districts/research.json` and `data/districts/editorial.json`.

## Running one

Running any importer here is a Production operation. It needs the owner's explicit
approval for that exact operation in the current conversation and every rule in
`docs/PROJECT-STATE.md` §K. Each importer refuses to start without the SHA-bound
Production environment that its core checks (`VERCEL=1`, `VERCEL_ENV=production`,
`VERCEL_GIT_COMMIT_REF=main`, `VERCEL_GIT_COMMIT_SHA` and its own
`PRODUCTION_*_DRY_RUN_APPROVED_SHA`); `--apply` additionally needs its own import and
PITR approvals. The read-only verification of the final state, for example:

```sh
npx tsx scripts/districts/archive/import-production-esenler-final.ts --dry-run --expect-applied
```
