# Şaban Durali Web — Next Steps

Date: 2026-10-04 (housekeeping and owner decisions updated 2026-10-28)

## 1. Current milestone

- The 39-district quality tour is complete.
- No district rewrite is needed by default.
- The district layer is now in maintenance mode. Change it only for a concrete defect, newly verified evidence, expired source, accessibility issue, or approved design improvement.

## 2. Next development rule

Use this sequence:

```text
think → research → design → approve → code
```

Do not build a new feature directly in production. Define the problem, verify the current repository and live state, design the change, obtain approval, then implement and test it.

## 3. Candidate next work

In priority order, choose one bounded outcome rather than opening all tracks at once:

1. Review the homepage and overall visual system for a concrete refinement brief within the İstanbul Atlası design system (`docs/DESIGN-SYSTEM.md`, tokens in `src/app/globals.css`); the old navy/copper palette is retired.
2. Improve article-to-district relationships, district-news presentation, and relevant internal links without weakening publication filters.
3. Audit SEO entities, structured data, canonical links, and internal linking against current live output.
4. Plan any remaining static-to-Payload public-source migration independently for pages, navigation, articles, books, or photos. Source modes are environment-controlled; verify Vercel before deciding that a migration is pending.
5. Define the EN content/CMS scope from current routes and available translations; do not assume Turkish CMS records automatically have publishable English counterparts.
6. Add and verify a production email adapter and password-reset delivery workflow if account recovery is required. Payload auth exists, but no project-specific production email adapter is configured at this baseline.
7. Expand historical district photography only from item-level rights-safe sources, with current attribution and gallery-only behavior.
8. Run a focused performance and accessibility review on current production routes.

District visual/editorial polish is a candidate only when a specific issue is observed; “rewrite all districts” is not a default task.

## 4. Maintenance

Before any production change:

1. Confirm a clean Git working tree.
2. Update current main with `git pull --ff-only`.
3. Verify the current deployment and deployed SHA.
4. Verify required environment-variable presence without exposing values.
5. Run the exact dry-run for the intended operation.
6. Confirm PITR for the target production database.
7. Apply only the reviewed, SHA-bound plan.
8. Run read-only post-apply verification.
9. Run live regression checks on affected and protected routes.

## 5. Repository housekeeping

- Delete `origin/codex/project-day-17-production-infra` and `origin/codex/project-day-19-photography` first: their own old build script still migrates its Preview database without checks (`docs/PROJECT-STATE.md` §N).
- Review and optionally delete `origin/codex/project-day-22-admin-help` after handoff; do not merge it.
- Keep or later delete `origin/codex/project-day-20-full-site-prototype`; its decisions are now archived in the repository.
- Branch hygiene rule: delete a remote branch once its pull request is merged or abandoned, and review the remaining remote branches at every release. A branch that should stay but must never deploy goes into `git.deploymentEnabled` in `vercel.json`; that setting only applies to commits that contain it.
- `.next` and `node_modules` are recreatable caches/dependencies.
- Never delete a local secret backup or the local Payload database; that is the owner's decision after confirming secure external storage (details in the owner's private notes).
- Do not delete old branches as part of feature work unless the user explicitly requests housekeeping.

## 6. When restarting after a long break

Read, in order:

1. `docs/PROJECT-STATE.md`
2. `docs/NEXT-STEPS.md`
3. Current `git log`
4. Current production deployment and deployed SHA
5. Source files relevant to the chosen task

Then compare the handoff with current repository and live behavior. Treat recorded commit values as historical baselines and re-verify every assumption before coding.

## 7. Open owner decisions

These need the owner; no agent should decide or carry them out alone.

1. **Public research data.** `data/districts/research.json` is the raw, unverified research of the 39 districts (`publicationStatus: draft-only-unverified-research`). The application never publishes it, but it is readable in the public GitHub repository and its history. Choose one: keep it public on purpose and record that in `docs/PROJECT-STATE.md`; make the repository private; or move the file to private storage and keep only the fingerprints the importers check. The last option also needs a plan for the tests and the local import that read the file today, and possibly a history rewrite.
2. **Git history.** The former personal mailbox, the local backup details and the evidence logs are gone from the current tree but remain in the history. Rewriting history (for example with `git filter-repo`) is a separate, coordinated decision because it changes every commit hash.
3. **Historical photo batch 2.** `scripts/photos/` stays in place as the reusable engine with a per-batch config. If the second historical photo batch has already been applied to Production, remove its three `historical-photo:batch2:*` npm scripts as was done for the district importers.
4. **Stale Preview branches.** Delete the two branches named in section 5; deleting a remote branch needs push rights.
5. **Retired images without a recorded licence (review 2026-10-28, TESTS-INFRA-6).** The seven JPGs in `brand-assets/retired-home-images/` are tracked in the public repository although `brand-assets/README.md` says their source and licence are not recorded; `brand-assets/next-template/` holds five `create-next-app` sample SVGs with no brand value. Only the owner can establish where the photos came from. Choose one per photo:
   - **Licence verified:** add the source, creator, licence and verification date to its row in `brand-assets/README.md` in the same change. Do not guess a credit.
   - **Licence unknown:** keep a private copy and remove the file from the repository:
     1. `mkdir -p .private-backups/brand-assets-retired` (ignored by `.gitignore`), copy the files there and compare `shasum -a 256` of both copies.
     2. On a new branch: `git rm -r brand-assets/retired-home-images brand-assets/next-template`, update the two rows of `brand-assets/README.md`, run `npm run check` and open a pull request.
     3. After that change, a guard test can require a source and licence row in `brand-assets/README.md` for every tracked image under `brand-assets/` (it would fail today, so it lands with the removal).
   - Removing the files from earlier commits is part of decision 2 (history rewrite); `git rm` only removes them from new commits.
6. **Private operations notes in the working copy (review 2026-10-28, TESTS-INFRA-7).** The main checkout holds four untracked private notes about backup and security operations: `docs/BACKUP-COMPLETION-2026-10-21.md`, `docs/BACKUP-RESTORE-2026-10-21.md`, `docs/LIVE-BACKUP-2026-10-21.md` and `docs/SECURITY-REVIEW-2026-10-21.md`. `.gitignore` does not cover them, so `git add -A` or `git add docs` would publish them. Owner steps, in the main checkout:
   1. `mkdir -p .private-backups/docs` and move the four files there (`.private-backups/` is ignored; `scripts/gitignore.test.ts` pins `.private-backups/docs/` as ignored).
   2. Confirm with `git status --short docs` (no `??` line for them) and `git check-ignore -v .private-backups/docs/SECURITY-REVIEW-2026-10-21.md`.
   3. Keep any further backup or security note in `.private-backups/docs/`, never in `docs/`. `scripts/gitignore.test.ts` fails when a file whose name contains `BACKUP`, `RESTORE` or `SECURITY-REVIEW` is tracked anywhere, so an accidental commit is caught by `npm test` and CI.
