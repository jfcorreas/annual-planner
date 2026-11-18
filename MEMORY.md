# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.10.0 + **story #1** (copy previous palette on create, cb92607): checkbox
  only when the previous year exists; exact tag copy, days never copied.
  Release notes pending a version bump in `release-notes.md`.
- Green: `tsc -b`, oxlint, `npm test` (192), `npm run test:e2e` (5: full flow,
  phone portrait/landscape, palette order, stats order, today cell).
- Nothing since v0.9.0 is pushed: **never push without asking the user**.
- Installed Omarchy web app (:4830, systemd `annual-planner`): after a build
  `cp -a dist/. ~/.local/share/annual-planner/` and reload twice (the PWA
  worker serves the previous build once). LAN: `python3 -m http.server 4831
  --bind 0.0.0.0 --directory dist`.

## Backlog context — new-planner copy options
- #2 holiday-chip copy still open: also copies the holiday tag definitions so
  the chips render; independent, no `Requires`. #1 shipped in `backlog.md`.
- Copy option travels explicitly: form → `onCreate(year, options)` →
  `addPlanner(year, options)`; story #2 adds `copyHolidays` to that object.
- Stack reaffirmed: existing Vite/React/TS + local storage, Spanish UI; no new
  multi-tenant, roles, sync or i18n decisions.

## Decisions (and why)
- Tag = {id, label, color, inStats?, holiday?, permit?, maxPerYear?, global?};
  flat list; order = position in `planner.tags` (palette + stats follow it);
  delete blocked while used. Flags: holiday (stats off, 🏖️), permit (own group,
  🪪, max/year, can go negative), global (🌐 only in editor + detail modal).
- Stats: missing `inStats` = included; permits bypass the filter; year bar
  "U de N · Restantes R"; permits in a 2-col grid. Counts: grey only at
  `Restantes 0`, red when negative, `--ink` otherwise.
- **Chips (locked by unit + e2e)**: acronym = uppercase initials + digits; fit
  **measured** in `TagChip` (hidden label stays width 0 so the measurement never
  depends on the decision; `display:none` = "does not fit"). Year one line;
  month two lines iff subtitle; phone portrait forced acronym.
- Chip: 1 click = detail modal (250ms debounce), dblclick / 600ms hold =
  remove; drag >10px cancels the hold. Day number = button → DayDetailModal
  (stopPropagation on click/Enter/Space, NOT on Escape).
- **Today (0.10.0)**: `TODAY_ISO` fixed at module load in `DayCell` (oxlint
  purity: no `new Date()` in render) → `.day--today`, colours `--today` /
  `--today-bg`. Its ring is a `::after` with `inset: -1px` (the cell needs
  `position: relative`): drawn 1px OUTSIDE the box, over both row separators,
  so it keeps the row height and the chips (which reach the row edge) can
  never cover it — an inset shadow is painted under the content and was.
  The zoom's real border and that ring land on the same line. Hover repeats
  the tint (same specificity, later wins). It also prints.
- No tag selected by default (the active chip deselects itself; a day click
  then opens the detail modal). Storage v2 under `annual-planner:v2`.
- PDF: A4 landscape only, `printPlanner()` injects `@page` + `body[data-paper]`;
  tightened day columns in the base `.day` rule; print chips = 1px border +
  black text; `.zoom` hidden.
- Backdrop z-index 55 (zoom 50, toast 60). Stack: Vite + React 19 + TS +
  date-fns, plain CSS; PWA via `vite-plugin-pwa@2`.

## Month zoom (≤1100px = fixed, viewport-sized overlay)
- Portrait (≤700px): transposed CSS-only grid, no scroll; landscape: no inner
  scroll, `.zoom` scrolls to the stats below the fold. Lateral drag ≥48px and
  |dx| ≥ 1.2·|dy| → next/prev month (Jan/Dec bounded), trailing click swallowed.

## Lessons Learned and Mistakes to avoid
- The open zoom covers the palette: click palette chips before opening the month.
- A test ending after a chip hold leaves `swallowNextClick()` armed: fire a
  throwaway click (`document.body`).
- `http://<LAN-IP>` is not a secure context: no `crypto.randomUUID` (use
  `newId()`) and no service worker (PWA only `localhost`/`https/`).
- React: no setState inside updaters (compute first); a patch-field condition
  compares the PREVIOUS state; one `act()` per `toggleDayTag`. Date tests
  compare calendar fields, not timestamps (DST).
- Layout/visual changes are verified with real Chromium metrics, computed
  styles and screenshots — never by reading the CSS.
