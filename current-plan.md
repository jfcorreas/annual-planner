# Current plan — Story #5: Work-permit flag + max per year

Approved story for the next `/pair` session (backlog #5, v0.3.0 tags rework).

## Story
As a planner user, I want to mark a tag as a work permit with a yearly maximum,
so that I can track it apart from the regular statistics.

## Acceptance criteria
- [ ] Given the tags editor, when I mark a tag as "Permiso de trabajo", then I
      must set its "Máximo por año" (whole number ≥ 1), and both the box and the
      max are saved and loaded back when editing; while it is marked, "Incluir
      en estadísticas" is forced on (disabled) and "Día Festivo" cannot be on at
      the same time (checking one unchecks the other).
- [ ] Given a tag marked as a work permit, when it appears anywhere in the app,
      then it shows the 🪪 icon next to its name/chip, and it behaves like any
      other tag for applying, renaming and deleting.
- [ ] Given a work-permit tag, when the statistics bars render (year and month),
      then it appears in its own separate group after the regular tags, always
      present, showing the count of applications in the period.

## Plan
- Tag model: a work-permit flag plus a "max per year" number; missing values
  mean "not a permit" (old data and imports stay valid, no migration).
- Editor: "Permiso de trabajo" checkbox and a numeric "Máximo por año" field
  (integer ≥ 1, required to save) that only shows while the box is checked;
  it forces "Incluir en estadísticas" on and is mutually exclusive with
  "Día Festivo".
- 🪪 rendered wherever the tag is listed (same surfaces as 🏖️).
- Statistics: permit tags bypass the "included in stats" filter and are listed
  in their own group at the end of both bars; counts keep counting
  applications in the period shown.
- No used/remaining display yet (that is #6); the max is only stored and
  configured here.

## Out of scope
- Used/remaining counter, negative balances (#6).
- Global tag across planners (#7) and refusal of previous-version data (#9).
- Chip colors, chip interactions, subtitles and the delete rule (unchanged).
- Backfilling existing planners: their tags keep whatever they have today.

## Suggestions (your call)
- The badge rendering already repeats in 5 places (year chips, month chips,
  palette, editor list, detail title) and 🪪 adds a 6th: worth extracting a
  tiny shared badge helper when we touch it.
- The editor form now has 3 checkboxes plus a number field: grouping the flags
  in one fieldset would read better.

## Decisions taken during refinement
1. Icon: 🪪. Checkbox label: "Permiso de trabajo".
2. Marking a permit forces "Incluir en estadísticas" on (disabled while
   checked) and is mutually exclusive with "Día Festivo" (checking one
   unchecks the other).
3. The bars show the permit group with the used count only (the max is stored
   but not displayed until #6), in both the year and the month bars.
4. "Máximo por año": integer ≥ 1, required while the permit box is checked,
   no default value.

## Existing tests to review in the pair session (not touched yet)
- `src/App.test.tsx` — tests that count or look up `.stats__item` rows
  (lines ~57, ~235, ~387, ~422, ~439, ~463, ~778–792): the bars gain a second
  group, so row lookups may need to target the right group.
- `src/App.test.tsx` — editor form tests (`formCheckbox` helper, holiday
  forcing tests) now coexist with a third checkbox and a number field.
- `src/components/MonthZoom.test.tsx` — `Stats` fixture (`counts: []`) may need
  the new group field.
- `src/defaults.test.ts` — no change expected (no default permit tags), verify.
