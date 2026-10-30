# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- PENDING: tags re-implemented from scratch (backlog agreed, stories sent to
  the user's tracker — NOT saved in this repo).
- v0.2.0: subtitle per day application + tag types CRUD + new chip interaction
  (1 click = detail modal, double click / 600ms hold = remove from the day).
- Green: `tsc -b`, oxlint, `npm test` (86 unit+component), `npm run test:e2e`
  (Playwright flow incl. modal, subtitle, long-press, types CRUD).
- Installed as Omarchy web app "Annual Planner": snapshot in
  ~/.local/share/annual-planner, systemd service `annual-planner` (:4830).
- **Re-copy `dist/.` to `~/.local/share/annual-planner/` after each build** (AGENTS).
- Nothing committed yet — user to review + commit.

## Decisions (and why)
- Tags rework agreed (not built yet): CLEAN BREAK — no migration, old data and
  0.2.0 exports are rejected; subtitle stays per-day on DayTag (the spec that
  put it on Tag was a mistake); color kept; tag types removed (flat list).
- Tag = name (always shown) + color + statistics bool + holiday bool (forces
  statistics=false, icon) + work license bool (always in stats but separated,
  icon, max/year showing used/remaining, can go negative) + global bool
  (usable in every planner). Delete blocked with toast for ANY tag in use
  (global: if used in any planner).
- Stack: Vite + React 19 + TS + date-fns, plain CSS (unchanged since 0.1.0;
  approved default tags/colors and planner UX live in release-notes.md).
- Until the rework lands, v0.2.0 code still has `Planner.tagTypes` + legacy
  normalization on load/import; the clean break deletes all of that.
- Chip interaction: 250ms click debounce (double-click detection), 600ms hold,
  document-level swallow of the release click after a hold (the chip unmounts,
  so the click could land on the day underneath and fill it).
- Month zoom navigation: prev/next stay within the planner's year (disabled at
  Jan/Dec); buttons labeled with the target month.
- Delete rule (current + future): blocked with toast showing usage count;
  types CRUD UI lives inside TagsEditor (removed by the rework).

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
