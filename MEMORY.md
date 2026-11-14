# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.8.0 (A4-only PDF; A5 button and rules removed; print stats = desktop
  layout with 2px smaller fonts, locked by e2e). Pages redeploy from `main`; the
  PWA picks the build up after two reloads.
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
  `@page` rule and sets `body[data-paper="A4"]`. Print stats = desktop layout
  with fonts 2px smaller (year 62 / items 10 / counts 9px), locked by an e2e
  measurement under print media at the A4 page box.
- No tag selected by default: clicking the active palette chip deselects it; with
  no tag (or an archived planner) a day click opens the day detail modal.
- **Chip text (desktop spec)**: `tagAcronym` = uppercase initial of each word +
  digits (`Guardia 24h` → `G24`, `Festivo local` → `F`; user kept this rule);
  no capital → first letter of every word. Fit is **measured** in `TagChip`
  (`useLayoutEffect` each commit + `ResizeObserver`): `label.scrollWidth` vs
  chip width − padding − icon − gap; the hidden label stays in the DOM at
  `position:absolute; width:0` so measurement never depends on the decision
  (`display:none` via media query counts as "does not fit"). Flags:
  `labelled = month || (wide && !sub)`, `abbrev = labelled && !fits` →
  `--abbrev` class. Year (always one line): 1 tag no subtitle → icon + full
  name (`🏖️ Festivo local`); 1 tag + subtitle → acronym + glued
  `(subtitle)` (`G24(Titular: Juanfran)`, label not rendered); 2 tags →
  acronym only, no icon. Month desktop: two lines iff subtitle (icon + full
  name / `(subtitle)`), else one line; top line falls back to icon + acronym
  when it does not fit. Subtitle yields width first (acronym never cut; a
  long subtitle ellipsises, full text on tooltip). Small cells: portrait
  (≤700) keeps forcing the acronym and hiding the subtitle (untouched);
  landscape (≤1100) shows text — with subtitle icon + acro + glued
  `(subtitle)`, without subtitle icon + full name (fit fallback → acro),
  driven by `:has(.tag-chip__sub)` hiding the label there. Flagged for
  review: a too-long year name also falls back to the acronym; A4 print
  reuses screen-measured chips. Verified with Chromium at 1460 + phone
  portrait/landscape (e2e step 7b + phone test).
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
- Desktop chip spec + phone landscape chips done (commits local, push to
  `main` deploys Pages — ask).
- Later: A4 print chip layouts.
