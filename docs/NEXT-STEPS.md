# Şaban Durali Web — Next Steps

Date: 2026-10-04

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

1. Review the homepage and overall visual system for a concrete refinement brief; preserve the SD navy/copper/paper identity.
2. Improve article-to-district relationships, district-news presentation, and relevant internal links without weakening publication filters.
3. Audit SEO entities, structured data, canonical links, and internal linking against current live output.
4. Plan any remaining static-to-Payload public-source migration independently for pages, navigation, articles, books, or photos. Source modes are environment-controlled; verify Vercel before deciding that a migration is pending.
5. Define the EN content/CMS scope from current routes and available translations; do not assume Turkish CMS records automatically have publishable English counterparts.
6. Add and verify a production email adapter and password-reset delivery workflow if account recovery is required. Payload auth exists, but no project-specific production email adapter is configured at this baseline.
7. Expand historical district photography only from item-level rights-safe sources, with current attribution and gallery-only behavior.
8. Run a focused performance and accessibility review on current production routes.
9. Update the embedded admin help guide to cover the newer `DistrictGuides` workflow if administrators need that operational guidance.

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

- Review and optionally delete `origin/codex/project-day-22-admin-help` after handoff; do not merge it.
- Keep or later delete `origin/codex/project-day-20-full-site-prototype`; its decisions are now archived in the repository.
- `.next` and `node_modules` are recreatable caches/dependencies.
- Never delete `.env.production.backup` until the user intentionally decides after confirming secure external storage.
- The local Payload DB has a verified external backup; do not casually delete either copy.
- Do not delete old branches as part of feature work unless the user explicitly requests housekeeping.

## 6. When restarting after a long break

Read, in order:

1. `docs/PROJECT-STATE.md`
2. `docs/NEXT-STEPS.md`
3. Current `git log`
4. Current production deployment and deployed SHA
5. Source files relevant to the chosen task

Then compare the handoff with current repository and live behavior. Treat recorded commit values as historical baselines and re-verify every assumption before coding.
