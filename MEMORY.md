# MEMORY.md — Annual Planner
Project Memory between sessions. Maximum ~50 lines: summarize or remove anything that no longer adds value.

## Current Status
- v0.1.0 implemented and passing: build (`tsc -b`), oxlint, `npm test` (60 unit+component),
  `npm run test:e2e` (Playwright full flow), A4/A5 PDFs single-page landscape, mobile + touch OK.
- Installed as Omarchy web app "Annual Planner": launcher in ~/.local/share/applications,
  snapshot in ~/.local/share/annual-planner, systemd user service `annual-planner`
  (python3 http.server, 127.0.0.1:4830, enabled at login). Verified rendering in --app window.
- **Re-copy `dist/.` to `~/.local/share/annual-planner/` after each build** (see AGENTS.md).

## Decisions (and why)
- Stack: Vite + React 19 + TS + date-fns, plain CSS (user picked in plan mode).
- Tests: Vitest + jsdom + Testing Library (`npm test`), Playwright e2e (`npm run test:e2e`). User approved all deps.
- PDF = browser print with injected `@page { size: A4|A5 landscape }` (utils/print.ts).
- Storage: localStorage key `annual-planner:v1`; import MERGES by id and asks `confirm()` first.
- Max 2 tags/day; day number = apply active tag, chip click = remove that tag.
- Year view: 12 columns, days listed sequentially (no leading blanks), no L M X J V S D header.
- Default tags/colors approved via HTML sketches (/tmp/opencode/planner-sketch2.*):
  Guardia 24h #facc15, Guardia 17h #a16207, Diurno #2f6fed, Nocturno #7c5ce0,
  Turno 24h #e01b24, Festivos #86efac/#3fae6b/#15803d (yellows=guards, greens=festivos).
- Month zoom is an absolute overlay inside `.planner` (covers year view), Esc closes it.
- Print CSS: force 12 columns (`!important`) because responsive breakpoints match paper width;
  `:root` background needs `:root` selector in @media print (html/body lose specificity).
- Language rule added to AGENTS.md: work in English, UI always ES/ES.
- Versioning: `package.json` 0.1.0 + `release-notes.md` (Keep-a-Changelog, English) per AGENTS rule.

## Lessons Learned and Mistakes to Avoid
- Don't compute "did it apply" inside setState updaters: React runs them lazily/possibly twice →
  return value unreliable. Read current state in the callback instead (see useAppData.toggleDayTag).
- No setState inside updaters (side effects) — compute derived values before calling setData.
- Date tests: compare calendar fields (getDate()) not timestamps — DST makes one day 25h long.
- `npm create vite@target .` cancels on non-empty dir; create in a temp dir and move files.
- pt→px in print: A5 landscape content ≈515px tall; keep print styles compact or it spills to page 2.

## Next Steps
- User to review + commit (nothing committed yet).
