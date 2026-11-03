# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.3.0 in progress (tags rework): stories #1–#3 DONE + committed — flat tags
  {id, label, color, inStats?}; #4 approved (current-plan.md), not started;
  stories #5–#9 overview in backlog.md.
- v0.2.0 shipped: per-day subtitle + chip interaction (dblclick/hold = remove);
  tag types removed in #1.
- Green: `tsc -b`, oxlint, `npm test` (96 unit+component), `npm run test:e2e`
  (Playwright flow incl. modal, subtitle, long-press, create→apply→rename).
- Installed as Omarchy web app "Annual Planner": snapshot in
  ~/.local/share/annual-planner, systemd service `annual-planner` (:4830).
- **Re-copy `dist/.` to `~/.local/share/annual-planner/` after each build** (AGENTS).

## Decisions (and why)
- Tags rework: CLEAN BREAK — old data/0.2.0 exports rejected (#9); subtitle
  per-day on DayTag (not Tag); color kept; types removed (flat list).
- v0.3.0 Tag = {id, label, color, inStats?}; tagTypes/category gone. Legacy
  data with stray fields still LOADS and is ignored (refusal = #9); don't drop
  day-string normalization early.
- Tag = name + color + statistics + holiday (forces stats off, icon) + work
  license (in stats, apart, icon, max/year, used/remaining, can go negative) +
  global (every planner). Delete blocked with toast for ANY tag in use.
- Story #3: `inStats?: boolean`, missing = included; the bars filter inside
  `computeStats`; "Sin etiqueta" row gone (README/release-notes wording
  pending).
- #4 approved: `holiday?: boolean`; 🏖️ + "Día Festivo"; icon everywhere (year
  chips too); forces inStats off (stays off after unchecking); "Festivo …"
  defaults ship holiday + out of stats.
- Stack: Vite + React 19 + TS + date-fns, plain CSS; approved defaults/UX in
  release-notes.md.
- Chip interaction: 250ms click debounce (dblclick detection), 600ms hold;
  document-level swallow of the release click after a hold (chip unmounts, the
  click could land on the day underneath and fill it).

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
- Build #4 from current-plan.md, then #5–#9; release-notes.md pending (v0.3.0,
  incl. README/release-notes "untagged days" wording).
- Optional: interaction rule (1 click = details, dblclick/hold = destructive) to AGENTS.md if it becomes a rule.
