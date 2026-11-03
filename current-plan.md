# Current plan — Story #4: Holiday flag

Approved story for the next `/pair` session (backlog #4, v0.3.0 tags rework).

## Story
As a planner user, I want to mark a tag as a holiday, so that it's identifiable
at a glance on the planner and stays out of the statistics.

## Acceptance criteria
- [ ] Given the tags editor, when I create or edit a tag, then I can mark it as
      a holiday with the "Día Festivo" box (unchecked by default) and it keeps
      its name and color.
- [ ] Given a tag marked as a holiday, when it appears anywhere in the app
      (year-view chips, month-view chips, palette, editor list, detail modal
      title), then it shows the 🏖️ icon next to its name/chip, and it behaves
      like any other tag for applying, renaming and deleting.
- [ ] Given I mark a tag as a holiday and save it, then it does not appear in
      the statistics bars and "Incluir en estadísticas" is forced off
      (disabled) while "Día Festivo" is checked; if I later uncheck the
      holiday box, the tag stays out of the statistics until I re-check
      "Incluir en estadísticas".

## Plan
- Add a holiday boolean to the tag model; missing value means "not a holiday",
  so old data and imports stay valid (no migration).
- Editor: "Día Festivo" checkbox that, while checked, disables and unchecks
  "Incluir en estadísticas" before saving.
- Render 🏖️ next to the tag wherever it is listed: year chips (their first
  content — today they are pure color blocks), month chips, palette, editor
  list and detail modal title.
- Statistics need no new logic: they already skip tags excluded from stats.
- Default tags for new planners: "Festivo local / regional / nacional" ship
  already marked as holidays (hence out of stats); existing planners untouched.

## Out of scope
- Work-license flag, max per year and used/remaining counter (#5–#6).
- Global tag across planners (#7) and refusal of previous-version data (#9).
- Any change to chip colors, chip interactions, subtitles or the delete rule.
- Backfilling existing planners: their tags keep whatever they have today.

## Suggestions (your call)
- None yet. If #5–#6 add more fields to this form, grouping the flags in one
  fieldset will be worth it then.

## Decisions taken during refinement
1. Icon: 🏖️. Checkbox label: "Día Festivo".
2. The icon shows everywhere the tag appears, including the year-view chips
   (which currently render no content at all).
3. Unchecking "Día Festivo" later does not restore the statistics flag: the tag
   stays excluded until "Incluir en estadísticas" is checked again.
4. New planners ship the three "Festivo …" default tags already marked as
   holidays (so they are out of the statistics); existing planners are not
   touched.

## Existing tests to review in the pair session (not touched yet)
- `src/defaults.test.ts` — asserts the default tags (label/color list); adding
  `holiday`/`inStats` to the three Festivo defaults touches the fixtures.
- `src/App.test.tsx` — `starts with …` tests render the default palette and
  assert the stats rows; the three Festivo tags will drop out of the bars.
- Chip/palette/detail tests that assert chip text or titles may need the 🏖️
  accounted for in their expected strings.
