# Release notes

All notable changes to the Annual Planner webapp.
Format based on [Keep a Changelog](https://keepachangelog.com/), versioning
following [SemVer](https://semver.org/).

## [0.3.0] - 2026-11-08

Tags re-implemented from scratch: flat tags with per-tag flags, work-permit
tracking and global tags. Clean break with 0.2.x data.

### Added

- **Statistics flag**: each tag can be included in or excluded from the
  statistics bars ("Incluir en estadísticas").
- **Holiday flag**: "Día Festivo" marks a tag as a holiday (🏖️ badge) and keeps
  it out of the statistics automatically. The three "Festivo …" default tags
  ship with this flag.
- **Work permit**: "Permiso de trabajo" (🪪 badge) with a required "Máximo por
  año". Permits are always counted and get their own group in both statistics
  bars.
- **Used/remaining counter**: the year bar shows "U de N · Restantes R" for each
  permit, highlighted in red when the remaining days go negative. Applications
  are never blocked or capped.
- **Global tags**: "Global" (🌐) shares a tag across every planner, kept in sync
  (name, color and flags). New planners start with the defaults plus the current
  globals. Unmarking is blocked while another planner uses the tag; deleting is
  blocked while any planner uses it, with the total usage in the toast.
- **Delete guard**: deleting a tag applied on any day is blocked with a
  usage-count toast.

### Changed

- **Tag model**: tags are now a flat list of name + color + flags — the tag
  type/category is gone.
- **Tags editor**: one form for name, color and the four flags; the permit max
  only appears while the permit box is checked, and permit/holiday are mutually
  exclusive.
- **Statistics bars**: only included tags are listed (holidays are out), permits
  render in a separate group after the regular tags, and the year permit row
  adds the used/max/remaining counter. The "Sin etiqueta" row is gone.
- **Storage**: the format is now `version: 2` under the new
  `annual-planner:v2` key.

### Removed

- Tag types: the type model, the types CRUD in the editor and the "Tipo" select.
- The "Sin etiqueta" row from the statistics bars.

### Notes

- **Clean break**: data saved by 0.2.x under `annual-planner:v1` is not loaded.
  A blocking notice explains it and offers "Empezar de cero"; nothing is saved
  before confirming, and the old entry is never read or deleted.
- Importing a `version: 1` export is refused with "El archivo es de una versión
  anterior y ya no es compatible."; other invalid files keep the generic
  message.
- Current-format files with legacy string day ids are still normalized; only the
  format version gates the refusal.

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
