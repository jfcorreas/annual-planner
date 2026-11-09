# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.4.0 released on top of `v0.3.0` (tagged): phone/LAN fixes, transposed
  portrait month view, new favicon and the about modal. Pending commit + tag.
- Phone/LAN work (blank screen, month view, favicon, about modal) is documented
  in `release-notes.md`.
- Mobile/LAN test: `python3 -m http.server 4831 --bind 0.0.0.0 --directory dist`
  → `http://<LAN-IP>:4831`. Green: tsc -b, oxlint, `npm test` (148),
  `npm run test:e2e`.
- Installed as Omarchy web app (:4830, systemd `annual-planner`); **re-copy
  `dist/.` after each build** (AGENTS).

## Decisions (and why)
- Tag = {id, label, color, inStats?, holiday?, permit?, maxPerYear?, global?};
  flat list (no types), subtitle per-day on DayTag, delete blocked if used.
- Flags: holiday (stats off, 🏖️), permit (own stats group, 🪪, max/year, can go
  negative), global (same-id copies synced, 🌐 only in editor + detail modal).
- Statistics: `inStats?` missing = included; permits bypass the filter; no
  "Sin etiqueta"; month bar plain counts, year bar adds "U de N · Restantes R".
- Global: unmark/delete blocked while other planners use it ("N días en M
  planificadores"); unused-elsewhere unmark clears the flag everywhere;
  new planners = defaults + globals.
- Storage v2: `version: 2` under `annual-planner:v2`; v1 never read or deleted —
  blocking "Empezar de cero"; v1 imports refused; v2 normalizes string day ids.
- Chip: 1 click = detail modal (250ms debounce), dblclick / 600ms hold = remove.
- About modal: ℹ️ left of the planner title, version imported from package.json
  (`resolveJsonModule: true` in tsconfig.app.json).
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
