# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.5.0 built (not tagged): month zoom swipe + landscape fit. `release-notes.md`
  updated; Pages/PWA still serve 0.4.0 until this is pushed to `main`.
- Green: `tsc -b`, oxlint, `npm test` (153), `npm run test:e2e` (2, incl. a
  phone-viewport test: portrait + landscape).
- LAN test: `python3 -m http.server 4831 --bind 0.0.0.0 --directory dist`.
- Installed as Omarchy web app (:4830, systemd `annual-planner`); **re-copy
  `dist/.` after each build, then reload twice** (the PWA worker serves the
  previous build once).
- Pages deploy: workflow on push to main builds with `--base=/annual-planner/`
  (never commit a Pages-based dist locally).

## Decisions (and why)
- Tag = {id, label, color, inStats?, holiday?, permit?, maxPerYear?, global?};
  flat list (no types), subtitle per-day on DayTag, delete blocked if used.
- Flags: holiday (stats off, 🏖️), permit (own stats group, 🪪, max/year, can go
  negative), global (same-id copies synced, 🌐 only in editor + detail modal).
- Statistics: `inStats?` missing = included; permits bypass the filter; month bar
  plain counts, year bar adds "U de N · Restantes R".
- Storage v2 under `annual-planner:v2`; v1 never read (blocking "Empezar de cero").
- Chip: 1 click = detail modal (250ms debounce), dblclick / 600ms hold = remove;
  a drag >10px cancels the hold (it is a month swipe, not a hold).
- Stack: Vite + React 19 + TS + date-fns, plain CSS; PWA via `vite-plugin-pwa@2`
  (the only build-time dep).

## Month zoom (≤1100px = fixed, viewport-sized overlay)
- Portrait (≤700px): transposed CSS-only grid, fits with no scroll — untouched.
- Lateral drag on `.zoom` ≥48px and |dx| ≥ 1.2·|dy| → next/prev month (bounded
  by Jan/Dec, same as the ◀ ▶ buttons); `onClickCapture` swallows the trailing
  click so no day is filled by mistake.
- Landscape (≤1100px + `orientation: landscape`): grid has **no** internal
  scroll (row/day `min-height: 0`, `.day { overflow: hidden }`); `.zoom` scrolls
  and `.zoom__stats` is `position: absolute; top: 100%` (out of the flow): the
  grid takes the whole screen and the panel waits below the fold (e2e-checked).
- `touch-action: pan-y pinch-zoom` on `.zoom` keeps horizontal drags for us.

## Lessons Learned and Mistakes to Avoid
- Phones over LAN: plain `http://<IP>` is NOT a secure context, so
  `crypto.randomUUID` is missing (white screen). Use `newId()` from `defaults.ts`.
- Service workers need a secure context too: PWA only on `localhost`/`https://`.
- No setState inside updaters; compute derived values (and "did it apply") first.
- A condition on a patch field must compare the PREVIOUS state (base), not the patch.
- Two `toggleDayTag` in ONE `act()` are stale → one `act()` per toggle in tests.
- Date tests: compare calendar fields (getDate()) not timestamps (DST).
- pt→px in print: A5 landscape content ≈515px tall; keep print styles compact.

## Next Steps
- Optional `/code-review`.
- Phone month view: tag labels ellipsize in small cells; open question =
  dot/icon-only chips or keep labels and let them clip.
