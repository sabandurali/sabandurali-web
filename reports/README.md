# Reports

This folder keeps the human-readable summaries of past work packages: the
`*.md` files. They describe what was checked and decided; they are not a
reproduction of the current code.

## Evidence is not tracked

Logs, screenshots, JSON results and text listings are no longer tracked
(`reports/.gitignore`). The files that were committed before stay in the Git
history unchanged; restore one when an audit needs it, for example:

```sh
git show d47df10:reports/istanbul-39/evidence/build.log
git restore --source d47df10 -- reports/content-trust-20261018
```

`d47df10` is the last `main` commit that tracked them. Keep new evidence out of
Git: attach it to the pull request or release notes, or keep it in private
storage. Tools write their output to `/tmp` or another ignored path:

- `npm run test:districts:content` never writes; `npm run report:districts:content`
  writes `reports/istanbul-39/content-acceptance.json`, which is ignored.
- `npm run e2e:districts:routes` and `npm run e2e:content-trust` write to
  `DISTRICT_TEST_OUTPUT` (a folder under `/tmp` by default).

## Tracked inputs

Two JSON files stay tracked because something still reads them:

- `istanbul-39/editorial-review.json` — the reviewed official neighbourhood
  lists that `npm run test:districts:content` compares with the public
  projection. It belongs in `data/districts/` and moves there together with the
  path in `scripts/districts/check-content.ts`.
- `content-trust-20261018/cms-home-about.json` — the reviewed homeAbout text
  for the TR and EN home pages in Payload, referenced by that report's README.
  It is a review artefact for a separately approved manual CMS change, not an
  import.
