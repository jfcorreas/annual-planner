# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.7.1 (stats: work-permit stats in two columns). Pages redeploy from `main`;
  the PWA picks the build up after two reloads.
- Green: `tsc -b`, oxlint, `npm test` (164), `npm run test:e2e` (2, incl. a
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
- **Stats panel look (v0.7.1)**: `.stats__list--permits` is a 2-col grid applied
  everywhere (year footer, month zoom, print) with `flex: 1.5 1 0` (3/5 of the
  panel, the regular counts keep 1); `.stats__count` is 11px (was 16) and
  `.stats` is `align-items: flex-start`, so year, counts and permits share the
  top line instead of being bottom-aligned. The count is right-aligned and never
  truncated: it drops to a second line inside its column when name + count do not
  fit side by side; only a name wider than the column ellipsizes (the `title`
  keeps the full text), and a single permit spans both columns. Checked with
  Chromium at 1440/1280/900/390 + A5 PDF (still 1 page).
- Storage v2 under `annual-planner:v2`; v1 never read (blocking "Empezar de cero").
- **No tag selected by default**: clicking the active palette chip deselects it.
  With no active tag (or an archived planner) a click on a day opens the day
  detail modal — no toast, no fill. Selection resets when the planner changes.
- Chip: 1 click = detail modal (250ms debounce), dblclick / 600ms hold = remove;
  a drag >10px cancels the hold (it is a month swipe, not a hold).
- Day number = button → DayDetailModal (display-only, works read-only, in year
  view and zoom, every device); stopPropagation on click/Enter/Space only —
  NOT on Escape, or the modal could not be closed by keyboard.
- Icon-only month chips only ≤700px + landscape (label/sub hidden in CSS);
  desktop zoom keeps labels. Backdrop z-index 55 (zoom 50, toast 60).
- Tags editor (v0.7.0): `.modal--tags` is a flex column — header/form pinned,
  the card grid (`auto-fill minmax(190px, 1fr)`) is the only scroller; above
  560px tall the whole modal scrolls instead. Tests read colours from the row's
  `style`, not from `.stats__swatch`.
- Stack: Vite + React 19 + TS + date-fns, plain CSS; PWA via `vite-plugin-pwa@2`
  (the only build-time dep).

## Month zoom (≤1100px = fixed, viewport-sized overlay)
- Portrait (≤700px): transposed CSS-only grid, fits with no scroll — untouched.
- Lateral drag ≥48px and |dx| ≥ 1.2·|dy| → next/prev month (bounded by Jan/Dec,
  same as ◀ ▶); `onClickCapture` swallows the trailing click (no accidental fill).
- Landscape (≤1100px + landscape): grid has **no** internal scroll (`min-height:
  0`, `.day { overflow: hidden }`); `.zoom` scrolls, `.zoom__stats` sits at
  `top: 100%` below the fold (e2e-checked). `touch-action: pan-y pinch-zoom`.

## Lessons Learned and Mistakes to Avoid
- The open zoom overlay covers the palette: in e2e click palette chips before
  opening the month (Playwright waits forever on an obstructed click).
- A test ending right after a chip hold leaves `swallowNextClick()` armed at
  document level: fire one throwaway click (`document.body`) so it cannot
  swallow the next test's first click.
- Phones over LAN: plain `http://<IP>` is NOT a secure context, so
  `crypto.randomUUID` is missing (white screen). Use `newId()` from `defaults.ts`.
- Service workers need a secure context too: PWA only on `localhost`/`https/`.
- No setState inside updaters; compute derived values (and "did it apply") first.
- A condition on a patch field must compare the PREVIOUS state (base), not the patch.
- Two `toggleDayTag` in ONE `act()` are stale → one `act()` per toggle in tests.
- Date tests: compare calendar fields (getDate()) not timestamps (DST).
- pt→px in print: A5 landscape content ≈515px tall; keep print styles compact.
- A layout change is verified with real Chromium metrics (`getBoundingClientRect`
  + screenshots), not by reading the CSS: the 2-column fit was measured at 4
  widths before writing the rules.

## Next Steps
- Optional `/code-review`.
