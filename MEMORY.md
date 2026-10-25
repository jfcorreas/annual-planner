# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.2.0: subtitle per day application + tag types CRUD + new chip interaction
  (1 click = detail modal, double click / 600ms hold = remove from the day).
- Green: `tsc -b`, oxlint, `npm test` (86 unit+component), `npm run test:e2e`
  (Playwright flow incl. modal, subtitle, long-press, types CRUD).
- Installed as Omarchy web app "Annual Planner": snapshot in
  ~/.local/share/annual-planner, systemd service `annual-planner` (:4830).
- **Re-copy `dist/.` to `~/.local/share/annual-planner/` after each build** (AGENTS).
- Nothing committed yet — user to review + commit.

## Decisions (and why)
- Stack: Vite + React 19 + TS + date-fns, plain CSS (unchanged since 0.1.0;
  approved default tags/colors and planner UX live in release-notes.md).
- Subtitle = `DayTag { tagId, subtitle? }` per (day, tag), NOT on `Tag`:
  user chose per-application text, edited only from the planner modal,
  never in the tags template (explicit requirement).
- `Planner.tagTypes` per planner (planner = export unit); default ids keep the
  legacy literals ('trabajo','local','regional','nacional') → old data needs
  no rewrite; unknown ids display as "Sin tipo".
- Storage stays `annual-planner:v1` + normalization on load AND import
  (days strings → DayTag[], missing tagTypes → defaults). One-way compat:
  0.2.0 exports are rejected by 0.1.x builds (noted in release-notes).
- Chip interaction: 250ms click debounce (double-click detection), 600ms hold,
  document-level swallow of the release click after a hold (the chip unmounts,
  so the click could land on the day underneath and fill it).
- Delete type in use = blocked with toast showing usage count (user choice);
  types CRUD UI lives inside TagsEditor.

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
- User to review + commit. Optional: add the interaction rule (1 click =
  details, dblclick/hold = destructive) to AGENTS.md if it becomes a rule.
