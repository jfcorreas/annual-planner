# Current plan — Story #9: Refuse data and exports from the previous version

Approved story for the next `/pair` session (backlog #9, v0.3.0 tags rework).

## Story
As a planner user, I want the app to refuse data saved by a previous version, so
that an incompatible file can never load half-broken or overwrite my planners.

## Acceptance criteria
- [ ] Given the app has data saved by a previous version, when I open it, then
      that data is not loaded: I see a notice explaining it is no longer
      compatible, and a new empty planner starts only after I confirm; the old
      data stays untouched.
- [ ] Given I import an export file from a previous version, when I choose it,
      then it is rejected with a clear message and my current planners stay
      unchanged.
- [ ] Given I use the current version, when I reload the app or export and
      import my planners, then they load and round-trip as today.

## Plan
- Mark the current format with a new version number and a new storage slot, so
  previous-version data is never read as current.
- On startup, detect previous-version data before validation and surface a
  "previous version" state instead of loading it.
- Show a blocking notice with an explicit "start fresh" action; only then
  create the default planner and save it. The old data is left in place.
- On import, detect a previous-version file and reject it with a specific
  ES/ES message; other invalid files keep the generic message.
- Everything else (current-format validation, subtitle normalization, export
  shape, planner and tag behavior) stays as is.

## Out of scope
- Migrating or converting previous-version data.
- Deleting the old stored data automatically or offering a backup download.
- Bumping the app version / release notes (release task).
- Stricter validation of the current format beyond today's checks.

## Suggestions (your call)
- The loader currently returns "nothing" for three different cases (no data,
  corrupted data, previous version); #9 needs to tell them apart, so a small
  result status instead of a nullable value would keep the startup logic
  readable.

## Decisions taken during refinement
1. Format marker: `version: 2` and the storage key `annual-planner:v2`; the old
   `annual-planner:v1` entry is left untouched.
2. Startup with previous-version data: blocking notice + explicit "Empezar de
   cero" confirmation; no silent fresh start and nothing saved before it.
3. Old data is never deleted automatically.
4. Import of a previous-version file: specific ES/ES message ("El archivo es de
   una versión anterior y ya no es compatible."); other invalid files keep the
   generic message.
5. Legacy string day ids inside a current-format (v2) file are still normalized;
   only the version gates the refusal.
6. Corrupted / current-format invalid data keeps today's behavior (silent fresh
   planner).

## Existing tests to review in the pair session (intentional contract change)
- `src/storage.test.ts` — key constant and `sampleData()` version; the "wrong
  schema (other version)" test flips (v2 becomes valid); the two "normalizes
  legacy" tests (v1) now expect refusal; add previous-version load/import cases.
- `src/hooks/useAppData.test.tsx` — key constant and the persisted fixture
  version.
- `src/App.test.tsx` — "loads old data without the flag counting every tag"
  seeds v1: move it to v2 so it keeps testing missing `inStats`, and add the
  blocking-notice case.
- `tests/e2e/planner.spec.ts` — steps 7 and 11 hardcode `annual-planner:v1` and
  `"version":1`; update them to v2.
- These edits are part of the story, not test-fudging: #9 intentionally changes
  the contract, so the "stop if a test must change" rule is acknowledged here
  before starting.
