# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.3.0 in progress (tags rework from scratch): stories #1–#3 DONE +
  committed — flat tags {id, label, color} + per-tag `inStats`; stories
  #4–#9 overview in backlog.md.
- v0.2.0 shipped: per-day subtitle + tag types (types now gone) + chip
  interaction (1 click = detail modal, dblclick / 600ms hold = remove).
- Green: `tsc -b`, oxlint, `npm test` (96 unit+component), `npm run test:e2e`
  (Playwright flow incl. modal, subtitle, long-press, create→apply→rename).
- Installed as Omarchy web app "Annual Planner": snapshot in
  ~/.local/share/annual-planner, systemd service `annual-planner` (:4830).
- **Re-copy `dist/.` to `~/.local/share/annual-planner/` after each build** (AGENTS).
- Story #3 committed by the user; next up: #4 (holiday flag).

## Decisions (and why)
- Tags rework: CLEAN BREAK — final state rejects old data/0.2.0 exports;
  subtitle stays per-day on DayTag (the spec that put it on Tag was a
  mistake); color kept; tag types removed (flat list).
- v0.3.0 Tag = {id, label, color}; tagTypes/category are gone. Legacy data
  with stray fields still LOADS and the fields are ignored — active refusal
  is story #9's job, don't remove day-string normalization early.
- Tag = name (always shown) + color + statistics bool + holiday bool (forces
  statistics=false, icon) + work license bool (always in stats but separated,
  icon, max/year showing used/remaining, can go negative) + global bool
  (usable in every planner). Delete blocked with toast for ANY tag in use
  (global: if used in any planner).
- Story #3: `inStats?: boolean`, missing = included (no migration); the bars
  filter inside `computeStats`; "Sin etiqueta" row gone — README/release-notes
  wording still pending (goes with the release notes).
- Stack: Vite + React 19 + TS + date-fns, plain CSS; approved defaults/UX in
  release-notes.md.
- Chip interaction: 250ms click debounce (double-click detection), 600ms hold,
  document-level swallow of the release click after a hold (the chip unmounts,
  so the click could land on the day underneath and fill it).

## Lessons Learned and Mistakes to Avoid
- Don't compute "did it apply" inside setState updaters (lazy/possibly twice):
  read current state in the callback (useAppData.toggleDayTag).
- Two `toggleDayTag` calls in ONE `act()` are stale (second reads pre-flush
  state and overwrites the day) → tests use one `act()` per toggle. In the app
  each click is its own event/flush, so this never hits in production.
- No setState inside updaters — compute derived values before calling setData.
- Date tests: compare calendar fields (getDate()) not timestamps (DST).
- pt→px in print: A5 landscape content ≈515px tall; keep print styles compact.

## Next Steps
- Stories #4–#9 (holiday flag next); release-notes.md pending for v0.3.0,
  incl. the "untagged days" wording in README/release-notes.
- Optional: interaction rule (1 click = details, dblclick/hold =
  destructive) to AGENTS.md if it becomes a rule.
