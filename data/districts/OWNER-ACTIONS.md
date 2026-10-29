# District data: owner actions

Open items in `data/districts/` that only the owner can resolve. They need
a fact the repository cannot verify, or a production write. Agents never
change the facts or dates below themselves (CLAUDE.md rule 3). They also
never run the production import (`docs/PROJECT-STATE.md` §K).

## 1. Data year of the Kadıköy District Governorship population source

**Status:** open (found in review round 2, CORRECTNESS-2, 2026-10-29).

**Record:** `data/districts/editorial.json`, district `kadikoy`, source
"İlçemizin Nüfusu Son 1 Yılda 849 Kişi Azalarak 451.453 Oldu"
(`https://www.kadikoy.gov.tr/ilcemizin-nufusu-son-1-yilda-849-kisi-azalarak-451453-oldu`),
section `housingTexture`. The same source is stored in the production CMS
guide of Kadıköy.

**Problem:** the record's `dataDate` is `2026-09-27T09:00:00.000Z`, which
is the observation date, not the year of the count. Until 2026-10-29 the
source table replaced this date in code with the label "2017 nüfus
verisi". The code matched a URL substring to do that. The year 2017 is
not recorded in any source record. `reports/content-trust-20261018/README.md`
says the 2017 split "kullanıcı talimatına dayanır" and that the page
returned HTTP 500 during that session. The code no longer rewrites the
date, so the source table now shows the recorded date (27 Eylül 2026)
under "Veri/gözlem tarihi".

**Owner steps:**

1. Open the source page. Note the publication date and the reference
   year of the 451.453 count exactly as the page states them.
2. If the page confirms the year, set the source `dataDate` to that
   reference date (for example `2017-12-31T00:00:00.000Z` for a year-end
   ADNKS count). Do this in `data/districts/editorial.json` through the
   normal editorial review. Then run `npm run test:districts:content`,
   which must report `39/39 PASS`.
3. Apply the same change to the production CMS guide. This is a
   production write: dry-run first, exact counts, PITR verified,
   SHA-bound approval and read-only verification afterwards (§K).
4. If the page cannot be verified, remove the source from the guide's
   `housingTexture` sources, or mark it `needsVerification: true`, which
   removes it from the public page.
5. `src/components/districts/DistrictGuideArticle.tsx` repeats
   "Kaymakamlığın 451.453 kişilik kaydı 2017 verisidir" as fixed copy.
   Align it with the result of step 1, or remove it.
