# Release notes

All notable changes to the Annual Planner webapp.
Format based on [Keep a Changelog](https://keepachangelog.com/), versioning
following [SemVer](https://semver.org/).

## [0.7.2] - 2026-11-14

Every day chip now carries readable text instead of a bare colour bar or an
icon, following a fixed rule per view: the full tag name when it fits, its
acronym when it does not.

### Added

- **Acronym on every chip**: a new helper turns a tag name into its acronym —
  the uppercase initial of each word plus its digits (`Guardia 24h` → `G24`,
  `Diurno 12h` → `D12`). Lowercase words are ignored (`Festivo local` →
  `F`), and a name with no capital falls back to the first letter of each word
  so a chip is never empty. The full name and subtitle stay on the tooltip.
- **Real fit measurement**: each chip measures its own label on every render
  and resize (a `ResizeObserver` on the chip). When the full name does not fit
  next to the icon, the acronym takes the line over — the name is never
  clipped mid-word, and the hidden label stays in the DOM (width 0, still
  measurable) so the decision can be retaken at any time.

### Changed

- **Year view (always one line)**: a day with a single tag and no subtitle
  shows icon + full name (`🏖️ Festivo local`). The subtitle takes the room
  instead, so the chip reads icon + acronym + glued subtitle
  (`G24(Titular: Juanfran)` — the acronym is never ellipsised; a very long
  subtitle shortens with an ellipsis, its full text on the tooltip). A day
  with two tags only has room for the acronym on both chips — no icon, no
  subtitle. If a single tag's name is too long for the bar, it also falls
  back to icon + acronym.
- **Month zoom on desktop**: a chip with a subtitle has two lines — icon +
  full name on the top one, `(subtitle)` on the bottom one — and a chip
  without one is a single line. When the top line does not fit, it shows
  icon + acronym instead of a clipped name.
- **Small cells (phone/tablet)** keep their existing behaviour: the media
  queries still force the acronym, so nothing changed there yet.
- The subtitle is what gives up its width first, so the acronym is never cut.

## [0.7.1] - 2026-11-13

The statistics panel shows the work permits in two columns and reads as one
compact row of data.

### Changed

- **Permit stats in two columns**: in the year footer, the month zoom and the
  PDF export, the permits of the planner (🪪) are shown side by side, two per
  row, instead of one under the other, and the group takes 3/5 of the width of
  the panel so a name and its count fit on one line on a laptop. The count keeps
  its full “2 de 4 · Restantes R” text: when the column is not wide enough for
  both on one line, the count moves to a second line **inside the same column**
  (numbers are never cut off) and only a name longer than the whole column is
  shortened with an ellipsis — its full text stays on the tooltip. The count is
  right-aligned inside its column, and a single permit takes the whole width
  rather than half of it.
- **Smaller counts**: the number of every statistic is 11px instead of 16px, so
  the panel is not dominated by big numbers.
- **Everything aligned to the top**: the year, the regular counts and the
  permits all start at the top of the panel, so their first line lines up even
  when one group is taller than the others (they were bottom-aligned before,
  which pushed the regular counts below the taller permit group).

## [0.7.0] - 2026-11-11

The tags editor shows the tags as a grid and keeps the form on screen all
the time.

### Changed

- **Tags as a grid**: the tags of a planner are shown as cards, two per row
  (one on small phones), instead of one row per tag. The colour now paints the
  left edge of the card, the label truncates with an ellipsis (the full name
  stays on the tooltip) and the ✏️/🗑️ buttons carry a name for screen readers.
- **The form is always visible**: the editor modal no longer scrolls as a
  whole. Its header and the new/edit tag form are pinned and only the tag list
  scrolls, so the form cannot disappear while looking for a tag. On very short
  screens (phone landscape, ≤560px tall) the modal scrolls as a fallback while
  the list keeps a bounded, independent scroll area.

## [0.6.0] - 2026-11-11

The palette can now leave the planner with no active tag, and the clear-day
mode is gone.

### Changed

- **No tag selected by default**: the palette no longer pre-selects the first
  tag, and clicking the active chip deselects it again. While nothing is
  selected, a click (or tap) anywhere on a day opens its detail modal instead
  of filling it — a stray click can no longer mark a day. The hint text above
  the chips says which of the two modes you are in: “Etiqueta activa: …” or
  “Sin etiqueta activa: …”.
- **Clicking a day in an archived planner**: the empty area of a day now opens
  its detail modal as well (only the number did before), so read-only planners
  are browsable by clicking anywhere on a day. The pointer cursor replaced the
  “not allowed” one.
- The tags editor button reads **“✏️ Etiquetas”** (pencil icon) instead of
  “＋ Etiquetas”.
- The tag selection belongs to one planner: switching, creating, deleting or
  importing planners starts again with no tag selected.

### Removed

- **Clear mode (“🧽 Limpiar día”)** and its button: emptying a day keeps
  working through the tag chip (double click or press-and-hold) and through
  the tag detail modal (“Quitar del día”).

## [0.5.1] - 2026-11-10

Readability of the month view on small screens, and a new modal that shows
the full detail of any day.

### Added

- **Day detail modal**: clicking or tapping the day number (in the year view
  and in the month zoom, on any device, also in archived read-only planners)
  opens a modal with the date and every tag of that day — labels and subtitles
  in full, never clipped. It closes with Escape, the ✕ button or a click on
  the backdrop, and it is display-only: editing stays on the chips. The number
  no longer fills the day — that still happens when clicking the rest of the
  cell.

### Changed

- **Icon-only chips in small cells**: on screens up to 700 px wide and in the
  landscape layout, the month-view tag chips drop their labels and subtitles
  and show only the tag icon (🏖️ / 🪪) on a colored bar — plain tags without
  an icon keep the plain bar. The full text is one tap away in the new day
  detail modal. Wide screens keep the labels as before.
- The zoom hint now mentions the day detail: “clic en el número = detalle
  del día”.

## [0.5.0] - 2026-11-10

Month zoom on a phone: swipe to change the month, and a landscape layout
that shows the whole month on one screen.

### Added

- **Lateral scroll between months**: dragging sideways over the month zoom
  (touch or mouse, at least 48 px and clearly more horizontal than vertical)
  goes to the next month when the finger moves left and to the previous one
  when it moves right — the same as the ◀ ▶ buttons, and just as unable to
  leave the year. The click the drag leaves behind is swallowed, so a swipe
  never fills a day by mistake, and dragging across a tag chip no longer
  counts as the press-and-hold that removes it (a hold without movement
  still removes it).

### Changed

- **Landscape on phones and tablets (up to 1100 px wide)**: every week row
  of the month fits on screen at once. The grid stops scrolling internally:
  it takes the room left by the top bar and the day cells shrink to fit it,
  so the whole month is visible without any vertical scrolling inside the
  grid. The overlay itself scrolls instead — down to reach the statistics
  panel, which waits just below the fold, up to reach the top bar. The
  interaction hint is hidden here, as it already was in portrait.
- Portrait is untouched: the transposed grid and both panels still fit the
  screen with no scrolling at all.

## [0.4.0] - 2026-11-09

Fixes and polish found while testing the app on an Android phone.

### Added

- **About modal**: an ℹ️ button (left of the title, separated by a divider)
  opens a small dialog with the app version (read from `package.json`, so it
  never drifts) and a short description of how the app stores data. Closes with
  ✕, Escape or a click outside the dialog.
- **Installable PWA, works offline**: `vite-plugin-pwa` (v2, build-time only)
  generates a web manifest (`manifest.webmanifest`, ES/ES) and a precaching
  service worker (`sw.js`, 12 entries) with auto-update, so the app installs to
  the home screen and opens without a connection. Icons are square PNGs derived
  from the favicon (`icon-192.png`, `icon-512.png`); `index.html` also gained a
  `theme-color` meta tag.
- **New favicon**: the tab icon is now the calendar PNG shipped with the
  project (`synology-calendar.png`), replacing the old SVG.
- **GitHub Pages deployment**: `.github/workflows/deploy-pages.yml` builds and
  publishes `dist/` to Pages on every push to `main` (test suite runs first).
  The build uses `--base=/annual-planner/`, so the manifest, the service worker
  and every asset resolve under that sub-path: the site lives at
  `https://jfcorreas.github.io/annual-planner/` over HTTPS, which is what makes
  the PWA installable and offline-capable from a phone.

### Fixed

- **Blank screen when opened from another device**: the first render crashed
  when the built app was served over plain http from a LAN IP (e.g.
  `http://192.168.1.20:4831`), because `crypto.randomUUID` only exists in
  secure contexts. Planners and tags now fall back to an equivalent random id,
  so the app works when served over the LAN too.
- **Month view height on phones**: the month zoom was sized by the planner card
  instead of the screen, and the card is several screens tall once the year view
  wraps into columns, so the day cells stretched to ~670 px. Below 1100 px the
  zoom now covers the viewport, uses compact chrome and scrolls internally; the
  page behind no longer scrolls while it is open.
- **Month view width in portrait**: the month grid is now transposed on narrow
  screens — one row per weekday (labels in a thin column with the existing
  L M X J V S D initials) and one column per week. A 5-week month goes from
  50×127 to 67×93 px cells and a 6-week month to 55×93 px, and every week stays
  visible without scrolling. Landscape and desktop keep the 7-column grid.

### Notes

- **Secure context required**: the service worker, the install prompt and the
  offline cache work on `localhost` and `https://`, but **not** on plain
  `http://<LAN-IP>` — Chrome hides the ServiceWorker API there. Install the PWA
  from a `localhost` URL or from an HTTPS deployment.
- **Update flow**: the worker auto-updates (`skipWaiting` + `clientsClaim`),
  so after re-copying a new `dist/` to the installed web app, reload twice to
  see the new build.
- **Two bases**: the installed web app (`:4830`) is served at `/` (default
  base), while Pages uses `/annual-planner/`. `vite.config.ts` therefore lets
  the manifest `start_url`/`scope` default to Vite's base; pass
  `--base=…` only for the Pages build.

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
