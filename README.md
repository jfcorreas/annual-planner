# annual-planner

Webapp to create, customize and fill annual planners (year wall-planner style).

- Built with **Vite + React + TypeScript + date-fns**, plain CSS with variables.
- **No auth, no server**: all data lives in your browser (localStorage).
- UI in Spanish (ES/ES), Monday as first day of the week.

## Features

- Create and manage as many planners as you want — one per year.
- Two states per planner: **Activo** (editable) and **Archivado** (read-only).
- Fill/clean days with predefined tags in one click or touch, up to 2 tags per day.
  Default tags: Guardia 24h, Guardia 17h, Diurno 12h, Nocturno 12h, Turno 24h,
  Festivo local, Festivo regional, Festivo nacional — all editable.
- Create your own tags with a **name, color and flags**:
  - **Incluir en estadísticas** — count the tag in the bars or keep it out.
  - **Día Festivo** (🏖️) — leaves the statistics automatically.
  - **Permiso de trabajo** (🪪) — always counted, in its own group, with a
    **Máximo por año** and a used/remaining counter (can go negative).
  - **Global** (🌐) — the same tag in every planner, kept in sync.
- Deleting a tag that is applied on any day is blocked with a usage-count toast.
- Year view by default; click a month title to zoom into the month (overlays the
  year view).
- Statistics at the bottom of both views: count per included tag, plus the permit
  group with used/max/remaining.
- One click on a day chip opens its detail modal (subtitle, applications this
  year); double click or press-and-hold removes the tag from that day.
- Export / import all planners as a JSON file (with confirmation before
  importing). Files from 0.2.x and older are refused.
- Export the planner to **PDF in A4** (landscape) through the browser print
  dialog.
- Unicode icons throughout the UI.

## Run

```bash
npm install     # first time only
npm run dev     # dev server with HMR
```

Build / preview / lint:

```bash
npm run build   # type-check + production build
npm run preview # serve the production build
npm run lint    # oxlint
```

## Tests

```bash
npm test         # unit + component (Vitest + Testing Library, jsdom)
npm run test:watch   # watch mode
npm run test:e2e     # end-to-end (Playwright; builds + runs vite preview on :4173)
npm run test:all     # unit + component, then e2e
```

- Unit/component tests sit next to the code (`src/**/*.test.ts(x)`), driven by
  `vite.config.ts` (`test` block) and `src/test/setup.ts`.
- The e2e suite lives in `tests/e2e/` and is configured by `playwright.config.ts`.
  First run only: `npx playwright install chromium`.

Open the printed URL (default http://localhost:5173).

## Project structure

```
src/
  types.ts                 # Tag / Planner / AppData model
  defaults.ts              # default tags + createPlanner()
  storage.ts               # localStorage (v2) + JSON import/export (validated)
  hooks/useAppData.ts      # all app state and mutations
  utils/dates.ts           # ES/ES names, Monday-first weeks, ISO keys
  utils/stats.ts           # tag counts per period (incl. permits)
  utils/tags.ts            # tag badges (🏖️ / 🪪 / 🌐)
  utils/print.ts           # A4 landscape print (PDF)
  test/setup.ts            # Vitest setup (crypto polyfill, localStorage reset)
  components/              # TopBar, TagPalette, YearView, MonthColumn,
                           # WeekRow, DayCell, MonthZoom, StatsBar,
                           # PlannersPanel, TagsEditor, TagDetailModal
tests/
  e2e/                     # Playwright end-to-end specs
```

## Data & privacy

Everything is stored only in your browser under the `annual-planner:v2` key.
Nothing is sent anywhere. Use **📤 Exportar** to back up your data or move it to
another device/browser, and **📥 Importar** to load it back.

Data and exports from 0.2.x are **not migrated**: the app shows a notice and
offers to start fresh, and the old `annual-planner:v1` entry is never read or
deleted. Older export files are rejected with a specific message.
