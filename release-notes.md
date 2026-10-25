# Release notes

All notable changes to the Annual Planner webapp.
Format based on [Keep a Changelog](https://keepachangelog.com/), versioning
following [SemVer](https://semver.org/).

## [0.2.0] - 2026-10-25

Tag subtitles, user-managed tag types and a new tag interaction model.

### Added

- **Subtitle per day application**: one click on a tag chip opens a little
  detail modal with every detail of the application (label, type, color, date,
  times applied in the year), an editable subtitle (max 60 characters) and a
  "Quitar del día" button. The subtitle belongs to each (day, tag) pair — it
  is not part of the tag template — and shows in the chip tooltip (year view)
  and as a second line inside month-view chips (it prints too).
- **Tag types CRUD**: types (Trabajo, Festivo local, …) are now stored per
  planner and can be created, renamed and deleted from the tags editor. The
  "Tipo" select is fed by them; deleting a type still used by tags is blocked
  with an explanatory notice.

### Changed

- **Chip interaction**: one click (250 ms debounce, so double clicks can be
  detected) opens the detail modal; **double click or a ~600 ms press-and-hold
  removes the tag from that day directly**. Clearing mode ("🧽 Limpiar día")
  keeps the previous one-click behaviour; archived planners stay read-only.

### Notes

- Storage keeps the `annual-planner:v1` key: legacy data (plain tag-id arrays
  in `days`, missing `tagTypes`) is normalized on load **and** on import, so
  existing localStorage and old export files keep working. Compatibility is
  one-way: exports written by 0.2.0 are rejected by 0.1.x builds.

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
