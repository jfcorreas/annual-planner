# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.3.0 in progress (tags rework): #1–#7 DONE + committed; #8–#9
  overview in backlog.md.
- v0.2.0 shipped: per-day subtitle + chip interaction (dblclick/hold = remove).
- Green: `tsc -b`, oxlint, `npm test` (136 unit+component), `npm run test:e2e`
  (Playwright full flow; e2e stats assertion reads the whole `.stats` footer).
- Installed as Omarchy web app (:4830, systemd `annual-planner`); **re-copy
  `dist/.` after each build** (AGENTS). #7 build copied, manual checks OK.

## Decisions (and why)
- Tags rework: CLEAN BREAK — old data/0.2.0 exports rejected (#9); subtitle
  per-day on DayTag (not Tag); color kept; types removed (flat list).
- v0.3.0 Tag = {id, label, color, inStats?, holiday?, permit?, maxPerYear?,
  global?}; tagTypes/category gone. Legacy stray fields still LOADS and is
  ignored (#9); don't drop day-string normalization early.
- Tag flags: statistics, holiday (stats off, 🏖️), permit (always in stats, apart,
  🪪, max/year, can go negative), global (same-id copies synced, 🌐 only in
  editor + detail modal); delete blocked if used anywhere.
- #7 DONE: unmark blocked while another planner uses it; unused-elsewhere
  unmark clears the flag in EVERY planner (copies stay, sync stops); delete
  blocked with "N días en M planificadores". Guards live in App (toast owner)
  via shared `tagUsageAcrossPlanners()`; new planners = defaults + globals
  (dedupe by id, global wins); badge via `tagIcon(tag, {showGlobal})`.
- #3: `inStats?` missing = included; `computeStats` filters; "Sin etiqueta" gone.
- #4: `holiday?: boolean`; badge before the name (all surfaces, not tooltips);
  form order = stats then Día Festivo; saves force `inStats` off.
- #5 DONE: `permit?`+`maxPerYear?` (written only when permit, no migration);
  editor forces `inStats` on/disabled, mutually exclusive with Festivo (unchecking
  permit keeps stats checked); `Stats {counts, permits}` — permits bypass the
  filter, own group at end of both bars; `tagIcon()` helper in 6 places.
- #6 DONE: year permit row "U de N · Restantes R" (R = max − count), red when
  negative; month bar keeps the plain count; detail modal unchanged.
- Stack: Vite + React 19 + TS + date-fns, plain CSS; defaults/UX in release-notes.md.
- Chip interaction: 250ms click debounce, 600ms hold; document-level swallow of
  the release click after a hold (chip unmounts → it could hit the day below).

## Lessons Learned and Mistakes to Avoid
- No setState inside updaters; compute derived values (and "did it apply") first.
- A condition on a patch field must compare the PREVIOUS state (base), not the
  patch alone — the editor sends every flag each save (cost us a silent
  cross-planner sync bug in #7).
- Two `toggleDayTag` in ONE `act()` are stale (reads pre-flush state) → one
  `act()` per toggle in tests; app clicks flush separately.
- Date tests: compare calendar fields (getDate()) not timestamps (DST).
- pt→px in print: A5 landscape content ≈515px tall; keep print styles compact.

## Next Steps
- Next #8–#9; release-notes.md pending (v0.3.0, incl. README "untagged days").
- Optional: interaction rule (1 click = details, dblclick/hold = destructive) to AGENTS.md if it becomes a rule.
