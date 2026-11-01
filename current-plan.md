# Current plan — Story #3: Statistics flag

Approved story for the next `/pair` session (backlog #3, v0.3.0 tags rework).

## Story
As a planner user, I want to mark each tag as counted or not counted in the
statistics, so that the counters only show the tags I care about.

## Acceptance criteria
- [ ] Given the tags editor, when I create or edit a tag, then I can mark
      "Incluir en estadísticas" — checked by default for new tags.
- [ ] Given the statistics bars (year view and month zoom), when they render,
      then they list only tags marked as included and no longer show the
      "Sin etiqueta" row — while chips, palette and day usage stay untouched.
- [ ] Given data saved before this change (tags with no flag), when it loads,
      then every existing tag counts as included, so the counters don't change
      until I uncheck a tag.

## Plan
- Add an "included in statistics" boolean to the tag model; missing value means
  included (old data and imports stay valid, no migration).
- Editor form: a checkbox next to the color, loaded and saved with the name and
  color for both create and edit.
- Statistics: rows are built only for included tags; the untagged count goes
  away together with its row.
- Both bars (year footer and month zoom) share the same computation, so one
  change covers both.
- Chips, palette and the detail modal stay as they are — the flag is about the
  bars only.

## Out of scope
- Holiday and work-license flags, icons and counters (#4–#6), including any
  automatic forcing of this flag.
- Global tag across planners (#7) and refusal of previous-version data (#9).
- Any indicator in the tag list for excluded tags (form only).
- Day chips, palette, subtitles and the 2-tags-per-day limit (unchanged).
- README / release-notes wording about "untagged days" — updated with the
  release notes, not in this story.

## Decisions taken during refinement
1. Flag scope: the statistics bars only (detail modal's "N veces este año" is
   unaffected).
2. The "Sin etiqueta" row is removed from the statistics entirely; the bars
   show only configured (included) tags.
3. The toggle lives in the editor form only (no indicator in the tag list).

## Existing tests affected (for approval in the pair session, not touched yet)
- `src/App.test.tsx` — `starts with every day untagged` (asserts the 365 count)
  → reworked/removed.
- `src/utils/stats.test.ts` — both `untagged` cases → removed with the field.
- `src/components/MonthZoom.test.tsx` — stats fixture drops `untagged`.
- `README.md` + `release-notes.md` mention "untagged days" → stale wording.
