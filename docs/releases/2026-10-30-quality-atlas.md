# Release 2026-10-30: quality programme and İstanbul Atlası

- Pull request: #2, `claude/quality-atlas-redesign` (head `aff047438284e6c12dae3832196578d6b314ca31`)
- Merge commit on `main`: `ade441d0f745194bd19717bdb976fd607e152f81`
- Migration: `20261028_205938_article_seo_book_slug_unique` (`docs/PROJECT-STATE.md` §K.5)
- Procedure: `docs/PROJECT-STATE.md` §K.2, with the owner's approval in the session
- Times are Europe/Istanbul.

## Pre-flight (read-only, owner, Neon SQL editor on the Production branch)

Run inside `BEGIN READ ONLY; … ROLLBACK;` on 2026-10-30 at about 22:14.

| Query (§K.5) | Result |
|---|---|
| 1. Duplicate `books (language, slug)` | 0 rows |
| 2. `articles_locales` with `h1` or relationship nodes | 0 |
| 2. `pages_blocks_rich_text` with `h1` or relationship nodes | 0 |
| 2. `pages_blocks_image_text` with `h1` or relationship nodes | 0 |

## Point-in-time recovery

Checked on 2026-10-30 at 22:17 in the Neon console (Backup & Restore, Production branch): restore from history
with a 6-hour window, and the current time was selectable as a restore point. No restore was started.

## Apply

1. 22:19: PR #2 merged. The Production build of the merge commit stopped as designed with
   `Pending migrations detected; approval required. … Pending: 20261028_205938_article_seo_book_slug_unique.`
   The live site stayed on the previous deployment.
2. 22:21: the owner approved. `PRODUCTION_MIGRATION_APPROVED_SHA` and `PRODUCTION_MIGRATION_PITR_CONFIRMED_SHA`
   were set to the merge commit, and `PRODUCTION_MIGRATION_APPROVED_NAMES` to the migration name, in the
   Production environment only.
3. 22:22: redeploy of the same commit. Build log:
   `Applying 1 approved migration(s) for commit ade441d…` → `Migrated: 20261028_205938_article_seo_book_slug_unique (256ms)`
   → `Migrations completed and verified. Starting the application build.` → 96/96 static pages → Ready.
4. About 22:55: the owner removed the three approval variables. A project listing showed no `PRODUCTION_*`
   variable left, which also confirms the retired variables from §K.1 are gone.

## Read-only verification (about 22:27)

- 200: `/`, `/hakkimda`, `/en`, `/istanbul/ilceler/kadikoy`, `/fotograflar`, `/kitaplar`, `/makaleler`,
  `/satis-ve-muzakere`, `/sitemap.xml`, `/robots.txt`, `/admin/login`.
- `/ana-sayfa` → 308 to `/`; an unknown path → 404.
- Anonymous `/api/users/me` → `{"user":null}` with no token.
- Sitemap: 70 URLs and 15 images, every `loc` and `image:loc` absolute on `https://www.sabandurali.com/`, and
  all 15 images answer 200 `image/jpeg`. The home canonical is `https://www.sabandurali.com`.
- Headers: HSTS, `X-Frame-Options: DENY`, the enforced CSP and the report-only CSP are present.
- Runtime errors since the deploy: only the pre-existing `pg` `sslmode` deprecation warning (first seen 2026-07-31).

## Follow-up on the same evening

- The Vercel Firewall rule "Admin auth rate limit" was published and verified (`docs/SECURITY.md` §1).
- The sitemap was resubmitted in Search Console. Its "15 errors" were the relative `image:loc` values of the
  27 October read; they clear on Google's next read.
