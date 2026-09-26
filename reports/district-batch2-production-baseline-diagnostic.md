# District Batch 2 Production Baseline Diagnostic

- Audit date: 2026-09-26 (Europe/Istanbul)
- Production deployment SHA: `61294853c29348512a37541bc1c4efdd4f473fec`
- Mode: read-only, repeatable-read PostgreSQL transaction; Payload `find` only
- Production writes: 0

## Result

- Production records: 39
- Esenler excluded: 1
- Target records: 38
- Category A — `PUBLISHED_SELF_MANAGED_BASELINE_MISMATCH`: 38
- Category B — `MANUAL_OR_UNMANAGED`: 0 target records
- Category C — `STATUS_PROBLEM`: 0
- Category D — `OTHER`: 0
- Safe adoption candidates: 38
- Blocked: 0

All 38 target records are published, have a valid `publishedAt`, carry import provenance version 3, and are self-managed: the stored provenance fingerprint equals the fingerprint recalculated from the current owned fields. Every target has a unique registry slug and ID. No duplicate or missing district was found.

The previous dry-run's generic conflict reason said that the approved baseline did not match. The diagnostic separates the two bindings:

- Hard-coded Batch 2 **source** fingerprint: 38/38 match.
- Hard-coded Batch 2 **content** fingerprint: 0/38 match.
- The only mismatching owned field is `sources`: 38/38.
- All other owned fields match the repository state at `18e4cdf4f5875b47d3523f864bc615a6d82be77c` exactly.
- After ignoring generated array IDs, normalizing date precision to seconds, and treating source `sections` as an unordered multi-select, the public source data is semantically identical for 38/38 targets.

The content mismatch is therefore explained by persistence normalization, not an unexplained content edit. The hard-coded content fingerprints were calculated from the pre-persistence `makeDraft()` output. Payload/PostgreSQL normalized source date values from microsecond input to millisecond output and normalized the order of the `sections` multi-select array. The provenance content fingerprints were calculated from the saved Payload documents and still match the current Production records.

## Historical source identification

Production provenance does not contain `sourceCommit` or `batch`; both are absent. It does contain version 3, the PDF file/hash, source fingerprint, and saved content fingerprint.

The 38 stored source fingerprints were compared programmatically with repository bundles:

| Repository state | Source matches |
|---|---:|
| `3354604496b33748add0117a0cbf5fae4aaaab0e` | 30/38 |
| `2116bcb592a7cf0ca2ef0ff06e0d5a25d08a7ebd` | 38/38 |
| `fb1fc29595744f8c5f6f33253e77b93f894f37d1` | 38/38 |
| `18e4cdf4f5875b47d3523f864bc615a6d82be77c` | 38/38 |
| `09ea30f0bd458b0efc47123e3fcc3aeaf3235221` | 0/38 |
| `1bb2aacb85310cb54ff887e80174aa0a08377b08` | 0/38 |

For non-Esenler districts, the Production source state is content-equivalent across `2116bcb` → `fb1fc29` → `18e4cdf`. The earlier `3354604` state differs for the eight Batch 1 population districts; the later `09ea30f` and `1bb2aac` states contain the reviewed Batch 2 editorial changes and correctly do not match the current Production source fingerprints.

## Public projection verification

For every target, `projectPublishedDistrictGuide` returned a projection. Across all 38 targets:

- `researchNotes` is absent.
- `importProvenance` is absent.
- Unverified `marketData` is not public.
- Unverified `planningDevelopments` is not public.
- Neighborhood and source lists are present in the safe projection.

## Target audit

“Baseline” below means `source ✓ / content ✗`. “Historical source” means an exact source-fingerprint match to the approved non-Esenler state represented by `2116bcb`, `fb1fc29`, and `18e4cdf`. The safe-adoption reason is identical for all rows: only the persisted `sources` representation differs, and its normalized public meaning matches the approved historical state.

| District | Published | Self-managed | Stored/current match | Provenance version | Historical source | Batch 2 baseline | Safe adoption candidate | Reason |
|---|---:|---:|---:|---:|---|---|---:|---|
| Adalar | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Arnavutköy | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Ataşehir | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Avcılar | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Bağcılar | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Bahçelievler | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Bakırköy | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Başakşehir | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Bayrampaşa | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Beşiktaş | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Beykoz | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Beylikdüzü | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Beyoğlu | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Büyükçekmece | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Çatalca | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Çekmeköy | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Esenyurt | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Eyüpsultan | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Fatih | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Gaziosmanpaşa | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Güngören | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Kadıköy | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Kağıthane | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Kartal | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Küçükçekmece | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Maltepe | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Pendik | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Sancaktepe | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Sarıyer | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Şile | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Silivri | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Şişli | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Sultanbeyli | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Sultangazi | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Tuzla | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Ümraniye | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Üsküdar | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |
| Zeytinburnu | Yes | Yes | Yes | 3 | `2116bcb`–`18e4cdf` | Source ✓ / content ✗ | Yes | Payload source normalization only |

## Esenler

Esenler remains excluded from Batch 2. It is published, has `publishedAt`, has a safe public projection, and has a unique registry identity. Its stored provenance fingerprint does not equal the current content fingerprint, so it would classify as `B — MANUAL_OR_UNMANAGED` if it were a target. It is not a safe baseline-adoption candidate and no Esenler write is permitted.

## Safe baseline adoption design (proposal only)

Because all 38 targets satisfy every adoption condition, a later, separately approved change may replace only the Batch 2 content-baseline constants with the audited saved-document fingerprints captured by this diagnostic. That change should:

1. Keep the source and content fingerprint pair for every target as version-controlled constants.
2. Record Production deployment SHA `61294853c29348512a37541bc1c4efdd4f473fec` and audit date `2026-09-26` in the code comment.
3. Generate the constants offline from this approved diagnostic; never read or approve a baseline dynamically at runtime.
4. Keep the exact 38-update / one-Esenler-skip membership gate and every existing conflict, transaction, SHA, and PITR guard.
5. Add a test proving that source-normalization differences alone explain the old baseline mismatch and that any later owned-field change still fails closed.
6. Require review and a new commit before another Production dry-run. This diagnostic itself does not authorize apply.

No baseline constant, importer, application source, environment, CMS record, migration, or Production data was changed during this diagnostic.
