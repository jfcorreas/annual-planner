# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.3.0 in progress (tags rework): #1–#5 DONE + committed; #6 approved
  (current-plan.md), not started; #7–#9 overview in backlog.md.
- v0.2.0 shipped: per-day subtitle + chip interaction (dblclick/hold = remove).
- Green: `tsc -b`, oxlint, `npm test` (118 unit+component), `npm run test:e2e`
  (Playwright full flow; e2e stats assertion reads the whole `.stats` footer).
- Installed as Omarchy web app "Annual Planner" (:4830, systemd
  `annual-planner`). **Re-copy `dist/.` to `~/.local/share/annual-planner/`
  after each build** (AGENTS).

## Decisions (and why)
- Tags rework: CLEAN BREAK — old data/0.2.0 exports rejected (#9); subtitle
  per-day on DayTag (not Tag); color kept; types removed (flat list).
- v0.3.0 Tag = {id, label, color, inStats?, holiday?, permit?, maxPerYear?};
  tagTypes/category gone. Legacy data with stray fields still LOADS and is
  ignored (refusal = #9); don't drop day-string normalization early.
- Tag flags: statistics, holiday (stats off, 🏖️), permit (always in stats, apart,
  🪪, max/year, can go negative), global (every planner); delete blocked if used.
- #3: `inStats?` missing = included; `computeStats` filters; "Sin etiqueta" gone.
- #4: `holiday?: boolean`; badge before the name (all surfaces, not tooltips);
  form order = stats then Día Festivo; saves force `inStats` off.
- #5 DONE: `permit?` + `maxPerYear?` (missing = not a permit, written only when
  permit → no migration); editor forces `inStats` on/disabled, mutually
  exclusive with Festivo (unchecking permit keeps stats checked);
  `Stats {counts, permits}` — permits bypass the filter, own group at the end
  of both bars; `tagIcon(tag)` helper replaces the badge in 6 places.
- #6 approved: year permit row "U de N · Restantes R" (R = max − count), red
  when negative; month bar keeps the plain count; detail modal unchanged.
- Stack: Vite + React 19 + TS + date-fns, plain CSS; approved defaults/UX in
  release-notes.md.
- Chip interaction: 250ms click debounce (dblclick detection), 600ms hold;
  document-level swallow of the release click after a hold (chip unmounts, the
  click could land on the day underneath and fill it).

## Lessons Learned and Mistakes to Avoid
- No setState inside updaters; compute derived values (and "did it apply") first.
- Two `toggleDayTag` calls in ONE `act()` are stale (second reads pre-flush
  state) → tests use one `act()` per toggle; in the app each click flushes, so
  production never hits this.
- Date tests: compare calendar fields (getDate()) not timestamps (DST).
- pt→px in print: A5 landscape content ≈515px tall; keep print styles compact.

## Next Steps
- Build #6 from current-plan.md, then #7–#9; release-notes.md pending (v0.3.0,
  incl. README "untagged days"). Manual check after #6: permit group look (two
  `flex:1` lists), 🪪 everywhere, editor form layout.
- Optional: interaction rule (1 click = details, dblclick/hold = destructive) to AGENTS.md if it becomes a rule.
