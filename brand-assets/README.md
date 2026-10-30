# Brand assets (not deployed)

Source and reference files of the SD identity. They were in `public/`, where
every deploy published them at a site URL, but no code, page, metadata or
document referenced them. They moved here unchanged; nothing outside `public/`
is served.

| File | What it is |
| --- | --- |
| `logo-horizontal.png`, `logo-vertical.png`, `monogram.png` | Logo and monogram masters |
| `profile-icon.png` | Profile image master |
| `brand-board.png`, `office-wall-mockup.png` | Brand board and mock-up presentations |
| `icons/` | Earlier exports of the app icon set. The live icons are the Next.js file conventions `src/app/favicon.ico`, `src/app/icon.png` and `src/app/apple-icon.png` |
| `retired-home-images/` | The pre-atlas home hero photo (`hero-istanbul-bogaz.jpg`), three workspace card photos (`fotograf.jpg`, `gayrimenkul-istanbul.jpg`, `satis-muzakere.jpg`) and the three knowledge card photos (`arastirma-analiz.jpg`, `kitaplar-ogrenme.jpg`, `yapay-zeka-teknoloji.jpg`). The İstanbul Atlası home uses no decorative photos; their source and licence are not recorded, so they must not be published again without a verified credit |

The five `create-next-app` sample SVGs that were kept in `next-template/`
had no brand value and no reference anywhere; they were removed on
2026-10-29 (review TESTS-INFRA-4).

To publish one of them again, copy it into `public/` in the same change that
references it. `scripts/public-assets.test.ts` fails when a file in `public/`
is not referenced by the application.
