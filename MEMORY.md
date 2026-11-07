# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.3.0 in progress (tags rework): #1–#7 DONE + committed; #8 discarded (no
  details); #9 DONE — tests green (143 unit+component, e2e full flow), pending
  navigator commit, /code-review and manual notice check.
- Green: `tsc -b`, oxlint, `npm test` (136 unit+component), `npm run test:e2e`
  (Playwright full flow; e2e stats assertion reads the whole `.stats` footer).
- Installed as Omarchy web app (:4830, systemd `annual-planner`); **re-copy
  `dist/.` after each build** (AGENTS). #7 build copied, manual checks OK.

## Decisions (and why)
- Tags rework: CLEAN BREAK — v1 data/0.2.0 exports refused (#9); subtitle
  per-day on DayTag (not Tag); color kept; types removed (flat list).
- v0.3.0 Tag = {id, label, color, inStats?, holiday?, permit?, maxPerYear?,
  global?}; tagTypes/category gone; v2 still normalizes string day ids.
- Tag flags: statistics, holiday (stats off, 🏖️), permit (always in stats, apart,
  🪪, max/year, can go negative), global (same-id copies synced, 🌐 only in
  editor + detail modal); delete blocked if used anywhere.
- #7 DONE: unmark blocked if another planner uses it; unused-elsewhere unmark
  clears the flag everywhere (copies stay, sync stops); delete blocked with
  "N días en M planificadores". Guards in App via `tagUsageAcrossPlanners()`;
  new planners = defaults + globals; badge via `tagIcon(tag, {showGlobal})`.
- #9 DONE: format `version: 2` + key `annual-planner:v2` (v1 untouched);
  blocking "Empezar de cero" screen, old data never deleted; specific import
  refusal message. Startup rule: valid v2 → normal; else v1 entry present →
  notice; else silent fresh (so corrupt v2 + leftover v1 → notice).
- #3: `inStats?` missing = included; `computeStats` filters; "Sin etiqueta" gone.
- #4: `holiday?` (badge all surfaces, not tooltips; form order stats→Festivo;
  saves force `inStats` off).
- #5: `permit?`+`maxPerYear?` (only when permit); editor forces `inStats`
  on/disabled, exclusive with Festivo; permits get their own group in both bars.
- #6: year permit row "U de N · Restantes R" (red if negative); month bar plain
  count; detail modal unchanged.
- Stack: Vite + React 19 + TS + date-fns, plain CSS; defaults/UX in release-notes.md.
- Chip interaction: 250ms click debounce, 600ms hold; document-level swallow of
  the release click after a hold (chip unmounts → it could hit the day below).

## Lessons Learned and Mistakes to Avoid
- No setState inside updaters; compute derived values (and "did it apply") first.
- A condition on a patch field must compare the PREVIOUS state (base), not the
  patch — the editor sends every flag each save (silent #7 sync bug).
- Two `toggleDayTag` in ONE `act()` are stale (reads pre-flush state) → one
  `act()` per toggle in tests; app clicks flush separately.
- Date tests: compare calendar fields (getDate()) not timestamps (DST).
- pt→px in print: A5 landscape content ≈515px tall; keep print styles compact.

## Next Steps
- #9: navigator commit (suggest message below) + `/code-review` + manual
  notice check; release-notes.md pending (v0.3.0, incl. README "untagged days"
  and the storage-key mention).
- Optional: interaction rule (1 click = details, dblclick/hold = destructive) to AGENTS.md if it becomes a rule.
