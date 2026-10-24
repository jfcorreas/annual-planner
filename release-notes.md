# Release notes

All notable changes to the Annual Planner webapp.
Format based on [Keep a Changelog](https://keepachangelog.com/), versioning
following [SemVer](https://semver.org/).

## [0.1.0] - 2026-10-24

First version: create, customize and fill annual planners, entirely in the
browser (no auth, no server, localStorage only).

### Added

- Unlimited planners, one per year, with **Activo** (editable) / **Archivado**
  (read-only) states, toggleable at any time.
- One-click/touch filling of days with tags, up to 2 tags per day.
- Default tags: Guardia 24h, Guardia 17h, Diurno 12h, Nocturno 12h, Turno 24h,
  Festivo local, Festivo regional, Festivo nacional.
- User-defined tags: name, type (trabajo / festivo local / regional / nacional)
  and color.
- Year view by default (12 month columns); month zoom overlapping the year view.
- Statistics (count per tag + untagged days) at the bottom of the year and month views.
- Export / import of all planners as JSON, with validation and confirmation.
- PDF export in A4 and A5 (landscape) through the browser print dialog.
- UI in Spanish (ES/ES), Monday as first day of the week.
- Test suite: `npm test` (unit + component, Vitest + Testing Library) and
  `npm run test:e2e` (end-to-end, Playwright).
