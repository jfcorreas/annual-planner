# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.8.1 (A4-only PDF with outlined black-text chips + stats 2px smaller;
  tightened day columns now on screen too — year view desktop + mobile; all
  locked by e2e). Pages redeploy from `main`; the PWA picks the build up after
  two reloads.
- Green: `tsc -b`, oxlint, `npm test` (174), `npm run test:e2e` (2: full flow +
  phone portrait/landscape).
- Installed as Omarchy web app (:4830, systemd `annual-planner`): after a build
  `cp -a dist/. ~/.local/share/annual-planner/`, then reload twice (the PWA worker
  serves the previous build once). LAN: `python3 -m http.server 4831 --bind
  0.0.0.0 --directory dist`.
- Pages deploy: workflow on push to main builds with `--base=/annual-planner/`
  (never commit a Pages-based dist locally).

## Decisions (and why)
- Tag = {id, label, color, inStats?, holiday?, permit?, maxPerYear?, global?};
  flat list (no types), subtitle per-day on DayTag, delete blocked if used.
- Flags: holiday (stats off, 🏖️), permit (own stats group, 🪪, max/year, can go
  negative), global (same-id copies synced, 🌐 only in editor + detail modal).
- Statistics: `inStats?` missing = included; permits bypass the filter; month bar
  plain counts, year bar adds "U de N · Restantes R". Permits = 2-col grid
  (`flex: 1.5 1 0`), count 11px right-aligned and never truncated (it drops to a
  2nd line inside its column); `.stats` is `align-items: flex-start`.
- Storage v2 under `annual-planner:v2`; v1 never read (blocking "Empezar de cero").
- PDF: **A4 landscape only** (A5 removed in 0.8.0); `printPlanner()` injects the
  `@page` rule and sets `body[data-paper="A4"]`. Day rows use the tightened
  columns (number 22→15px, weekday 16→9px, gaps → 1px: chips start at 26px not
  42, +16px of text width) in the **base `.day` rule** since 0.8.1 — screen year
  view and paper share them (`.zoom .day` is `display: block`, so the month zoom
  never sees grid columns). Print-only: chips lose their fill for a 1px
  `var(--tag-color)` border (hex set inline on DayCell) with forced black text
  (`!important` beats the inline bg/colour); stats = desktop layout with fonts
  2px smaller (year 62 / items 10 / counts 9px). Locked by e2e: columns at
  1460 + 390 + print media, print chip styles at the A4 page box (1077×748px).
- No tag selected by default: clicking the active palette chip deselects it; with
  no tag (or an archived planner) a day click opens the day detail modal.
- **Chips (spec, all locked by unit + e2e)**: acronym = uppercase initials +
  digits (`Guardia 24h` → `G24`, `Festivo local` → `F`; user's rule). Fit is
  **measured** in `TagChip` (`label.scrollWidth` vs chip room; the hidden label
  stays `position:absolute; width:0` so measurement never depends on the
  decision; media-query `display:none` counts as "does not fit"). Year: full
  name / acro + glued `(sub)` / acro only (2 tags). Month desktop: two lines
  iff subtitle, top line falls back to icon + acro. Phone portrait: forced
  acro + hidden sub; landscape (≤1100): acro + `(sub)` or full name (`:has()`
  rule). Flagged for review: a too-long name falls back to the acronym.
- Chip: 1 click = detail modal (250ms debounce), dblclick / 600ms hold = remove;
  a drag >10px cancels the hold (it is a month swipe, not a hold).
- Day number = button → DayDetailModal (read-only, year view and zoom);
  stopPropagation on click/Enter/Space only — NOT on Escape (modal must close).
- Backdrop z-index 55 (zoom 50, toast 60). Tags editor: `.modal--tags` pins
  header/form, only the card grid scrolls (whole modal above 560px tall).
- Stack: Vite + React 19 + TS + date-fns, plain CSS; PWA via `vite-plugin-pwa@2`.

## Month zoom (≤1100px = fixed, viewport-sized overlay)
- Portrait (≤700px): transposed CSS-only grid, fits with no scroll — untouched.
- Lateral drag ≥48px and |dx| ≥ 1.2·|dy| → next/prev month (bounded by Jan/Dec);
  `onClickCapture` swallows the trailing click (no accidental fill).
- Landscape (≤1100px + landscape): grid has **no** internal scroll; `.zoom` scrolls
  and `.zoom__stats` waits below the fold (e2e-checked). `touch-action: pan-y`.

## Lessons Learned and Mistakes to Avoid
- The open zoom covers the palette: in e2e click palette chips before opening the
  month (Playwright waits forever on an obstructed click).
- A test ending right after a chip hold leaves `swallowNextClick()` armed: fire a
  throwaway click (`document.body`) so it cannot swallow the next test's click.
- Phones over LAN: plain `http://<IP>` is not a secure context → no
  `crypto.randomUUID` (white screen); use `newId()` from `defaults.ts`. Service
  workers need a secure context too: PWA only on `localhost`/`https/`.
- React: no setState inside updaters (compute derived values first); a patch-field
  condition compares the PREVIOUS state. One `act()` per `toggleDayTag` in tests.
- Date tests: compare calendar fields (getDate()), not timestamps (DST).
- Layout changes are verified with real Chromium metrics + screenshots, never by
  reading the CSS (the stats grid and the chip text were measured at 4 widths).

## Next Steps
- Chip specs done (desktop / phone portrait+landscape / A4 print); commits
  stay local — push to `main` (deploys Pages) only when the user says.
