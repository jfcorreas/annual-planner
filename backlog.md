# Backlog — Tags rework (v0.3.0)

Tags re-implemented from scratch. Detailed criteria per story live in the
user's tracker; the story currently being built has its approved block in
`current-plan.md`. This file is the overview of the 9 stories.

**Agreed model:** Tag = name (always shown) + color, plus the per-story flags
below. The subtitle stays per *day application* (DayTag), not on the tag (the
original spec that put it on Tag was a mistake). Clean break with v0.2.0: no
migration (active refusal = story #9). Legacy data with stray fields loads and
the fields are ignored until #9.

| #  | Story                                                             | Status             |
|----|-------------------------------------------------------------------|--------------------|
| 1  | Flat tags: name + color only, no types (editor, detail, stats)    | ✅ Done (committed)|
| 2  | Delete blocked with usage-count toast when the tag is in use      | ✅ Done (committed)|
| 3  | Statistics flag: per-tag checkbox; bars list only included tags, "Sin etiqueta" row removed | ✅ Done (committed)|
| 4  | Holiday flag (forces statistics = false, shows icon)              | ✅ Done (committed)|
| 5  | Work-license flag + max per year (icon, always in stats, apart)   | ✅ Done (committed)|
| 6  | Used/remaining counter for the work license (can go negative)     | ✅ Done (committed)|
| 7  | Global toggle: tag usable in every planner                        | ✅ Done (committed)|
| 8  | _(to confirm — details live in the tracker)_                      | ⬜ Pending         |
| 9  | Refuse data and exports from the previous version                 | ⬜ Pending         |

**Delete rule (all stories):** deleting any tag in use is blocked with a toast
showing the usage count (global tag: used in *any* planner) — implemented in
story #2.

**Story #3 status detail:** shipped — `inStats?: boolean` on the tag model
(missing = included, no migration), editor checkbox ("Incluir en
estadísticas"), statistics filtered to included tags, "Sin etiqueta" row and
its dead styles removed.

**Story #4 status detail:** shipped — `holiday?: boolean` on the tag model
(missing = not a holiday, no migration), "Día Festivo" checkbox (while
checked it disables and unchecks "Incluir en estadísticas"; unchecking it
later does NOT restore the flag until re-checked manually), 🏖️ badge before
the name everywhere the tag is listed (year chips included; tooltips keep the
plain label), and the three "Festivo …" default tags ship as holidays,
hence out of the statistics. Existing planners untouched.

**Story #5 status detail:** shipped — `permit?: boolean` + `maxPerYear?: number`
on the tag model (missing = not a permit; fields written only when it is one,
so no migration), "Permiso de trabajo" checkbox + required integer ≥ 1 "Máximo
por año" shown beside it while checked (forces "Incluir en estadísticas" on and
disabled; mutually exclusive with "Día Festivo"), 🪪 badge on every surface via
the shared `tagIcon()` helper, and statistics: permits bypass the `inStats`
filter and render in their own group at the end of the year/month bars with the
period count.

**Story #6 status detail:** shipped — the year bar's permit row renders
"U de N · Restantes R" (R = max − year count) in the `.stats__count` element,
with a red `.stats__count--negative` state when R < 0 (applications are never
blocked or capped); derived at render, so editing the max updates it with no
stored state. The month bar keeps the plain per-month count (the max is
yearly), the detail modal stays "N veces este año", and a permit tag with no
`maxPerYear` (not reachable via the editor) falls back to the plain count.

**Story #7 status detail:** shipped — `global?: boolean` on the tag model
(missing = local, no migration), "Global" checkbox last in the form, 🌐 badge
via `tagIcon(tag, {showGlobal})` in the editor list and detail modal only.
Same-id copies in every planner stay in sync through `addTag`/`updateTag`/
`removeTag`; new planners start with the defaults plus the current globals
(dedupe by id, the global version wins). Unmarking is blocked with a toast
while another planner uses the tag; otherwise the flag is cleared in every
planner, the copies stay and sync stops. Deleting is blocked with the total
usage "N días en M planificadores"; an unused global tag is removed everywhere.
Both guards live in App (it owns the toasts) over the shared
`tagUsageAcrossPlanners()` helper; the local delete rule (#2) is unchanged.

**Out of scope of the rework (unchanged):** day-chip interactions (1 click =
detail modal, double click / 600 ms hold = remove from day), 2 tags max per
day, per-day subtitles.
