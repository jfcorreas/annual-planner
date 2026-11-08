# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.3.0 complete (tags rework #1–#9, #8 discarded); pending commit + `v0.3.0`
  tag. Details archived in `archive/backlog-v0.3.0-tags-rework.md`.
- Phone/LAN fixes (blank screen, month view) are documented under `[Unreleased]`
  in `release-notes.md`; they also touch ids and the month view CSS.
- Mobile/LAN test: app serves fine at `http://<LAN-IP>:4831` (`python3 -m
  http.server 4831 --bind 0.0.0.0 --directory dist`); path for Option 1.
- Green: `tsc -b`, oxlint, `npm test` (146 unit+component), `npm run test:e2e`.
- Installed as Omarchy web app (:4830, systemd `annual-planner`); **re-copy
  `dist/.` after each build** (AGENTS). :4830 confirmed with the #9 build.

## Decisions (and why)
- Tag = {id, label, color, inStats?, holiday?, permit?, maxPerYear?, global?};
  no tag types (flat list); subtitle stays per-day on DayTag.
- Flags: holiday (stats off, 🏖️), permit (own stats group, 🪪, max/year,
  used/remaining, can go negative), global (same-id copies synced across
  planners, 🌐 only in editor + detail modal); delete blocked if used anywhere.
- Statistics: `inStats?` missing = included; permits bypass the filter; no
  "Sin etiqueta" row; month bar plain counts, year bar adds "U de N ·
  Restantes R" (red if negative).
- Global: unmark blocked if another planner uses it; unused-elsewhere unmark
  clears the flag everywhere (copies stay, sync stops); delete blocked with
  "N días en M planificadores"; new planners = defaults + globals.
- Storage v2: `version: 2` under `annual-planner:v2`; v1 data is never read or
  deleted — blocking "Empezar de cero" notice; v1 imports refused with a
  specific message; v2 still normalizes string day ids.
- Chip interaction: 1 click = detail modal (250ms debounce), double click /
  600ms hold = remove; document-level swallow of the release click.
- Stack: Vite + React 19 + TS + date-fns, plain CSS.

## Lessons Learned and Mistakes to Avoid
- Phones over a LAN: plain `http://<IP>` is NOT a secure context, so
  `crypto.randomUUID` is missing (white screen). Use `newId()` from
  `src/defaults.ts` for any new id.
- Month zoom: the overlay must be VIEWPORT-sized (`position: fixed` below 1100px,
  where the year view wraps and `.planner` is taller than the screen). Portrait
  grid (<700px) is transposed CSS-only: rows + header `display: contents`,
  `grid-auto-flow: column`, 7 dow spans pinned to column 1, `WEEKDAY_INITIALS`.
- No setState inside updaters; compute derived values (and "did it apply") first.
- A condition on a patch field must compare the PREVIOUS state (base), not the
  patch — the editor sends every flag each save (silent #7 sync bug).
- Two `toggleDayTag` in ONE `act()` are stale (reads pre-flush state) → one
  `act()` per toggle in tests; app clicks flush separately.
- Date tests: compare calendar fields (getDate()) not timestamps (DST).
- pt→px in print: A5 landscape content ≈515px tall; keep print styles compact.

## Next Steps
- Commit + tag v0.3.0 (see release-notes.md); optional `/code-review`.
- Optional: interaction rule (1 click = details, dblclick/hold = destructive) to AGENTS.md.
- Phone month view: tag labels still ellipsize ("Guar…") in ~55-67px cells;
  open question = dot/icon-only chips or keep labels and let them clip.
